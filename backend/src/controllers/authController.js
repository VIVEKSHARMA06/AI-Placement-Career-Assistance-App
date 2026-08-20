const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const config = require("../config/env");
const User = require("../models/User");

const SALT_ROUNDS = 12;
const JWT_EXPIRES_IN = "24h";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createError = (message, statusCode, isPublic = true) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isPublic = isPublic;
    return error;
};

const normalizeEmail = (email) => email.trim().toLowerCase();

const getRequestBody = (body) => {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw createError("Request body must be a JSON object.", 400);
    }

    return body;
};

const validateEmail = (email) =>
    typeof email === "string" &&
    email.trim().length > 0 &&
    email.trim().length <= 254 &&
    EMAIL_PATTERN.test(email.trim());

const validatePassword = (password) =>
    typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 128 &&
    !/\s/.test(password) &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

const getJwtSecret = () => {
    if (!config.JWT_SECRET || typeof config.JWT_SECRET !== "string") {
        throw createError("Authentication service is unavailable.", 500, false);
    }

    return config.JWT_SECRET;
};

const createToken = (userId) =>
    jwt.sign({ id: userId.toString() }, getJwtSecret(), {
        expiresIn: JWT_EXPIRES_IN,
    });

const toSafeUser = (user) => ({
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
});

const sendAuthResponse = (res, user, statusCode) => {
    res.status(statusCode).json({
        success: true,
        data: {
            token: createToken(user._id),
            user: toSafeUser(user),
        },
        error: null,
    });
};

const register = async (req, res, next) => {
    try {
        const { fullName, email, password } = getRequestBody(req.body);

        if (
            typeof fullName !== "string" ||
            fullName.trim().length === 0 ||
            !validateEmail(email) ||
            !validatePassword(password)
        ) {
            throw createError(
                "Full name, a valid email, and a password of 8-128 characters containing a letter, a number, and a special character with no spaces are required.",
                400,
            );
        }

        const normalizedEmail = normalizeEmail(email);
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            throw createError(
                "An account with that email already exists.",
                409,
            );
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await User.create({
            fullName: fullName.trim(),
            email: normalizedEmail,
            password: hashedPassword,
        });

        sendAuthResponse(res, user, 201);
    } catch (error) {
        if (error && error.code === 11000) {
            return next(
                createError("An account with that email already exists.", 409),
            );
        }

        return next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = getRequestBody(req.body);

        if (
            typeof email !== "string" ||
            email.trim().length === 0 ||
            typeof password !== "string" ||
            password.trim().length === 0
        ) {
            throw createError("Email and password are required.", 400);
        }

        if (!validateEmail(email) || !validatePassword(password)) {
            throw createError("Invalid request data.", 400);
        }

        const normalizedEmail = normalizeEmail(email);
        const user = await User.findOne({ email: normalizedEmail }).select(
            "+password",
        );
        const passwordMatches = user
            ? await bcrypt.compare(password, user.password)
            : false;

        if (!user || !passwordMatches) {
            throw createError("Invalid email or password.", 401);
        }

        sendAuthResponse(res, user, 200);
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    register,
    login,
};
