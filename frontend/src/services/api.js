import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:4000",
    headers: {
        Accept: "application/json",
    },
});

export { api };
export default api;
