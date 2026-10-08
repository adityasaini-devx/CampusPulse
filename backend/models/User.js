const mongoose = require("mongoose");

// User data
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
            select: false
        },
        role: {
            type: String,
            enum: ["admin", "faculty", "student"],
            default: "student"
        },
        department: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
