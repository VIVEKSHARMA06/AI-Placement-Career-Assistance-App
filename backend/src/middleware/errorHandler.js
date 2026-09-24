const mongoose = require("mongoose");

const errorHandler = (error, _req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    let statusCode = 500;
    let message = "An unexpected server error occurred.";

    if (error?.isPublic && Number.isInteger(error.statusCode)) {
        statusCode = error.statusCode;
        message = error.message;
    } else if (error?.code === 11000) {
        statusCode = 409;
        message = "An account with that email already exists.";
    } else if (error instanceof mongoose.Error.ValidationError) {
        statusCode = 400;
        message = "Invalid user data.";
    } else if (error instanceof mongoose.Error.CastError) {
        statusCode = 400;
        message = "Invalid request data.";
    } else if (error?.type === "entity.parse.failed") {
        statusCode = 400;
        message = "Malformed JSON request body.";
    }

    return res.status(statusCode).json({
        success: false,
        data: null,
        error: {
            message,
            details: null,
        },
    });
};

module.exports = errorHandler;
