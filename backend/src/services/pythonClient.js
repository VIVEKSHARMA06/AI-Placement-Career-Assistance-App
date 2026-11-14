
const axios = require("axios");

const PYTHON_API_URL =
    process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

// Create axios client for Python/FastAPI service
const pythonAPI = axios.create({
    baseURL: PYTHON_API_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Generic function to handle Python API requests
const callPythonAPI = async (endpoint, data) => {
    try {
        const response = await pythonAPI.post(endpoint, data);
        return response.data;
    } catch (error) {
        // Do not log provider responses or request payloads; they may contain resume data.
        console.error(
            `Python API request failed at ${endpoint} (HTTP ${error.response?.status || "network error"}).`,
        );

        const message =
            error.response?.data?.message ||
            error.response?.data?.detail ||
            "Python AI service is unavailable";

        throw new Error(message);
    }
};

// ==========================================
// JOB RECOMMENDATION
// ==========================================
const recommendJobs = async ({ resumeId, resumeText }) => {
    return await callPythonAPI("/recommend/jobs", {
        resumeId,
        resumeText,
    });
};

// ==========================================
// EDUCATION RECOMMENDATION
// ==========================================
const recommendEducation = async ({ resumeId, resumeText }) => {
    return await callPythonAPI("/recommend/education", {
        resumeId,
        resumeText,
    });
};

// ==========================================
// CANDIDATE SUITABILITY PREDICTION
// ==========================================
const predictSuitability = async ({
    resumeId,
    jobDescription,
    jobDescriptionFile,
    candidateProfile,
}) => {
    const payload = {
        resumeId,
        jobDescription,
        candidateProfile,
    };

    // Forward file metadata and Base64 content if a file was uploaded.
    // The Python API must implement support for this field.
    if (jobDescriptionFile) {
        payload.jobDescriptionFile = {
            originalName: jobDescriptionFile.originalName,
            mimeType: jobDescriptionFile.mimeType,
            contentBase64: jobDescriptionFile.buffer.toString("base64"),
        };
    }

    return await callPythonAPI("/suitability/predict", payload);
};

// Resume translation may include bounded Azure retries, so allow more time than
// the default timeout used by the other AI endpoints.
const processResume = async ({ resumeId, resumeText }) => {
    try {
        const response = await pythonAPI.post(
            "/resume/process",
            { resumeId, resumeText },
            { timeout: 120000 },
        );
        return response.data;
    } catch (error) {
        const statusCode = error.response?.status;
        const safeError = new Error(
            statusCode === 503
                ? "Resume language processing is not configured or temporarily unavailable."
                : statusCode === 422
                    ? "Resume language could not be processed or is unsupported."
                    : statusCode
                        ? `Resume language processing failed (AI service HTTP ${statusCode}).`
                        : "Resume language service could not be reached. Please try again.",
        );
        safeError.statusCode =
            statusCode === 422 ? 422 : statusCode === 503 ? 503 : 502;
        safeError.isPublic = true;
        throw safeError;
    }
};

module.exports = {
    processResume,
    recommendJobs,
    recommendEducation,
    predictSuitability,
};
