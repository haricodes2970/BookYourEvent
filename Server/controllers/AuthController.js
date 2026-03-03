const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendOTPEmail, sendWelcomeEmail } = require('../utils/emailService');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const register = async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser && existingUser.isVerified) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        if (existingUser && !existingUser.isVerified) {
            existingUser.name = name;
            existingUser.phone = phone;
            existingUser.password = password;
            existingUser.role = role || 'booker';
            existingUser.otp = otp;
            existingUser.otpExpiry = otpExpiry;
            await existingUser.save();
        } else {
            await User.create({
                name, email, password, phone,
                role: role || 'booker',
                otp, otpExpiry,
                isVerified: false
            });
        }

        await sendOTPEmail(email, name, otp);
        res.status(200).json({ message: 'OTP sent to your email. Please verify.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Registration failed', error: err.message });
    }
};

const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ message: 'Already verified. Please login.' });
        if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP. Try again.' });
        if (user.otpExpiry < new Date()) return res.status(400).json({ message: 'OTP expired. Please register again.' });

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        await sendWelcomeEmail(email, user.name);
        res.status(200).json({ message: 'Email verified! You can now login.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Verification failed', error: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Invalid email or password' });

        if (!user.isVerified) {
            return res.status(401).json({ message: 'Please verify your email first. Check your inbox.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Login failed', error: err.message });
    }
};

const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password -otp -otpExpiry');
        res.status(200).json({ users });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};

module.exports = { register, verifyOTP, login, getUsers };