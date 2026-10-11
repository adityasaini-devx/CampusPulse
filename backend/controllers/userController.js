const User = require("../models/User");

// Get all users
async function listUsers(req, res, next) {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            users
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { listUsers };
