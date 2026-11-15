const { processResume } = require("./pythonClient");

const createPublicError = (message, statusCode = 502) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isPublic = true;
    return error;
};

const hasValidEnglishText = (resume) => {
    if (
        typeof resume.translatedText !== "string" ||
        !resume.translatedText.trim() ||
        typeof resume.detectedLanguage !== "string" ||
        !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(resume.detectedLanguage) ||
        typeof resume.translationApplied !== "boolean"
    ) {
        return false;
    }

    if (resume.detectedLanguage === "en") {
        return (
            resume.translationApplied === false &&
            resume.translatedText === resume.extractedText
        );
    }

    return resume.translationApplied === true;
};

const getEnglishResumeText = async (resume) => {
    if (hasValidEnglishText(resume)) {
        return resume.translatedText;
    }

    if (typeof resume.extractedText !== "string" || !resume.extractedText.trim()) {
        throw createPublicError(
            "Could not read text from this PDF. It may be scanned or image-only. Upload a searchable PDF or run OCR before uploading.",
            400,
        );
    }

    let result;
    try {
        result = await processResume({
            resumeId: resume._id?.toString(),
            resumeText: resume.extractedText,
        });
    } catch (error) {
        if (error?.isPublic && Number.isInteger(error.statusCode)) {
            throw error;
        }
        throw createPublicError(
            "Resume language processing failed. Please try again.",
        );
    }

    const languageCodeValid =
        typeof result?.detectedLanguage === "string" &&
        /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(result.detectedLanguage);
    const validation = {
        responsePresent: Boolean(result),
        resumeIdMatches: result?.resumeId === resume._id?.toString(),
        originalTextMatches: result?.originalText === resume.extractedText,
        languageCodeValid,
        // FastAPI's isEnglish reports the source language, not the translation.
        sourceLanguageFlagConsistent:
            languageCodeValid &&
            result.isEnglish === (result.detectedLanguage === "en"),
        translationAppliedIsBoolean:
            typeof result?.translationApplied === "boolean",
        translatedTextNonEmpty:
            typeof result?.translatedText === "string" &&
            Boolean(result.translatedText.trim()),
        englishPassthroughConsistent:
            result?.detectedLanguage !== "en" ||
            (result.translationApplied === false &&
                result.translatedText === result.originalText),
        nonEnglishTranslationConsistent:
            result?.detectedLanguage === "en" ||
            (result?.translationApplied === true &&
                result?.translatedText !== result?.originalText),
    };
    const validResponse = Object.values(validation).every(Boolean);

    if (!validResponse) {
        const originalText =
            typeof result?.originalText === "string" ? result.originalText : "";
        const translatedText =
            typeof result?.translatedText === "string" ? result.translatedText : "";
        console.warn("Resume processing response validation failed.", {
            validation,
            detectedLanguage:
                typeof result?.detectedLanguage === "string"
                    ? result.detectedLanguage
                    : null,
            isEnglish:
                typeof result?.isEnglish === "boolean" ? result.isEnglish : null,
            translationApplied:
                typeof result?.translationApplied === "boolean"
                    ? result.translationApplied
                    : null,
            extractedTextLength:
                typeof resume.extractedText === "string"
                    ? resume.extractedText.length
                    : null,
            originalTextLength: originalText.length,
            translatedTextLength: translatedText.length,
            originalEqualsExtracted: originalText === resume.extractedText,
            originalEqualsTranslated: originalText === translatedText,
            translatedContainsDevanagari: /[\u0900-\u097F]/.test(translatedText),
        });
        throw createPublicError(
            "Resume language service returned an invalid English translation.",
        );
    }

    // Keep extractedText as the original PDF text; translation is stored separately.
    resume.translatedText = result.translatedText;
    resume.detectedLanguage = result.detectedLanguage;
    resume.translationApplied = result.translationApplied;

    if (!resume.isNew) {
        try {
            await resume.save();
        } catch {
            throw createPublicError(
                "English resume text was created but could not be saved. Please retry.",
                503,
            );
        }
    }

    return resume.translatedText;
};

module.exports = {
    getEnglishResumeText,
    hasValidEnglishText,
};
