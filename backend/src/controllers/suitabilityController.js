const Resume = require("../models/Resume");
const PredictionResult = require("../models/PredictionResult");

const { predictSuitability } = require("../services/pythonClient");

// POST /api/suitability/predict
const predictCandidateSuitability = async (req, res) => {
    try {
        const { resumeId, jobDescriptionId } = req.body;

        // 1. Validate required fields
        if (!resumeId || !jobDescriptionId) {
            return res.status(400).json({
                success: false,
                message: "resumeId and jobDescriptionId are required",
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

        // 3. Get candidate profile
        // Later, this profile will be created from the parsed resume
        const candidateProfile = resume.candidateProfile;

        if (!candidateProfile) {
            return res.status(400).json({
                success: false,
                message: "Candidate profile is not available for suitability prediction",
            });
        }

        // 4. Send data to Python FastAPI service
        const pythonResponse = await predictSuitability({
            resumeId: resume._id.toString(),
            jobDescriptionId,
            candidateProfile,
        });

        // Standard Python response:
        // {
        //   status: "success",
        //   code: 200,
        //   data: { ... }
        // }

        const result = pythonResponse.data;

        // 5. Validate Python response
        if (
            typeof result.suitabilityScore !== "number" ||
            !result.predictionLabel
        ) {
            return res.status(502).json({
                success: false,
                message: "Invalid response received from AI service",
            });
        }

        // 6. Save prediction result in MongoDB
        const predictionResult = await PredictionResult.create({
            userId: req.user.id,
            resumeId: resume._id,
            jobDescriptionId,

            suitabilityScore: result.suitabilityScore,
            predictionLabel: result.predictionLabel,

            limeExplanation: result.limeExplanation || [],

            geminiSuggestions: result.geminiSuggestions || [],
        });

        // 7. Return final response
        return res.status(200).json({
            success: true,

            suitabilityScore: result.suitabilityScore,

            predictionLabel: result.predictionLabel,

            limeExplanation: result.limeExplanation || [],

            geminiSuggestions: result.geminiSuggestions || [],

            predictionId: predictionResult._id,
        });
    } catch (error) {
        console.error("Suitability prediction error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to predict candidate suitability",
        });
    }
};

module.exports = {
    predictCandidateSuitability,
};