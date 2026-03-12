const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token)
        return res.status(401).json({ message: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Normalize legacy and current token shapes so downstream controllers
        // can safely read either req.user.id or req.user._id.
        const normalizedId = decoded.id || decoded._id;
        req.user = {
            ...decoded,
            id: normalizedId,
            _id: normalizedId,
        };
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

module.exports = { protect };
