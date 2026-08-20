const express = require("express");
const cors = require("cors");

const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const errorHandler = require("./src/middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Placement Assistant API is running",
    });
});

app.use("/api/auth", authRoutes);

app.use((req, _res, next) => {
    const error = new Error("Route not found.");
    error.statusCode = 404;
    error.isPublic = true;
    next(error);
});

app.use(errorHandler);

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
