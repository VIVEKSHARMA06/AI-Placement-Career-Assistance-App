const multer = require("multer");

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const PDF_HEADER = "%PDF-";

const createError = (message, statusCode, isPublic = true) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isPublic = isPublic;
    return error;
};

const uploadSingleResume = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
    fileFilter: (_req, file, callback) => {
        if (file.mimetype?.toLowerCase() !== "application/pdf") {
            return callback(
                createError("Only PDF files are allowed for resumes.", 400),
            );
        }

        return callback(null, true);
    },
}).single("file");

const uploadMiddleware = (req, _res, next) => {
    uploadSingleResume(req, _res, (error) => {
        if (error?.code === "LIMIT_FILE_SIZE") {
            return next(
                createError("Resume file must not exceed 5 MB.", 400),
            );
        }

        if (error) {
            return next(error);
        }

        if (
            !req.file ||
            !Buffer.isBuffer(req.file.buffer) ||
            req.file.buffer.toString("ascii", 0, PDF_HEADER.length) !==
                PDF_HEADER
        ) {
            return next(createError("Uploaded file is not a valid PDF.", 400));
        }

        return next();
    });
};

module.exports = uploadMiddleware;
