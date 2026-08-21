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
connectDB();

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});