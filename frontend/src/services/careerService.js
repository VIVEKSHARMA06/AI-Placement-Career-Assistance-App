
import api from "./api";

/**
 * Career Service
 * Uses the existing Axios instance from services/api.js.
 */

// 1. ATS Resume Analysis
export const checkATS = async ({ resumeId, jobDescription }) => {
    if (!resumeId) {
        throw new Error("Resume ID is required for ATS analysis.");
    }

    if (!jobDescription?.trim()) {
        throw new Error("Please provide a job description.");
    }

    const response = await api.post("/api/ats/check", {
        resumeId,
        jobDescription: jobDescription.trim(),
    });

    return response.data;
};

// 2. Job Recommendations
export const getJobRecommendations = async (resumeId) => {
    if (!resumeId) {
        throw new Error("Resume ID is required for job recommendations.");
    }

    const response = await api.get("/api/recommendations/jobs", {
        params: { resumeId },
    });

    return response.data;
};

// 3. Higher Education Recommendations
export const getEducationRecommendations = async (resumeId) => {
    if (!resumeId) {
        throw new Error(
            "Resume ID is required for education recommendations."
        );
    }

    const response = await api.get("/api/recommendations/education", {
        params: { resumeId },
    });

    return response.data;
};

// 4. Candidate Suitability Prediction
// POST /api/suitability/predict
// FormData: resumeId, jobDescription, candidateProfile, jobDescriptionFile (optional)
export const predictSuitability = async (formData) => {
    if (!(formData instanceof FormData)) {
        throw new Error("Suitability request must contain FormData.");
    }

    if (!formData.get("resumeId")) {
        throw new Error("Resume ID is required for suitability prediction.");
    }

    if (
        !formData.get("jobDescription")?.trim() &&
        !formData.get("jobDescriptionFile")
    ) {
        throw new Error("Please paste a job description or upload a JD file.");
    }

    if (!formData.get("candidateProfile")) {
        throw new Error("Candidate profile is required.");
    }

    const response = await api.post(
        "/api/suitability/predict",
        formData
    );

    return response.data;
};

// Default export
const careerService = {
    checkATS,
    getJobRecommendations,
    getEducationRecommendations,
    predictSuitability,
};

export default careerService;
