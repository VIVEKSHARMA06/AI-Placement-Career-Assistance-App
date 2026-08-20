const axios = require("axios");

const PYTHON_API_URL =
    process.env.PYTHON_API_URL || "http://localhost:8000";

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
    jobDescriptionId,
    candidateProfile,
}) => {
    return await callPythonAPI("/suitability/predict", {
        resumeId,
        jobDescriptionId,
        candidateProfile,
    });
};


module.exports = {
    recommendJobs,
    recommendEducation,
    predictSuitability,
};