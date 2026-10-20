import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    FileText,
    LayoutDashboard,
    LogOut,
    Menu,
    Upload,
    X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const navItems = [
    {
        to: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
    },
    {
        to: "/builder",
        label: "Resume Builder",
        icon: FileText,
    },
    {
        to: "/resume-upload",
        label: "Upload Resume",
        icon: Upload,
    },
];

const Sidebar = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    const closeMobile = () => setMobileOpen(false);

    const initials = (user?.fullName || "U")
        .split(" ")
        .map((word) => word[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <div className="flex min-h-screen min-h-[100svh]">
            {/* ── Mobile overlay ─────────────────────────────── */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
                    onClick={closeMobile}
                    aria-hidden="true"
                />
            )}

            {/* ── Sidebar ────────────────────────────────────── */}
            <aside
                className={`no-print fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/80 bg-white transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
                    mobileOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Brand */}
                <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 px-5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm">
                        <FileText
                            className="size-4 text-white"
                            strokeWidth={2}
                        />
                    </div>
                    <span className="text-sm font-semibold tracking-tight text-slate-900">
                        Career Assistant
                    </span>

                    {/* Mobile close */}
                    <button
                        type="button"
                        onClick={closeMobile}
                        className="ml-auto rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
                        aria-label="Close navigation"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav
                    className="flex-1 space-y-1 overflow-y-auto px-3 py-4"
                    aria-label="Main navigation"
                >
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.to;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                onClick={closeMobile}
                                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 no-underline ${
                                    isActive
                                        ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100/60"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                            >
                                <Icon
                                    className={`size-[18px] shrink-0 transition-colors ${
                                        isActive
                                            ? "text-indigo-600"
                                            : "text-slate-400 group-hover:text-slate-600"
                                    }`}
                                    strokeWidth={isActive ? 2 : 1.75}
                                />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User area */}
                <div className="border-t border-slate-100 px-3 py-3">
                    <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white">
                            {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-semibold text-slate-900 pt-3.5">
                                {user?.fullName || "User"}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
                    >
                        <LogOut className="size-[18px]" strokeWidth={1.75} />
                        Log out
                    </button>
                </div>
            </aside>

            {/* ── Main content ────────────────────────────────── */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Mobile header */}
                <header className="no-print flex h-14 shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white px-4 lg:hidden">
                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Open navigation"
                    >
                        <Menu className="size-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-600 to-violet-600">
                            <FileText
                                className="size-3.5 text-white"
                                strokeWidth={2}
                            />
                        </div>
                        <span className="text-sm font-semibold text-slate-900">
                            Career Assistant
                        </span>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
};

export default Sidebar;
