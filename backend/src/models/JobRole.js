const mongoose = require("mongoose");

const jobRoleSchema = new mongoose.Schema(
    {
        roleName: {
            type: String,
            required: [true, "Role name is required"],
            trim: true,
        },

        description: {
            type: String,
            required: [true, "Job role description is required"],
            trim: true,
        },

        requiredSkills: {
            type: [String],
            default: [],
        },

        optionalSkills: {
            type: [String],
            default: [],
        },

        experienceRange: {
            min: {
                type: Number,
                default: 0,
                min: 0,
            },

            max: {
                type: Number,
                default: 0,
                min: 0,
            },
        },

        education: {
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

const JobRole = mongoose.model("JobRole", jobRoleSchema);

module.exports = JobRole;