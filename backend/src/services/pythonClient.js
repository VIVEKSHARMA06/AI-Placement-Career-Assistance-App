
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
        console.error(
            `Python API error at ${endpoint}:`,
            error.response?.data || error.message
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

module.exports = {
    recommendJobs,
    recommendEducation,
    predictSuitability,
};
