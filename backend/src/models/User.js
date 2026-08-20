const mongoose = require("mongoose");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, "Full name is required."],
            trim: true,
            minlength: [2, "Full name must be at least 2 characters long."],
            maxlength: [100, "Full name must not exceed 100 characters."],
        },
        email: {
            type: String,
            required: [true, "Email is required."],
            trim: true,
            lowercase: true,
            unique: true,
            maxlength: [254, "Email must not exceed 254 characters."],
            match: [EMAIL_PATTERN, "Please provide a valid email address."],
        },
        password: {
            type: String,
            required: [true, "Password is required."],
            minlength: [8, "Password must be at least 8 characters long."],
            maxlength: [128, "Password must not exceed 128 characters."],
            select: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

userSchema.set("toJSON", {
    transform: (_document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.password;
        return returnedObject;
    },
});

module.exports = mongoose.model("User", userSchema);
