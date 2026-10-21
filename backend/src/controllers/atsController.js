
const Resume = require("../models/Resume");
const mongoose = require("mongoose");
const { analyzeResume } = require("@pranavraut033/ats-checker");

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
        const resumeText = resume.extractedText;

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
        });

        console.log("ATS DEBUG:", {
            resumeId,
            resumeTextLength: resumeText.length,
            jobDescriptionLength: jobDescription.trim().length,
        });

        console.log(
            "ATS BREAKDOWN:",
            result.breakdown
        );

        // 6. Skills required by the job description
        const skillAliases = {
            javascript: ["javascript", "js"],
            java: ["java"],
            html: ["html"],
            css: ["css"],
            "tailwind css": ["tailwind css"],
            "node.js": ["node.js", "nodejs", "node"],
            express: ["express", "express.js", "expressjs"],
            mongodb: ["mongodb", "mongo db"],
            sql: ["sql", "mysql"],
            react: ["react.js", "reactjs", "react"],
            "react-router": ["react-router", "react router"],
            typescript: ["typescript"],
            rust: ["rust"],
            python: ["python"],
        };

        const normalizeText = (text) =>
            text.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ");

        const resumeNormalized = normalizeText(resumeText);
        const jdNormalized = normalizeText(jobDescription);

        const containsSkill = (text, aliases) =>
            aliases.some((alias) => {
                const escaped = alias.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                );

                const pattern = new RegExp(
                    `(^|[^a-z0-9+#])${escaped}($|[^a-z0-9+#])`,
                    "i"
                );

                return pattern.test(text);
            });

        const requiredSkills = Object.entries(skillAliases)
            .filter(([, aliases]) =>
                containsSkill(jdNormalized, aliases)
            )
            .map(([skill]) => skill);

        const matchedSkills = requiredSkills.filter((skill) =>
            containsSkill(resumeNormalized, skillAliases[skill])
        );

        const missingSkills = requiredSkills.filter(
            (skill) => !matchedSkills.includes(skill)
        );

        // 7. Keyword gaps from the ATS package
        const keywordGaps = (result.missingKeywords || []).filter(
            (keyword) =>
                !matchedSkills.some(
                    (skill) =>
                        normalizeSkill(skill) === normalizeSkill(keyword)
                )
        );

        // 8. Return analysis to the frontend
        return res.status(200).json({
            success: true,
            atsScore: Number(result.score.toFixed(2)),
            matchedSkills,
            missingSkills,
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
        console.error("ATS analysis error:", error.message);
        return next(error);
    }
};

module.exports = {
    checkATS,
};
