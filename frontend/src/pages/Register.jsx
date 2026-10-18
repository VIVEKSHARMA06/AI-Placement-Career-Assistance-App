import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, FileText, Loader2 } from "lucide-react";

import { useAuth } from "../context/AuthContext";

const Register = () => {
    const { register, loading } = useAuth();
    const navigate = useNavigate();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage("");
        setSubmitting(true);

        try {
            await register({ fullName, email, password });
            navigate("/dashboard", { replace: true });
        } catch (error) {
            setErrorMessage(
                error?.response?.data?.error?.message ||
                    error?.message ||
                    "Unable to create your account. Please try again.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const isBusy = submitting || loading;

    return (
        <div className="flex min-h-screen min-h-[100svh] bg-page">
            {/* Left brand panel — hidden on mobile */}
            <div className="hidden w-[46%] max-w-[560px] flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-10 text-white lg:flex">
                <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
                        <FileText className="size-5 text-white" strokeWidth={2} />
                    </div>
                    <span className="text-[15px] font-semibold tracking-tight">
                        Career Assistant
                    </span>
                </div>

                <div className="max-w-sm">
                    <h2 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-white">
                        Your career journey starts here
                    </h2>
                    <p className="text-[15px] leading-relaxed text-indigo-100">
                        Join thousands of professionals who build polished resumes
                        and manage their career growth with our intelligent assistant.
                    </p>
                </div>

                <p className="text-xs text-indigo-200/70">
                    © {new Date().getFullYear()} Placement & Career Assistant
                </p>
            </div>

            {/* Right form area */}
            <div className="flex flex-1 flex-col items-center justify-center px-5 py-10">
                {/* Mobile brand */}
                <div className="mb-10 flex items-center gap-2.5 lg:hidden">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm">
                        <FileText className="size-5 text-white" strokeWidth={2} />
                    </div>
                    <span className="text-[15px] font-semibold tracking-tight text-slate-900">
                        Career Assistant
                    </span>
                </div>

                <div className="w-full max-w-[400px] animate-fade-in">
                    <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900">
                        Create your account
                    </h1>
                    <p className="mb-8 text-sm leading-relaxed text-slate-500">
                        Register to get started with your career assistant.
                    </p>

                    <form
                        onSubmit={handleSubmit}
                        className="grid gap-5"
                    >
                        <label className="grid gap-1.5 text-sm">
                            <span className="font-medium text-slate-700">
                                Full name
                            </span>
                            <input
                                type="text"
                                name="fullName"
                                autoComplete="name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="John Doe"
                                minLength={2}
                                maxLength={100}
                                required
                                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                            />
                        </label>

                        <label className="grid gap-1.5 text-sm">
                            <span className="font-medium text-slate-700">Email</span>
                            <input
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                maxLength={254}
                                required
                                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                            />
                        </label>

                        <label className="grid gap-1.5 text-sm">
                            <span className="font-medium text-slate-700">
                                Password
                            </span>
                            <input
                                type="password"
                                name="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                minLength={8}
                                maxLength={128}
                                pattern={
                                    "(?=.*[A-Za-z])(?=.*[0-9])(?=.*[^A-Za-z0-9])\\S{8,128}"
                                }
                                title="Use 8-128 characters with a letter, a number, and a special character. Spaces are not allowed."
                                required
                                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                            />
                            <span className="text-xs leading-relaxed text-slate-400">
                                Use 8–128 characters with a letter, a number, and a
                                special character. No spaces.
                            </span>
                        </label>

                        {errorMessage && (
                            <div
                                id="register-error"
                                role="alert"
                                className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800"
                            >
                                <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-500" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isBusy}
                            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isBusy && (
                                <Loader2 className="size-4 animate-spin" />
                            )}
                            {isBusy ? "Creating account..." : "Register"}
                        </button>
                    </form>

                    <p className="mt-7 text-center text-sm text-slate-500">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
