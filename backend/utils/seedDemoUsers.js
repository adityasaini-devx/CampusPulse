const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Add demo users if they do not exist
async function ensureDemoUsers() {
    const users = [
        {
            name: "Campus Admin",
            email: "admin@campus.edu",
            password: "admin@123",
            role: "admin",
            department: "Administration"
        },
        {
            name: "Campus Faculty",
            email: "faculty@campus.edu",
            password: "faculty@123",
            role: "faculty",
            department: "Computer Science"
        }
    ];

    for (const item of users) {
        const exists = await User.findOne({ email: item.email });

        if (!exists) {
            const password = await bcrypt.hash(item.password, 10);
            await User.create({ ...item, password });
            console.log(`Demo user created: ${item.email}`);
        }
    }
}

module.exports = { ensureDemoUsers };
