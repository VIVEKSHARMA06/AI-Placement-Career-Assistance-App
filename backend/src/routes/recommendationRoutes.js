const express = require("express");

const {
    getJobRecommendations,
    getEducationRecommendations,
} = require("../controllers/recommendationController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();


// GET /api/recommendations/jobs?resumeId=...
router.get("/jobs", protect, getJobRecommendations);


// GET /api/recommendations/education?resumeId=...
router.get(
    "/education",
    protect,
    getEducationRecommendations
);


module.exports = router;