
const multer = require("multer");
const path = require("path");

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const createError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isPublic = true;
    return error;
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1,
    },
    fileFilter: (_req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const allowedMimeTypes = [
            "application/pdf",
            "text/plain",
            "application/x-pdf",
            "application/octet-stream",
        ];

        if (
            ![".pdf", ".txt"].includes(extension) ||
            !allowedMimeTypes.includes(file.mimetype?.toLowerCase())
        ) {
            return callback(
                createError("Only PDF and TXT job description files are allowed.")
            );
        }

        callback(null, true);
    },
}).single("jobDescriptionFile");

const uploadJobDescription = (req, res, next) => {
    upload(req, res, (error) => {
        if (error?.code === "LIMIT_FILE_SIZE") {
            return next(
                createError("Job description file must not exceed 5 MB.")
            );
        }

        if (error) {
            return next(error);
        }

        if (req.file) {
            const extension = path.extname(req.file.originalname).toLowerCase();

            if (
                extension === ".pdf" &&
                req.file.buffer.toString("ascii", 0, 5) !== "%PDF-"
            ) {
                return next(
                    createError("Uploaded job description is not a valid PDF.")
                );
            }

            if (extension === ".txt" && req.file.buffer.includes(0)) {
                return next(
                    createError("Uploaded TXT file is not valid plain text.")
                );
            }
        }

        next();
    });
};

module.exports = uploadJobDescription;
