const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role))
            return res.status(403).json({ message: 'Access denied. Unauthorized role.' });
        next();
    };
};

const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin')
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    next();
};

module.exports = { authorizeRoles, adminOnly };