import { useRef, useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  Lightbulb,
  LoaderCircle,
  Upload,
  X,
} from "lucide-react";

import { getResume } from "../services/resumeService";
import { predictSuitability } from "../services/careerService";
import ScoreGauge from "../components/ScoreGauge";
import LimeChart from "../components/LimeChart";

const MAX_JD_FILE_SIZE = 5 * 1024 * 1024;

const Suitability = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [jdFile, setJdFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setResult(null);

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!["pdf", "txt"].includes(extension)) {
      setError("Please upload a PDF or TXT job description.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_JD_FILE_SIZE) {
      setError("The JD file must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    if (file.size === 0) {
      setError("The selected file is empty.");
      event.target.value = "";
      return;
    }

    setJdFile(file);

    // TXT files can be read directly in the browser.
    // PDF text extraction will be handled by the backend.
    if (extension === "txt") {
      try {
        const text = await file.text();
        if (!text.trim()) {
          setJdFile(null);
          setError("The selected TXT file contains no text.");
          event.target.value = "";
          return;
        }
        setJobDescription((current) => (current.trim() ? current : text));
      } catch {
        setJdFile(null);
        setError("Unable to read the selected TXT file.");
        event.target.value = "";
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!jobDescription.trim() && !jdFile) {
      setError("Paste a job description or upload a PDF/TXT file.");
      return;
    }

    setLoading(true);

    try {
      const resumeResponse = await getResume();
      const resume = resumeResponse?.data?.resume;
      const resumeId = resume?.id || resume?._id;

      if (!resumeId) {
        throw new Error("Please upload a resume before checking suitability.");
      }

      if (!resume.extractedText?.trim()) {
        throw new Error(
          "Resume text is missing. Please upload your resume again.",
        );
      }

      // Send JD text and optional file to the updated API.
      // The backend must support this request contract.
      const payload = new FormData();
      payload.append("resumeId", resumeId);
      payload.append("jobDescription", jobDescription.trim());
      payload.append(
        "candidateProfile",
        JSON.stringify({ resumeText: resume.extractedText }),
      );

      if (jdFile) {
        payload.append("jobDescriptionFile", jdFile);
      }

      const response = await predictSuitability(payload);
      const data = response?.data ?? response;

      if (
        data?.suitabilityScore === undefined ||
        data?.suitabilityScore === null
      ) {
        throw new Error("The server did not return a suitability score.");
      }

      setResult(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to calculate candidate suitability. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const removeFile = () => {
    setJdFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const scoreValue =
    result?.suitabilityScore !== undefined
      ? Number(result.suitabilityScore) * 100
      : null;

  const limeItems = Array.isArray(result?.limeExplanation)
    ? result.limeExplanation.map((item) => ({
        feature: item.feature,
        contribution:
          item.weight !== undefined
            ? Number(item.weight)
            : item.impact === "negative"
              ? -Math.abs(Number(item.value ?? 0))
              : Number(item.value ?? 0),
      }))
    : [];

  const suggestions = Array.isArray(result?.geminiSuggestions)
    ? result.geminiSuggestions
    : [];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
            <BriefcaseBusiness size={25} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Candidate Suitability
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Evaluate how well your resume matches a job opportunity.
            </p>
          </div>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div>
          <label
            htmlFor="jobDescription"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Job Description
          </label>
          <textarea
            id="jobDescription"
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            placeholder="Paste the complete job description here..."
            rows={7}
            maxLength={30000}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <p className="mt-1 text-xs text-slate-500">
            {jobDescription.length.toLocaleString()}/30,000 characters
          </p>
        </div>

        <div>
          <label
            htmlFor="jdFile"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Or upload a JD file (optional)
          </label>

          <input
            ref={fileInputRef}
            id="jdFile"
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            onChange={handleFileChange}
            className="hidden"
          />

          {!jdFile ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Upload size={18} />
              Choose PDF or TXT file
            </button>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">
                  {jdFile.name}
                </p>
                <p className="text-xs text-slate-500">
                  {(jdFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={removeFile}
                aria-label="Remove JD file"
                className="rounded-lg p-2 text-slate-600 hover:bg-white"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <p className="mt-2 text-xs text-slate-500">
            Maximum file size: 5 MB. If both text and a file are supplied, the
            pasted text takes priority.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <LoaderCircle size={18} className="animate-spin" />}
          {loading ? "Analyzing..." : "Check Suitability"}
        </button>
      </form>

      {result && (
        <>
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ScoreGauge
              score={scoreValue}
              label="Candidate Suitability Score"
            />

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Prediction Result
              </h2>
              <p className="mt-5 text-sm text-slate-500">Model prediction</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {result.predictionLabel || "Prediction unavailable"}
              </p>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                This prediction is a model-generated estimate, not a hiring
                decision or guarantee of selection.
              </p>
            </section>
          </section>

          <LimeChart
            explanations={limeItems}
            title="Why did the model make this prediction?"
          />

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Lightbulb className="text-amber-500" size={22} />
              <h2 className="text-lg font-semibold text-slate-900">
                Improvement Suggestions
              </h2>
            </div>

            {suggestions.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={`${suggestion}-${index}`}
                    className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700"
                  >
                    <span className="font-semibold text-indigo-600">
                      {index + 1}.
                    </span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                No improvement suggestions were returned by the server.
              </p>
            )}
          </section>
        </>
      )}
    </main>
  );
};

export default Suitability;
