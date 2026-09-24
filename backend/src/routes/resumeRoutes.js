const express = require("express");

const {
    uploadResume,
    getResume,
    deleteResume,
} = require("../controllers/resumeController");
const authMiddleware = require("../middleware/authMiddleware");
const uploadMiddleware = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/upload", authMiddleware, uploadMiddleware, uploadResume);
router.get("/", authMiddleware, getResume);
router.delete("/", authMiddleware, deleteResume);

module.exports = router;
