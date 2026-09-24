const Resume = require("../models/Resume");
const { extractTextFromPDF } = require("../services/pdfExtractor");

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

        const extractedText = await extractTextFromPDF(req.file.buffer);
        const resume = await Resume.create({
            user: userId,
            fileName: getUploadedFileName(req.file),
            extractedText,
        });

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

const deleteResume = async (req, res, next) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const resume = await Resume.findOneAndDelete({ user: userId }).sort({
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

module.exports = {
    uploadResume,
    getResume,
    deleteResume,
};
