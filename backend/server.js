const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./src/config/db");

// =================================
// MEMBER 2 ROUTES
// =================================
const atsRoutes = require("./src/routes/atsRoutes");
const recommendationRoutes = require("./src/routes/recommendationRoutes");
const suitabilityRoutes = require("./src/routes/suitabilityRoutes");
const authRoutes = require("./src/routes/authRoutes");
const resumeRoutes = require("./src/routes/resumeRoutes");
const errorHandler = require("./src/middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());


// =================================
// HOME ROUTE
// =================================
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Placement Assistant API is running",
    });
});


// =================================
// MEMBER 2 API ROUTES
// =================================

// ATS Analysis
app.use("/api/ats", atsRoutes);



// Job + Education Recommendations
app.use("/api/recommendations", recommendationRoutes);

// Candidate Suitability Prediction
app.use("/api/suitability", suitabilityRoutes);


// =================================
// DATABASE CONNECTION
// =================================
app.use("/api/auth", authRoutes);
app.use("/api/resume", resumeRoutes);

app.use((req, _res, next) => {
    const error = new Error("Route not found.");
    error.statusCode = 404;
    error.isPublic = true;
    next(error);
});

app.use(errorHandler);

connectDB();

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});