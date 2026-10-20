import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

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

const emptyEntries = {
    education: {
        institution: "",
        degree: "",
        fieldOfStudy: "",
        location: "",
        startDate: "",
        endDate: "",
        description: "",
    },
    workExperience: {
        company: "",
        position: "",
        location: "",
        startDate: "",
        endDate: "",
        description: "",
    },
    projects: {
        name: "",
        link: "",
        technologies: "",
        description: "",
    },
    certifications: {
        name: "",
        issuer: "",
        date: "",
    },
};

const collectionFields = {
    education: [
        { name: "institution", label: "School or institution", placeholder: "e.g. Stanford University" },
        { name: "degree", label: "Degree", placeholder: "e.g. B.S. Computer Science" },
        { name: "fieldOfStudy", label: "Field of study", placeholder: "e.g. Computer Science" },
        { name: "location", label: "Location", placeholder: "e.g. Stanford, CA" },
        { name: "startDate", label: "Start date", type: "month" },
        { name: "endDate", label: "End date", type: "month" },
        { name: "description", label: "Details", multiline: true, placeholder: "Relevant coursework, achievements, GPA..." },
    ],
    workExperience: [
        { name: "position", label: "Job title", placeholder: "e.g. Software Engineer" },
        { name: "company", label: "Company", placeholder: "e.g. Google" },
        { name: "location", label: "Location", placeholder: "e.g. Mountain View, CA" },
        { name: "startDate", label: "Start date", type: "month" },
        { name: "endDate", label: "End date", type: "month" },
        {
            name: "description",
            label: "Responsibilities & achievements",
            multiline: true,
            placeholder: "Describe your key contributions, one per line...",
        },
    ],
    projects: [
        { name: "name", label: "Project name", placeholder: "e.g. E-commerce Platform" },
        { name: "link", label: "Project link", type: "url", placeholder: "https://..." },
        { name: "technologies", label: "Technologies", placeholder: "e.g. React, Node.js, PostgreSQL" },
        { name: "description", label: "Description", multiline: true, placeholder: "What the project does, your role, impact..." },
    ],
    certifications: [
        { name: "name", label: "Certification", placeholder: "e.g. AWS Solutions Architect" },
        { name: "issuer", label: "Issuing organization", placeholder: "e.g. Amazon Web Services" },
        { name: "date", label: "Date earned", type: "month" },
    ],
};

const sectionLabels = {
    education: { singular: "education entry", plural: "Education" },
    workExperience: { singular: "experience entry", plural: "Work Experience" },
    projects: { singular: "project", plural: "Projects" },
    certifications: { singular: "certification", plural: "Certifications" },
};

const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100";

