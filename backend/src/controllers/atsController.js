const Resume = require("../models/Resume");
const { analyzeResume } = require("@pranavraut033/ats-checker");

// POST /api/ats/check
const checkATS = async (req, res) => {
    try {
        const { resumeId, jobDescription } = req.body;

        // 1. Validate required fields
        if (!resumeId || !jobDescription) {
            return res.status(400).json({
                success: false,
                message: "resumeId and jobDescription are required",
            });
        }

        // 2. Validate job description
        if (typeof jobDescription !== "string" || !jobDescription.trim()) {
            return res.status(400).json({
                success: false,
                message: "Job description must be a valid non-empty string",
            });
        }

        // 3. Find only the logged-in user's resume
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

        // 4. Prefer translated/standardized English text
        const resumeText = resume.englishText || resume.originalText;

        if (!resumeText || !resumeText.trim()) {
            return res.status(400).json({
                success: false,
                message: "Resume text is not available for ATS analysis",
            });
        }

        // 5. Run ATS analysis
        const result = analyzeResume({
            resumeText,
            jobDescription: jobDescription.trim(),
        });

        // 6. Normalize package output to our project API contract
        return res.status(200).json({
            success: true,

            atsScore: Number(result.score.toFixed(2)),

            matchedSkills: result.matchedSkills || [],

            missingSkills: result.missingSkills || [],

            keywordGaps: result.missingKeywords || [],

            experienceAnalysis: {
                requiredGapYears: result.experienceGap || 0,
                parsedExperienceYears: result.parsedExperienceYears || 0,
                skillExperienceGaps: result.skillExperienceGaps || [],
            },

            educationAnalysis: {
                score: result.breakdown?.education ?? null,
            },

            suggestions: result.suggestions || [],

            warnings: result.warnings || [],
        });
    } catch (error) {
        console.error("ATS analysis error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to perform ATS analysis",
        });
    }
};

module.exports = {
    checkATS,
};