// Send a response for API errors
function errorHandler(error, req, res, next) {
    console.error(error);

    if (error.name === "ValidationError") {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: Object.values(error.errors).map(e => e.message)
        });
    }

    if (error.code === 11000) {
        return res.status(409).json({
            success: false,
            message: "Duplicate value already exists"
        });
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error"
    });
}

module.exports = errorHandler;
