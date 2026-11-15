import { useEffect, useId, useRef, useState } from "react";
import { FilePlus2, LoaderCircle, Upload } from "lucide-react";

import { getResumes, uploadResume } from "../services/resumeService";

const MAX_RESUMES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const getResumeId = (resume) => resume?.id || resume?._id || "";

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error?.message ||
  error?.message ||
  "Unable to load or upload resumes.";

const ResumeSelector = ({ value, onChange, label = "Resume to analyze" }) => {
  const inputId = useId();
  const inputRef = useRef(null);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const loadResumes = async () => {
    setError("");
    try {
      const response = await getResumes();
      if (response?.success !== true) {
        throw new Error(response?.message || "Unable to load saved resumes.");
      }
      setResumes(
        Array.isArray(response.data?.resumes) ? response.data.resumes : [],
      );
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(loadResumes);
  }, []);

  const handleSelect = (event) => {
    const resume = resumes.find(
      (item) => getResumeId(item) === event.target.value,
    );
    setStatus("");
    onChange(resume || null);
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError("");
    setStatus("");

    if (resumes.length >= MAX_RESUMES) {
      setError(
        "Your resume library is full. Delete a resume before adding another.",
      );
      return;
    }
    if (
      file.type !== "application/pdf" ||
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Choose a PDF resume.");
      return;
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      setError("Choose a non-empty PDF that is no larger than 5 MB.");
      return;
    }

    setUploading(true);
    try {
      const header = await file.slice(0, 5).text();
      if (header !== "%PDF-") {
        throw new Error("This file does not appear to be a valid PDF.");
      }

      const response = await uploadResume(file);
      const resume = response?.data?.resume;
      if (response?.success !== true || !getResumeId(resume)) {
        throw new Error("The server returned an unexpected resume response.");
      }

      setResumes((current) => [resume, ...current].slice(0, MAX_RESUMES));
      onChange(resume);
      setStatus(`${resume.fileName || "Resume"} uploaded and selected.`);
    } catch (uploadError) {
      setError(getErrorMessage(uploadError));
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <label
            htmlFor={`${inputId}-select`}
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            {label}
          </label>
          <select
            id={`${inputId}-select`}
            value={value || ""}
            onChange={handleSelect}
            disabled={loading || resumes.length === 0}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
          >
            <option value="">
              {loading ? "Loading saved resumes..." : "Select a saved resume"}
            </option>
            {resumes.map((resume) => (
              <option key={getResumeId(resume)} value={getResumeId(resume)}>
                {resume.fileName || "Uploaded resume"}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-slate-500">
            {resumes.length} of {MAX_RESUMES} resumes saved
          </p>
        </div>

        <div>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleUpload}
            className="sr-only"
            disabled={loading || uploading || resumes.length >= MAX_RESUMES}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading || uploading || resumes.length >= MAX_RESUMES}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : resumes.length >= MAX_RESUMES ? (
              <FilePlus2 size={16} />
            ) : (
              <Upload size={16} />
            )}
            {uploading ? "Uploading..." : "Upload another resume"}
          </button>
        </div>
      </div>

      {!loading && resumes.length === 0 && !error && (
        <p className="mt-3 text-sm text-slate-600">
          No saved resumes yet. Upload a PDF here to continue.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-rose-700">
          {error}
        </p>
      )}
      {status && (
        <p role="status" className="mt-3 text-sm text-emerald-700">
          {status}
        </p>
      )}
    </section>
  );
};

export default ResumeSelector;
