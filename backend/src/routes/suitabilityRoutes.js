
const express = require("express");
const uploadJobDescription = require("../middleware/uploadJobDescription");
const {
    predictCandidateSuitability,
} = require("../controllers/suitabilityController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/suitability/predict
// Accepts JSON containing pasted JD text or an uploaded file encoded as Base64.
router.post(
    "/predict",
    protect,
    uploadJobDescription,
    predictCandidateSuitability
);

module.exports = router;
