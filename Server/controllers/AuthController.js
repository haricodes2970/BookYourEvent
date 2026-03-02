const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTER
const registerUser = async (req, res) => {
    try {
        const { name, email, password, confirmPassword, phone, role } = req.body;

        // 1. Check all fields exist
        if (!name || !email || !password || !confirmPassword || !phone)
            return res.status(400).json({ message: 'Please fill all fields' });

        // 2. Password match check
        if (password !== confirmPassword)
            return res.status(400).json({ message: 'Passwords do not match' });

        // 3. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: 'Email already registered' });

        // 4. Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. Create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            role: role || 'booker'
        });

        await newUser.save();

        res.status(201).json({ message: 'Registration successful' });

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// LOGIN
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check fields
        if (!email || !password)
            return res.status(400).json({ message: 'Please fill all fields' });

        // 2. Find user
        const user = await User.findOne({ email });
        if (!user)
            return res.status(400).json({ message: 'Invalid email or password' });

        // 3. Check if account is active
        if (!user.isActive)
            return res.status(403).json({ message: 'Account suspended. Contact support.' });

        // 4. Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ message: 'Invalid email or password' });

        // 5. Generate JWT
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
                role: user.role
            }
        });

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({ users });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { registerUser, loginUser, getAllUsers };