const BuilderForm = ({ onChange }) => {
    const [formData, setFormData] = useState(createEmptyResume);
    const [collapsed, setCollapsed] = useState({});

    useEffect(() => {
        onChange?.(formData);
    }, [formData, onChange]);

    const updateField = (field, value) => {
        setFormData((current) => ({ ...current, [field]: value }));
    };

    const updateEntry = (section, index, field, value) => {
        setFormData((current) => ({
            ...current,
            [section]: current[section].map((entry, i) =>
                i === index ? { ...entry, [field]: value } : entry,
            ),
        }));
    };

    const addEntry = (section) => {
        setFormData((current) => ({
            ...current,
            [section]: [...current[section], { ...emptyEntries[section] }],
        }));
    };

    const removeEntry = (section, index) => {
        setFormData((current) => ({
            ...current,
            [section]: current[section].filter((_, i) => i !== index),
        }));
    };

    const toggleCollapse = (key) => {
        setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const getEntryTitle = (section, entry) => {
        switch (section) {
            case "education":
                return entry.institution || entry.degree || "Untitled";
            case "workExperience":
                return entry.position || entry.company || "Untitled";
            case "projects":
                return entry.name || "Untitled";
            case "certifications":
                return entry.name || "Untitled";
            default:
                return "Untitled";
        }
    };

    const renderCollection = (section) => {
        const { singular, plural } = sectionLabels[section];
        const entries = formData[section];

        return (
            <fieldset key={section} className="border-t border-slate-100 pt-6">
                <legend className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <span>{plural}</span>
                    {entries.length > 0 && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                            {entries.length}
                        </span>
                    )}
                </legend>

                <div className="grid gap-3">
                    {entries.map((entry, index) => {
                        const key = `${section}-${index}`;
                        const isCollapsed = collapsed[key];

                        return (
                            <div
                                key={key}
                                className="rounded-lg border border-slate-200 bg-slate-50/50 transition"
                            >
                                {/* Entry header */}
                                <div className="flex items-center gap-2 px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleCollapse(key)}
                                        className="flex flex-1 items-center gap-2 text-left text-sm font-medium text-slate-700 hover:text-slate-900"
                                        aria-expanded={!isCollapsed}
                                    >
                                        {isCollapsed ? (
                                            <ChevronDown className="size-4 shrink-0 text-slate-400" />
                                        ) : (
                                            <ChevronUp className="size-4 shrink-0 text-slate-400" />
                                        )}
                                        <span className="truncate">
                                            {getEntryTitle(section, entry)}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeEntry(section, index)}
                                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                        aria-label={`Remove this ${singular}`}
                                    >
                                        <Trash2 className="size-3.5" />
                                    </button>
                                </div>

                                {/* Entry fields */}
                                {!isCollapsed && (
                                    <div className="border-t border-slate-200/60 px-4 pb-4 pt-4">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            {collectionFields[section].map((field) => (
                                                <label
                                                    key={field.name}
                                                    className={`grid gap-1.5 text-sm ${
                                                        field.multiline ? "sm:col-span-2" : ""
                                                    }`}
                                                >
                                                    <span className="font-medium text-slate-600">
                                                        {field.label}
                                                    </span>
                                                    {field.multiline ? (
                                                        <textarea
                                                            rows={3}
                                                            value={entry[field.name]}
                                                            onChange={(e) =>
                                                                updateEntry(
                                                                    section,
                                                                    index,
                                                                    field.name,
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder={field.placeholder || ""}
                                                            className={`${inputClass} min-h-[80px] resize-y`}
                                                        />
                                                    ) : (
                                                        <input
                                                            type={field.type || "text"}
                                                            value={entry[field.name]}
                                                            onChange={(e) =>
                                                                updateEntry(
                                                                    section,
                                                                    index,
                                                                    field.name,
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder={field.placeholder || ""}
                                                            className={inputClass}
                                                        />
                                                    )}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <button
                    type="button"
                    onClick={() => addEntry(section)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
                >
                    <Plus className="size-4" strokeWidth={2} />
                    Add {singular}
                </button>
            </fieldset>
        );
    };

    return (
        <form
            onSubmit={(event) => event.preventDefault()}
            className="grid gap-0"
        >
            {/* Contact & Profile */}
            <fieldset className="pb-6">
                <legend className="mb-4 text-sm font-semibold text-slate-900">
                    Contact & Profile
                </legend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="grid gap-1.5 text-sm">
                        <span className="font-medium text-slate-600">Full name</span>
                        <input
                            type="text"
                            autoComplete="name"
                            value={formData.fullName}
                            onChange={(e) => updateField("fullName", e.target.value)}
                            placeholder="e.g. John Doe"
                            className={inputClass}
                        />
                    </label>

                    <label className="grid gap-1.5 text-sm">
                        <span className="font-medium text-slate-600">Email</span>
                        <input
                            type="email"
                            autoComplete="email"
                            value={formData.email}
                            onChange={(e) => updateField("email", e.target.value)}
                            placeholder="you@example.com"
                            className={inputClass}
                        />
                    </label>

                    <label className="grid gap-1.5 text-sm">
                        <span className="font-medium text-slate-600">Phone</span>
                        <input
                            type="tel"
                            autoComplete="tel"
                            value={formData.phone}
                            onChange={(e) => updateField("phone", e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            className={inputClass}
                        />
                    </label>

                    <label className="grid gap-1.5 text-sm">
                        <span className="font-medium text-slate-600">Location</span>
                        <input
                            type="text"
                            autoComplete="address-level2"
                            value={formData.location}
                            onChange={(e) => updateField("location", e.target.value)}
                            placeholder="e.g. San Francisco, CA"
                            className={inputClass}
                        />
                    </label>
                </div>

                <label className="mt-4 grid gap-1.5 text-sm">
                    <span className="font-medium text-slate-600">
                        Professional summary
                    </span>
                    <textarea
                        rows={4}
                        value={formData.summary}
                        onChange={(e) => updateField("summary", e.target.value)}
                        placeholder="A brief overview of your professional background, key strengths, and career objectives..."
                        className={`${inputClass} min-h-[100px] resize-y`}
                    />
                </label>

                <label className="mt-4 grid gap-1.5 text-sm">
                    <span className="font-medium text-slate-600">Skills</span>
                    <textarea
                        rows={3}
                        value={formData.skills}
                        onChange={(e) => updateField("skills", e.target.value)}
                        placeholder="e.g. JavaScript, React, Node.js, Python, SQL..."
                        className={`${inputClass} min-h-[80px] resize-y`}
                    />
                    <span className="text-xs text-slate-400">
                        Separate skills with commas
                    </span>
                </label>
            </fieldset>

            {renderCollection("education")}
            {renderCollection("workExperience")}
            {renderCollection("projects")}
            {renderCollection("certifications")}
        </form>
    );
};

export default BuilderForm;
