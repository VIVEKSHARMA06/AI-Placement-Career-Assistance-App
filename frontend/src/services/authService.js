import api from "./api";

export const registerUser = async ({ fullName, email, password }) => {
    const response = await api.post("/api/auth/register", {
        fullName,
        email,
        password,
    });

    return response.data;
};

export const loginUser = async ({ email, password }) => {
    const response = await api.post("/api/auth/login", {
        email,
        password,
    });

    return response.data;
};
