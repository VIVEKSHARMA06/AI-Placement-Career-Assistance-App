
const mongoose = require("mongoose");

const predictionResultSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
        },

        resumeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Resume",
            required: [true, "Resume ID is required"],
        },

        // Optional for backward compatibility with existing records.
        jobDescriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "JobDescription",
            required: false,
        },

        // Store the JD text used for this prediction.
        jobDescription: {
            type: String,
            trim: true,
            default: "",
        },

        suitabilityScore: {
            type: Number,
            required: [true, "Suitability score is required"],
            min: 0,
            max: 1,
        },

        predictionLabel: {
            type: String,
            required: [true, "Prediction label is required"],
            enum: ["Hire", "No Hire"],
        },

        limeExplanation: {
            type: [
                {
                    feature: {
                        type: String,
                        required: true,
                    },
                    weight: {
                        type: Number,
                        required: true,
                    },
                    impact: {
                        type: String,
                        enum: ["positive", "negative"],
                        required: true,
                    },
                },
            ],
            default: [],
        },

        geminiSuggestions: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

const PredictionResult = mongoose.model(
    "PredictionResult",
    predictionResultSchema
);

module.exports = PredictionResult;
