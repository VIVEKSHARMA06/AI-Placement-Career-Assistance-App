import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

const LoadingScreen = () => (
    <div className="flex min-h-screen min-h-[100svh] items-center justify-center bg-page">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
            <div className="relative flex size-12 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-[2.5px] border-slate-200" />
                <div className="absolute inset-0 animate-spin-slow rounded-full border-[2.5px] border-transparent border-t-indigo-600" />
            </div>
            <p className="text-sm font-medium text-muted">Loading...</p>
        </div>
    </div>
);

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Sidebar>{children}</Sidebar>;
};

export default ProtectedRoute;
