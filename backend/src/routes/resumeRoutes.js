const express = require("express");

const {
    uploadResume,
    getResume,
    getResumes,
    deleteResume,
} = require("../controllers/resumeController");
const authMiddleware = require("../middleware/authMiddleware");
const uploadMiddleware = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/upload", authMiddleware, uploadMiddleware, uploadResume);
router.get("/list", authMiddleware, getResumes);
router.get("/", authMiddleware, getResume);
router.delete("/", authMiddleware, deleteResume);
router.delete("/:resumeId", authMiddleware, deleteResume);

module.exports = router;
