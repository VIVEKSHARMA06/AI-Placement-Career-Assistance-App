const mongoose = require("mongoose");

const educationProgramSchema = new mongoose.Schema(
    {
        programName: {
            type: String,
            required: [true, "Program name is required"],
            trim: true,
        },

        description: {
            type: String,
            required: [true, "Program description is required"],
            trim: true,
        },

        relevantSkills: {
            type: [String],
            default: [],
        },

        eligibleDegrees: {
            type: [String],
            default: [],
        },

        eligibleBranches: {
            type: [String],
            default: [],
        },

        eligibilityCriteria: {
            type: String,
            required: [true, "Eligibility criteria is required"],
            trim: true,
        },

        entranceExam: {
            type: [String],
            default: [],
        },

        careerAreas: {
            type: [String],
            default: [],
        },

        sourceReference: {
            type: String,
            trim: true,
            default: null,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

const EducationProgram = mongoose.model(
    "EducationProgram",
    educationProgramSchema
);

module.exports = EducationProgram;