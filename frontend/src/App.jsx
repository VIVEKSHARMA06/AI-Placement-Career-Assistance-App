import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import BuilderPage from "./builder/BuilderPage";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResumeUpload from "./pages/ResumeUpload";

const App = () => (
    <AuthProvider>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/builder"
                    element={
                        <ProtectedRoute>
                            <BuilderPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/resume-upload"
                    element={
                        <ProtectedRoute>
                            <ResumeUpload />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    </AuthProvider>
);

export default App;
