const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendOTPEmail, sendWelcomeEmail } = require('../utils/emailService');

const USERNAME_REGEX = /^[a-z0-9._]{3,24}$/;

const generateToken = (user) =>
    jwt.sign(
        {
            id: user._id,
            role: user.role,
            name: user.name,
            email: user.email,
            username: user.username || '',
            avatar: user.avatar || '',
        },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );

const normalizeEmail = (value = '') => value.trim().toLowerCase();

const normalizeUsername = (value = '') =>
    value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9._]/g, '');

const createAvatarUrl = (name = 'User') =>
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;

const toSafeUser = (user) => ({
    id: user._id,
    name: user.name,
    username: user.username || '',
    email: user.email,
    avatar: user.avatar || '',
    role: user.role,
    paymentDetails: user.paymentDetails,
});

const generateUniqueUsername = async (seed, excludeId = null) => {
    const baseRaw = normalizeUsername(seed || 'user');
    const base = baseRaw.length >= 3 ? baseRaw.slice(0, 24) : `user${baseRaw}`.slice(0, 24);

    let candidate = base;
    let counter = 0;

    while (true) {
        const existing = await User.findOne({
            username: candidate,
            ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        }).select('_id');

        if (!existing) {
            return candidate;
        }

        counter += 1;
        const suffix = `${counter}`;
        candidate = `${base.slice(0, Math.max(3, 24 - suffix.length))}${suffix}`;
    }
};

const ensureIdentityFields = async (user) => {
    let changed = false;

    if (!user.username) {
        const seed = user.name || user.email?.split('@')[0] || 'user';
        user.username = await generateUniqueUsername(seed, user._id);
        changed = true;
    }

    if (!user.avatar) {
        user.avatar = createAvatarUrl(user.name);
        changed = true;
    }

    if (changed) {
        await user.save();
    }

    return user;
};

const register = async (req, res) => {
    try {
        const { name, username, email, password, phone, role } = req.body;
        const normalizedEmail = normalizeEmail(email);
        const normalizedUsername = normalizeUsername(username);

        if (!name || !normalizedUsername || !normalizedEmail || !password || !phone) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (!USERNAME_REGEX.test(normalizedUsername)) {
            return res.status(400).json({
                message:
                    'Username must be 3-24 chars and can include lowercase letters, numbers, dot, and underscore.',
            });
        }

        const [emailExists, usernameExists] = await Promise.all([
            User.findOne({ email: normalizedEmail }).select('_id'),
            User.findOne({ username: normalizedUsername }).select('_id'),
        ]);

        if (emailExists) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        if (usernameExists) {
            return res.status(400).json({ message: 'Username is already taken' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        await User.create({
            name,
            username: normalizedUsername,
            email: normalizedEmail,
            password,
            phone,
            role: role || 'booker',
            otp,
            otpExpiry,
            avatar: createAvatarUrl(name),
        });

        await sendOTPEmail(normalizedEmail, name, otp);

        res.status(201).json({
            message: 'OTP sent to your email. Please verify.',
            email: normalizedEmail,
        });
    } catch (err) {
        if (err.code === 11000 && err.keyPattern?.username) {
            return res.status(400).json({ message: 'Username is already taken' });
        }

        if (err.code === 11000 && err.keyPattern?.email) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const normalizedEmail = normalizeEmail(email);
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Already verified' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (new Date() > user.otpExpiry) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;

        await ensureIdentityFields(user);
        await user.save();

        await sendWelcomeEmail(normalizedEmail, user.name);

        const token = generateToken(user);
        res.status(200).json({
            message: 'Email verified!',
            token,
            user: toSafeUser(user),
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { identifier, email, username, password } = req.body;
        const rawIdentifier = (identifier || email || username || '').trim();

        if (!rawIdentifier || !password) {
            return res.status(400).json({ message: 'Identifier and password are required' });
        }

        const user = rawIdentifier.includes('@')
            ? await User.findOne({ email: normalizeEmail(rawIdentifier) })
            : await User.findOne({ username: normalizeUsername(rawIdentifier) });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.isVerified) {
            return res.status(401).json({ message: 'Please verify your email first' });
        }

        const match = await user.comparePassword(password);
        if (!match) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        await ensureIdentityFields(user);

        const token = generateToken(user);
        res.status(200).json({
            message: 'Login successful',
            token,
            user: toSafeUser(user),
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -otp -otpExpiry');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.username || !user.avatar) {
            await ensureIdentityFields(user);
        }

        res.status(200).json({ user });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const savePaymentDetails = async (req, res) => {
    try {
        const { paymentType, upiId, accountName, accountNo, ifsc, bankName } = req.body;

        if (!paymentType || !['upi', 'bank'].includes(paymentType)) {
            return res.status(400).json({ message: 'Payment type must be upi or bank' });
        }

        if (paymentType === 'upi' && !upiId) {
            return res.status(400).json({ message: 'UPI ID is required' });
        }

        if (paymentType === 'bank' && (!accountName || !accountNo || !ifsc || !bankName)) {
            return res.status(400).json({ message: 'All bank details are required' });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { paymentDetails: { paymentType, upiId, accountName, accountNo, ifsc, bankName } },
            { new: true }
        ).select('-password -otp -otpExpiry');

        res.status(200).json({ message: 'Payment details saved!', paymentDetails: user.paymentDetails });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: normalizeEmail(email) });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        await user.save();
        await sendOTPEmail(user.email, user.name, otp);

        res.status(200).json({ message: 'OTP sent to your email' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ email: normalizeEmail(email) });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (new Date() > user.otpExpiry) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        user.password = newPassword;
        user.otp = undefined;
        user.otpExpiry = undefined;

        await user.save();
        res.status(200).json({ message: 'Password reset successful' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password -otp -otpExpiry').sort({ createdAt: -1 });
        res.status(200).json({ count: users.length, users });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
        res.status(200).json({ message: 'Role updated', user });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = {
    register,
    verifyOTP,
    login,
    getMe,
    savePaymentDetails,
    forgotPassword,
    resetPassword,
    getUsers,
    deleteUser,
    updateUserRole,
    normalizeUsername,
    createAvatarUrl,
    generateUniqueUsername,
};
