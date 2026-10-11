const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Check the user's token
async function auth(req, res, next) {
    try {
        const header = req.headers.authorization;

        if (!header) {
            return res.status(401).json({
                success: false,
                message: "Authorization token required"
            });
        }

        const token = header.toLowerCase().startsWith("bearer ")
            ? header.replace(/^Bearer\s+/i, "")
            : header.trim();

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authorization token required"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User no longer exists"
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
}

// Check the user's role
function allowRoles(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission for this action"
            });
        }
        next();
    };
}

module.exports = { auth, allowRoles };
