
const Resume = require("../models/Resume");
const mongoose = require("mongoose");
const { analyzeResume } = require("@pranavraut033/ats-checker");
const { getEnglishResumeText } = require("../services/resumeTextService");

const createError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isPublic = true;
    return error;
};

// Normalize skill names for comparison
const normalizeSkill = (skill) =>
    skill
        .toLowerCase()
        .replace(/[^a-z0-9+#]/g, "");

// POST /api/ats/check
const checkATS = async (req, res, next) => {
    try {
        const { resumeId, jobDescription } = req.body;

        // 1. Validate required fields
        if (!resumeId || !jobDescription) {
            return res.status(400).json({
                success: false,
                message: "resumeId and jobDescription are required",
            });
        }

        if (!mongoose.isValidObjectId(resumeId)) {
            throw createError(
                "resumeId must be a valid MongoDB ObjectId.",
                400
            );
        }

        // 2. Validate job description
        if (
            typeof jobDescription !== "string" ||
            !jobDescription.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Job description must be a valid non-empty string",
            });
        }

        // 3. Find the logged-in user's resume
        const resume = await Resume.findOne({
            _id: resumeId,
            user: req.user.id,
        });

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found",
            });
        }

        // 4. Extract resume text
        const resumeText = await getEnglishResumeText(resume);

        if (
            typeof resumeText !== "string" ||
            !resumeText.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Resume text is not available for ATS analysis",
            });
        }

        // 5. Run ATS analysis
        const result = analyzeResume({
            resumeText,
            jobDescription: jobDescription.trim(),
            config: {
                profile: {
                    name: "job-description",
                    mandatorySkills: [],
                    optionalSkills: [],
                    minExperience: 0,
                },
            },
        });

        // 6. Combine the analyzer's skill taxonomy with its broader job keywords.
        const uniqueRequirements = (...groups) => {
            const seen = new Set();
            return groups
                .flatMap((group) => (Array.isArray(group) ? group : []))
                .filter((item) => typeof item === "string" && item.trim())
                .map((item) => item.trim())
                .filter((item) => {
                    const key = normalizeSkill(item);
                    if (!key || seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
        };

        const matchedSkills = uniqueRequirements(result.matchedSkills);
        const missingSkills = uniqueRequirements(result.missingSkills);
        const matchedRequirements = uniqueRequirements(
            matchedSkills,
            result.matchedKeywords,
        );
        const matchedRequirementKeys = new Set(
            matchedRequirements.map(normalizeSkill),
        );
        const missingRequirements = uniqueRequirements(
            missingSkills,
            result.missingKeywords,
        ).filter((item) => !matchedRequirementKeys.has(normalizeSkill(item)));
        const keywordGaps = uniqueRequirements(result.missingKeywords).filter(
            (item) => !matchedRequirementKeys.has(normalizeSkill(item)),
        );

        // 8. Return analysis to the frontend
        return res.status(200).json({
            success: true,
            atsScore: Number(result.score.toFixed(2)),
            matchedSkills,
            missingSkills,
            matchedRequirements,
            missingRequirements,
            keywordGaps,

            experienceAnalysis: {
                requiredGapYears: result.experienceGap || 0,
                parsedExperienceYears:
                    result.parsedExperienceYears || 0,
                skillExperienceGaps:
                    result.skillExperienceGaps || [],
            },

            educationAnalysis: {
                score: result.breakdown?.education ?? null,
            },

            suggestions: result.suggestions || [],
            warnings: result.warnings || [],
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    checkATS,
};
