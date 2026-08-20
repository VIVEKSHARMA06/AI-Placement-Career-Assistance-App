require("dotenv").config();

module.exports = {
    PORT: process.env.PORT || 5000,
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    PYTHON_SERVICE_URL:
        process.env.PYTHON_SERVICE_URL || "http://localhost:8000",
};
