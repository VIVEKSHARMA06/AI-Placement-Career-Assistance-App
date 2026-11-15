import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Trash2,
  Upload,
  UploadCloud,
} from "lucide-react";

import {
  deleteResume as deleteResumeRequest,
  getResumes,
  uploadResume as uploadResumeRequest,
} from "../services/resumeService";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_RESUMES = 5;

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.error?.message || error?.message || fallback;

const formatSize = (bytes) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
};

const ResumeUpload = () => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loadingResume, setLoadingResume] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const isBusy = uploading || loadingResume || deleting;

  const loadResumes = useCallback(async () => {
    setLoadingResume(true);
    setErrorMessage("");

    try {
      const response = await getResumes();
      if (response?.success !== true) {
        throw new Error("Unable to load saved resumes.");
      }
      const savedResumes = Array.isArray(response.data?.resumes)
        ? response.data.resumes
        : [];
      setResumes(savedResumes);
      setStatusMessage(
        savedResumes.length
          ? `${savedResumes.length} of ${MAX_RESUMES} resumes saved.`
          : "No resumes have been uploaded yet.",
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to load saved resumes."));
    } finally {
      setLoadingResume(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadResumes);
  }, [loadResumes]);

  const validateFile = useCallback((file) => {
    if (!file) return null;
    if (file.type.toLowerCase() !== "application/pdf") {
      return "Only PDF files are allowed for resumes.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Resume file must not exceed 5 MB.";
    }
    return null;
  }, []);

  const selectFile = useCallback(
    (file) => {
      setErrorMessage("");
      setStatusMessage("");

      if (!file) {
        setSelectedFile(null);
        return;
      }

      const error = validateFile(file);
      if (error) {
        setSelectedFile(null);
        setErrorMessage(error);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setSelectedFile(file);
    },
    [validateFile],
  );

  const handleFileChange = (event) => {
    selectFile(event.target.files?.[0] || null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isBusy) setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (isBusy) return;
    const file = e.dataTransfer?.files?.[0];
    if (file) selectFile(file);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    if (!selectedFile) {
      setErrorMessage("Choose a PDF file to upload.");
      return;
    }

    if (selectedFile.type.toLowerCase() !== "application/pdf") {
      setErrorMessage("Only PDF files are allowed for resumes.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setErrorMessage("Resume file must not exceed 5 MB.");
      return;
    }
    if (resumes.length >= MAX_RESUMES) {
      setErrorMessage(
        "Your resume library is full. Delete a resume before uploading another.",
      );
      return;
    }

    setUploading(true);

    try {
      const header = await selectedFile.slice(0, 5).text();

      if (header !== "%PDF-") {
        throw new Error("Uploaded file is not a valid PDF.");
      }

      const response = await uploadResumeRequest(selectedFile);
      const uploadedResume = response?.data?.resume;

      if (
        response?.success !== true ||
        typeof uploadedResume?.fileName !== "string"
      ) {
        throw new Error("The server returned an unexpected resume response.");
      }

      setResumes((current) =>
        [uploadedResume, ...current].slice(0, MAX_RESUMES),
      );
      setSelectedResumeId(uploadedResume.id || uploadedResume._id);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setStatusMessage("Resume uploaded successfully.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to upload the resume."));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResume = async (resumeId) => {
    setDeleting(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await deleteResumeRequest(resumeId);

      if (response?.success !== true) {
        throw new Error("The server could not delete the resume.");
      }

      setResumes((current) =>
        current.filter((item) => (item.id || item._id) !== resumeId),
      );
      setSelectedResumeId((current) => (current === resumeId ? "" : current));
      setStatusMessage("Resume deleted.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to delete the resume."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-2xl">
        {/* ── Header ─────────────────────────────── */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Resume Upload
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
            Save up to 5 PDF resumes and choose which one to use for each career
            tool.
          </p>
        </header>

        {/* ── Upload card ─────────────────────────── */}
        <section
          aria-labelledby="resume-upload-heading"
          className="rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2
              id="resume-upload-heading"
              className="text-[15px] font-semibold tracking-tight text-slate-900"
            >
              Upload a PDF resume
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Choose a PDF from your device, then upload it securely.
            </p>
          </div>

          <form onSubmit={handleUpload} className="p-5 sm:p-6">
            {/* Drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isBusy && fileInputRef.current?.click()}
              className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all sm:py-12 ${
                dragActive
                  ? "border-indigo-400 bg-indigo-50/60"
                  : "border-slate-200 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/30"
              } ${isBusy ? "pointer-events-none opacity-60" : ""}`}
              role="button"
              tabIndex={0}
              aria-label="Click or drag a PDF file here to upload"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <div
                className={`mb-3 flex size-12 items-center justify-center rounded-xl transition ${
                  dragActive
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                }`}
              >
                <UploadCloud className="size-6" strokeWidth={1.5} />
              </div>
              <p className="mb-1 text-sm font-medium text-slate-700">
                <span className="text-indigo-600">Click to browse</span> or drag
                and drop
              </p>
              <p className="text-xs text-slate-400">PDF format · Max 5 MB</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                disabled={isBusy}
                className="sr-only"
                tabIndex={-1}
              />
            </div>

            {/* Selected file */}
            {selectedFile && (
              <div className="mt-4 flex items-center gap-3 rounded-lg border border-indigo-100 bg-indigo-50/60 px-4 py-3">
                <FileText
                  className="size-5 shrink-0 text-indigo-600"
                  strokeWidth={1.75}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatSize(selectedFile.size)} · PDF
                  </p>
                </div>
              </div>
            )}

            {/* Upload button */}
            <button
              type="submit"
              disabled={
                isBusy || !selectedFile || resumes.length >= MAX_RESUMES
              }
              className="mt-5 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {uploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="size-4" strokeWidth={2} />
                  Upload resume
                </>
              )}
            </button>
          </form>

          {/* ── Actions ───────────────────────────── */}
          <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
            <button
              type="button"
              onClick={loadResumes}
              disabled={isBusy}
              className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingResume ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Loading…
                </>
              ) : (
                "Refresh saved resumes"
              )}
            </button>
            <p className="text-sm text-slate-500">
              {resumes.length} of {MAX_RESUMES} saved
            </p>
          </div>
        </section>

        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="font-semibold text-slate-900">Saved resumes</h2>
            <p className="mt-1 text-sm text-slate-500">
              Select a default here, or choose another resume inside any career
              tool.
            </p>
          </div>

          {resumes.length ? (
            <ul className="divide-y divide-slate-100">
              {resumes.map((item) => {
                const resumeId = item.id || item._id;
                const isSelected = selectedResumeId === resumeId;
                return (
                  <li
                    key={resumeId}
                    className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <FileText className="size-5 shrink-0 text-indigo-600" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {item.fileName || "Uploaded resume"}
                      </p>
                      {item.createdAt && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          Added {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedResumeId(resumeId)}
                      disabled={isBusy || isSelected}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {isSelected ? "Selected" : "Use this resume"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteResume(resumeId)}
                      disabled={isBusy}
                      aria-label={`Delete ${item.fileName || "resume"}`}
                      className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                    >
                      {deleting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No resumes saved yet. Upload a PDF to get started.
            </p>
          )}
        </section>

        {/* ── Feedback messages ───────────────────── */}
        {statusMessage && (
          <div
            role="status"
            className="mt-4 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeUpload;
