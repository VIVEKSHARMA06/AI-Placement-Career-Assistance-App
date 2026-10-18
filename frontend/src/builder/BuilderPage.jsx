import { useCallback, useState } from "react";
import { Printer } from "lucide-react";

import BuilderForm from "./BuilderForm";
import ResumePreview from "./ResumePreview";

const createEmptyResume = () => ({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
    skills: "",
    education: [],
    workExperience: [],
    projects: [],
    certifications: [],
});

const BuilderPage = () => {
    const [resume, setResume] = useState(createEmptyResume);
    const [template, setTemplate] = useState("professional");

    const handleChange = useCallback((data) => {
        setResume(data);
    }, []);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="builder-page animate-fade-in">
            {/* ── Header ─────────────────────────────────── */}
            <div className="no-print border-b border-slate-200/80 bg-white px-4 py-5 sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                            Resume Builder
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Fill in your details on the left — your resume previews live on the right.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100 sm:self-start"
                    >
                        <Printer className="size-4" strokeWidth={2} />
                        Print / Save PDF
                    </button>
                </div>
            </div>

            {/* ── Editor workspace ───────────────────────── */}
            <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:p-0 print:m-0">
                <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-8 builder-editor-grid print:block print:w-full print:m-0 print:p-0">
                    {/* Form panel */}
                    <section
                        aria-labelledby="builder-form-heading"
                        className="no-print min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm"
                    >
                        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                            <h2
                                id="builder-form-heading"
                                className="text-[15px] font-semibold tracking-tight text-slate-900"
                            >
                                Your details
                            </h2>
                            <p className="mt-0.5 text-sm text-slate-500">
                                Fill in the sections you want to include.
                            </p>
                        </div>
                        <div className="p-5 sm:p-6">
                            <BuilderForm onChange={handleChange} />
                        </div>
                    </section>

                    {/* Preview panel */}
                    <section
                        aria-labelledby="resume-preview-heading"
                        className="min-w-0 lg:sticky lg:top-6 builder-preview-wrapper print:static print:w-full print:m-0 print:p-0"
                    >
                        <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-3">
                            <h2
                                id="resume-preview-heading"
                                className="text-[15px] font-semibold tracking-tight text-slate-900"
                            >
                                Live preview
                            </h2>
                            <div className="flex flex-wrap items-center gap-3">
                                <label
                                    htmlFor="resume-template"
                                    className="text-xs font-medium text-slate-500"
                                >
                                    Template
                                </label>
                                <select
                                    id="resume-template"
                                    value={template}
                                    onChange={(event) => setTemplate(event.target.value)}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100"
                                >
                                    <option value="professional">Professional</option>
                                    <option value="modern">Modern</option>
                                    <option value="executive">Executive</option>
                                </select>
                                <span className="text-xs text-slate-400">
                                    Updates as you type
                                </span>
                            </div>
                        </div>
                        <div className="rounded-xl bg-slate-100/80 p-3 sm:p-5 builder-preview-wrapper print:p-0 print:bg-transparent print:rounded-none">
                            <ResumePreview resume={resume} template={template} />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default BuilderPage;
