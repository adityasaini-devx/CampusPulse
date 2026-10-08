require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");

const connectDB = require("./config/db");
const { ensureDemoUsers } = require("./utils/seedDemoUsers");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL
        ? process.env.CLIENT_URL.split(",").map(v => v.trim())
        : true,
    credentials: true
}));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.resolve(process.env.UPLOAD_DIR || "uploads")));
app.use(morgan("dev"));

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
}));

// Routes
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "CampusPulse API is running",
        version: "1.0.0"
    });
});

app.get("/api/v1/health", (req, res) => {
    res.json({
        success: true,
        service: "campuspulse-backend",
        database: "connected"
    });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/complaints", complaintRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/users", userRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

app.use(errorHandler);

// Start the server after connecting to the database
async function startServer() {
    try {
        await connectDB();
        await ensureDemoUsers();

        server.listen(PORT, () => {
            console.log(`CampusPulse backend running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

startServer();
