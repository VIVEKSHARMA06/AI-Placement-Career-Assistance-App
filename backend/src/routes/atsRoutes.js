const express = require("express");

const {
    checkATS,
} = require("../controllers/atsController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();


// POST /api/ats/check
router.post("/check", protect, checkATS);


module.exports = router;