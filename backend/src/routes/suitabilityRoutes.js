const express = require("express");

const {
    predictCandidateSuitability,
} = require("../controllers/suitabilityController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();


// POST /api/suitability/predict
router.post(
    "/predict",
    protect,
    predictCandidateSuitability
);


module.exports = router;