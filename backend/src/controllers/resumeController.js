const Resume = require("../models/Resume");
const mongoose = require("mongoose");
const { extractTextFromPDF } = require("../services/pdfExtractor");
const { getEnglishResumeText } = require("../services/resumeTextService");
const { extractResumeProfile } = require("../services/pythonClient");
const MAX_RESUMES_PER_USER = 5;

const createError = (message, statusCode, isPublic = true) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isPublic = isPublic;
    return error;
};

const getAuthenticatedUserId = (req) => {
    const userId = req.user?.id;

    if (typeof userId !== "string" || userId.trim().length === 0) {
        throw createError("Authentication is required.", 401);
    }

    return userId;
};

const getUploadedFileName = (file) => {
    const fileName = file.originalname?.trim();

    if (!fileName) {
        throw createError("Uploaded resume is missing a file name.", 400);
    }

    return fileName;
};

const uploadResume = async (req, res, next) => {
    try {
        const userId = getAuthenticatedUserId(req);

        if (!req.file) {
            throw createError("Resume file is required.", 400);
        }

        const resumeCount = await Resume.countDocuments({ user: userId });
        if (resumeCount >= MAX_RESUMES_PER_USER) {
            throw createError(
                "You can save up to 5 resumes. Delete one before uploading another.",
                409,
            );
        }

        const extractedText = await extractTextFromPDF(req.file.buffer);
        const resume = new Resume({
            user: userId,
            fileName: getUploadedFileName(req.file),
            extractedText,
        });

        await getEnglishResumeText(resume);

        // Extract from translated English text for every source language.
        try {
            const englishText = resume.translatedText;
            if (englishText && englishText.trim()) {
                const extraction = await extractResumeProfile({
                    resumeId: resume._id.toString(),
                    resumeText: englishText,
                });
                if (extraction && extraction.profile) {
                    resume.structuredProfile = extraction.profile;
                }
            }
        } catch (extractionError) {
            // Keep uploads available, but make failures visible in the Node terminal.
            console.error(
                `Resume profile extraction failed for resume ${resume._id}: ${extractionError.message}`,
            );
        }

        await resume.save();

        return res.status(201).json({
            success: true,
            data: { resume },
            error: null,
        });
    } catch (error) {
        return next(error);
    }
};

const getResume = async (req, res, next) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const resume = await Resume.findOne({ user: userId }).sort({
            createdAt: -1,
        });

        if (!resume) {
            throw createError("Resume not found.", 404);
        }

        return res.status(200).json({
            success: true,
            data: { resume },
            error: null,
        });
    } catch (error) {
        return next(error);
    }
};

const getResumes = async (req, res, next) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const resumes = await Resume.find({ user: userId }).sort({
            createdAt: -1,
        });

        return res.status(200).json({
            success: true,
            data: { resumes },
            error: null,
        });
    } catch (error) {
        return next(error);
    }
};

const deleteResume = async (req, res, next) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const resumeId = req.params.resumeId;
        if (resumeId && !mongoose.isValidObjectId(resumeId)) {
            throw createError("Resume ID is invalid.", 400);
        }

        const query = Resume.findOneAndDelete({
            user: userId,
            ...(resumeId ? { _id: resumeId } : {}),
        });
        const resume = resumeId
            ? await query
            : await query.sort({ createdAt: -1 });

        if (!resume) {
            throw createError("Resume not found.", 404);
        }

        return res.status(200).json({
            success: true,
            data: { resume },
            error: null,
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    uploadResume,
    getResume,
    getResumes,
    deleteResume,
};
