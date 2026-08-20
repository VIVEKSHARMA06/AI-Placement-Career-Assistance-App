const Resume = require("../models/Resume");
const { recommendJobs, recommendEducation } = require("../services/pythonClient");


// ==========================================
// GET /api/recommendations/jobs?resumeId=...
// ==========================================
const getJobRecommendations = async (req, res) => {
    try {
        const { resumeId } = req.query;

        // 1. Validate resumeId
        if (!resumeId) {
            return res.status(400).json({
                success: false,
                message: "resumeId is required",
            });
        }

        // 2. Find resume and verify ownership
        const resume = await Resume.findOne({
            _id: resumeId,
            userId: req.user.id,
        });

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found",
            });
        }

        // 3. Get standardized English resume text
        const resumeText = resume.englishText || resume.originalText;

        if (!resumeText || !resumeText.trim()) {
            return res.status(400).json({
                success: false,
                message: "Resume text is not available for recommendations",
            });
        }

        // 4. Send resume text to Python SBERT service
        const result = await recommendJobs({
            resumeId: resume._id.toString(),
            resumeText,
        });

        // 5. Return recommendations
        return res.status(200).json({
            success: true,
            resumeId: resume._id,
            recommendations: result.recommendations || [],
        });

    } catch (error) {
        console.error("Job recommendation error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to get job recommendations",
        });
    }
};


// ===============================================
// GET /api/recommendations/education?resumeId=...
// ===============================================
const getEducationRecommendations = async (req, res) => {
    try {
        const { resumeId } = req.query;

        // 1. Validate resumeId
        if (!resumeId) {
            return res.status(400).json({
                success: false,
                message: "resumeId is required",
            });
        }

        // 2. Find resume and verify ownership
        const resume = await Resume.findOne({
            _id: resumeId,
            userId: req.user.id,
        });

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found",
            });
        }

        // 3. Get standardized English resume text
        const resumeText = resume.englishText || resume.originalText;

        if (!resumeText || !resumeText.trim()) {
            return res.status(400).json({
                success: false,
                message: "Resume text is not available for recommendations",
            });
        }

        // 4. Send resume text to Python SBERT service
        const result = await recommendEducation({
            resumeId: resume._id.toString(),
            resumeText,
        });

        // 5. Return recommendations
        return res.status(200).json({
            success: true,
            resumeId: resume._id,
            recommendations: result.recommendations || [],
        });

    } catch (error) {
        console.error("Education recommendation error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to get education recommendations",
        });
    }
};


module.exports = {
    getJobRecommendations,
    getEducationRecommendations,
};