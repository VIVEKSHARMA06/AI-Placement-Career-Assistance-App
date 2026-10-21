
const Resume = require("../models/Resume");
const PredictionResult = require("../models/PredictionResult");

const { predictSuitability } = require("../services/pythonClient");

const predictCandidateSuitability = async (req, res) => {
    try {
        const body = req.body || {};
        const { resumeId } = body;

        if (!resumeId) {
            return res.status(400).json({
                success: false,
                message: "Resume ID is required.",
            });
        }

        const jobDescription =
            typeof body.jobDescription === "string"
                ? body.jobDescription.trim()
                : "";

        const jobDescriptionFile = req.file || null;

        if (!jobDescription && !jobDescriptionFile) {
            return res.status(400).json({
                success: false,
                message: "Paste a job description or upload a PDF/TXT file.",
            });
        }

        const resume = await Resume.findOne({
            _id: resumeId,
            user: req.user.id,
        });

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found.",
            });
        }

        let candidateProfile = body.candidateProfile;

        if (typeof candidateProfile === "string") {
            try {
                candidateProfile = JSON.parse(candidateProfile);
            } catch {
                return res.status(400).json({
                    success: false,
                    message: "Invalid candidate profile format.",
                });
            }
        }

        if (
            !candidateProfile ||
            typeof candidateProfile !== "object" ||
            Array.isArray(candidateProfile)
        ) {
            return res.status(400).json({
                success: false,
                message: "Candidate profile is missing or invalid.",
            });
        }

        // The existing Python service must support this new request format.
        const pythonResponse = await predictSuitability({
            resumeId: resume._id.toString(),
            jobDescription,
            jobDescriptionFile: jobDescriptionFile
                ? {
                    originalName: jobDescriptionFile.originalname,
                    mimeType: jobDescriptionFile.mimetype,
                    buffer: jobDescriptionFile.buffer,
                }
                : null,
            candidateProfile,
        });

        const result = pythonResponse?.data;

        if (
            !result ||
            typeof result.suitabilityScore !== "number" ||
            !result.predictionLabel
        ) {
            return res.status(502).json({
                success: false,
                message: "Invalid response received from AI service.",
            });
        }

        const predictionResult = await PredictionResult.create({
            userId: req.user.id,
            resumeId: resume._id,
            jobDescription,
            suitabilityScore: result.suitabilityScore,
            predictionLabel: result.predictionLabel,
            limeExplanation: result.limeExplanation || [],
            geminiSuggestions: result.geminiSuggestions || [],
        });

        return res.status(200).json({
            success: true,
            suitabilityScore: result.suitabilityScore,
            predictionLabel: result.predictionLabel,
            limeExplanation: result.limeExplanation || [],
            geminiSuggestions: result.geminiSuggestions || [],
            predictionId: predictionResult._id,
        });
    } catch (error) {
        console.error("Suitability prediction error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.isPublic && error.message
                    ? error.message
                    : "Unable to predict candidate suitability.",
        });
    }
};

module.exports = {
    predictCandidateSuitability,
};
