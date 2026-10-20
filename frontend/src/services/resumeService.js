import api from "./api";

export const uploadResume = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/api/resume/upload", formData);
    return response.data;
};

export const getResume = async () => {
    const response = await api.get("/api/resume");
    return response.data;
};

export const deleteResume = async () => {
    const response = await api.delete("/api/resume");
    return response.data;
};
