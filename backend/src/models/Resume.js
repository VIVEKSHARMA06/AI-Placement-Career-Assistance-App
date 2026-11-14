const mongoose = require("mongoose");

const FILE_NAME_MAX_LENGTH = 255;
const EXTRACTED_TEXT_MAX_LENGTH = 500000;

const resumeSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Resume owner is required."],
            immutable: true,
            index: true,
        },
        fileName: {
            type: String,
            required: [true, "Resume file name is required."],
            trim: true,
            maxlength: [
                FILE_NAME_MAX_LENGTH,
                `Resume file name must not exceed ${FILE_NAME_MAX_LENGTH} characters.`,
            ],
        },
        extractedText: {
            type: String,
            default: "",
            maxlength: [
                EXTRACTED_TEXT_MAX_LENGTH,
                `Extracted resume text must not exceed ${EXTRACTED_TEXT_MAX_LENGTH} characters.`,
            ],
        },
        translatedText: {
            type: String,
            maxlength: [
                EXTRACTED_TEXT_MAX_LENGTH,
                `Translated resume text must not exceed ${EXTRACTED_TEXT_MAX_LENGTH} characters.`,
            ],
        },
        detectedLanguage: {
            type: String,
            match: [
                /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/,
                "Detected language must be a language code.",
            ],
        },
        translationApplied: {
            type: Boolean,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

resumeSchema.set("toJSON", {
    transform: (_document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        return returnedObject;
    },
});

module.exports = mongoose.model("Resume", resumeSchema);
