const mongoose = require("mongoose");

// Connect to MongoDB
async function connectDB() {
    const mongoUrl = process.env.MONGODB_URL;

    if (!mongoUrl) {
        throw new Error("MONGODB_URL is missing in .env");
    }

    await mongoose.connect(mongoUrl);

    console.log("MongoDB connected");
}

module.exports = connectDB;
