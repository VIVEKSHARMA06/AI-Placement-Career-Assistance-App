const jwt = require("jsonwebtoken");

const config = require("../config/env");

const createError = (message, statusCode, isPublic = true) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isPublic = isPublic;
    return error;
};

const authMiddleware = (req, _res, next) => {
    const authorization = req.get("Authorization");

    if (!authorization) {
        return next(createError("Authentication token is required.", 401));
    }

    const [scheme, token, ...extraParts] = authorization.trim().split(/\s+/);

    if (
        scheme?.toLowerCase() !== "bearer" ||
        !token ||
        extraParts.length > 0
    ) {
        return next(createError("Invalid authentication header.", 401));
    }

    if (!config.JWT_SECRET || typeof config.JWT_SECRET !== "string") {
        return next(
            createError("Authentication service is unavailable.", 500, false),
        );
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);

        if (
            !decoded ||
            typeof decoded !== "object" ||
            typeof decoded.id !== "string" ||
            decoded.id.length === 0
        ) {
            return next(createError("Invalid or expired token.", 401));
        }

        req.user = { id: decoded.id };
        return next();
    } catch (_error) {
        return next(createError("Invalid or expired token.", 401));
    }
};

module.exports = authMiddleware;
