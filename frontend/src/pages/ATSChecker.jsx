import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileSearch,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  XCircle,
} from "lucide-react";

import { getResume } from "../services/resumeService";
import { checkATS } from "../services/careerService";

const getErrorMessage = (error) =>
  error?.response?.data?.error?.message ||
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

const ATSChecker = () => {
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loadingResume, setLoadingResume] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [resumeError, setResumeError] = useState("");

  useEffect(() => {
    let active = true;

    const loadResume = async () => {
      setLoadingResume(true);
      setResumeError("");

      try {
        const response = await getResume();
        const savedResume = response?.data?.resume;

        if (!savedResume) {
          throw new Error(
            "No uploaded resume was found. Please upload your resume first.",
          );
        }

        if (active) {
          setResume(savedResume);
        }
      } catch (err) {
        if (active) {
          setResume(null);
          setResumeError(getErrorMessage(err));
        }
      } finally {
        if (active) {
          setLoadingResume(false);
        }
      }
    };

    loadResume();

    return () => {
      active = false;
    };
  }, []);

  const handleCheck = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!resume) {
      setError("Please upload a resume before running ATS analysis.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please paste the target job description.");
      return;
    }

    const resumeId = resume.id || resume._id;

    if (!resumeId) {
      setError("Resume ID is missing. Please upload your resume again.");
      return;
    }

    setChecking(true);

    try {
      const response = await checkATS({
        resumeId,
        jobDescription: jobDescription.trim(),
      });

      if (response?.success !== true) {
        throw new Error(response?.message || "ATS analysis failed.");
      }

      setResult(response);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setChecking(false);
    }
  };

  const score = Number(result?.atsScore);
  const validScore = Number.isFinite(score)
    ? Math.min(100, Math.max(0, score))
    : null;

  const scoreLabel =
    validScore === null
      ? ""
      : validScore >= 80
        ? "Strong match"
        : validScore >= 60
          ? "Moderate match"
          : "Needs improvement";

  const matchedSkills = Array.isArray(result?.matchedSkills)
    ? result.matchedSkills
    : [];

  const missingSkills = Array.isArray(result?.missingSkills)
    ? result.missingSkills
    : [];

  const keywordGaps = Array.isArray(result?.keywordGaps)
    ? result.keywordGaps
    : [];

  const suggestions = Array.isArray(result?.suggestions)
    ? result.suggestions
    : [];

  const warnings = Array.isArray(result?.warnings) ? result.warnings : [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <header>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700">
            <Sparkles size={16} />
            AI Career Assistant
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            ATS Resume Checker
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Compare your resume with a job description to identify matching
            skills, keyword gaps, and opportunities to improve your application.
          </p>
        </header>

        {/* Resume status */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
              <FileSearch size={25} />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">Your uploaded resume</h2>

              {loadingResume ? (
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <LoaderCircle size={16} className="animate-spin" />
                  Loading resume...
                </p>
              ) : resume ? (
                <>
                  <p className="mt-1 break-words text-sm text-slate-600">
                    {resume.fileName || "Uploaded resume"}
                  </p>

                  <p className="mt-2 flex items-center gap-2 text-sm text-emerald-700">
                    <CheckCircle2 size={16} />
                    Resume found
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-red-600">
                  {resumeError || "No resume is available."}
                </p>
              )}
            </div>

            {!loadingResume && !resume && (
              <a
                href="/resume-upload"
                className="shrink-0 text-sm font-semibold text-blue-700 hover:underline"
              >
                Upload resume
              </a>
            )}
          </div>
        </section>

        {/* ATS form */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">Job description</h2>

            <p className="mt-1 text-sm text-slate-500">
              Paste the job description you want to target.
            </p>
          </div>

          <form onSubmit={handleCheck} className="space-y-5">
            <textarea
              value={jobDescription}
              onChange={(event) => {
                setJobDescription(event.target.value);
                setError("");
              }}
              placeholder="Paste the complete job description here, including required skills, qualifications, and experience..."
              rows={9}
              maxLength={30000}
              required
              className="w-full resize-y rounded-xl border border-slate-300 bg-white p-4 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                {jobDescription.length}/30,000 characters
              </p>

              <button
                type="submit"
                disabled={
                  checking || loadingResume || !resume || !jobDescription.trim()
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {checking ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Analyzing resume...
                  </>
                ) : (
                  <>
                    <Target size={18} />
                    Check ATS Score
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </section>

        {/* Results */}
        {result && (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">ATS Analysis Results</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Results are based on the response from your backend ATS
                  analyzer.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setError("");
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100"
              >
                <RefreshCw size={16} />
                New analysis
              </button>
            </div>

            {/* Score card */}
            <div className="grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-1">
                <p className="text-sm font-medium text-slate-500">ATS Score</p>

                <div className="mt-5 flex justify-center">
                  <div
                    className="relative flex size-44 items-center justify-center rounded-full"
                    style={{
                      background:
                        validScore === null
                          ? "#e2e8f0"
                          : `conic-gradient(#2563eb ${validScore * 3.6}deg, #e2e8f0 0deg)`,
                    }}
                    role="img"
                    aria-label={
                      validScore === null
                        ? "ATS score unavailable"
                        : `ATS score ${validScore} out of 100`
                    }
                  >
                    <div className="flex size-36 flex-col items-center justify-center rounded-full bg-white">
                      <span className="text-4xl font-bold">
                        {validScore === null ? "N/A" : validScore}
                      </span>
                      <span className="mt-1 text-xs text-slate-500">
                        out of 100
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-center font-semibold text-blue-700">
                  {scoreLabel || "Score unavailable"}
                </p>

                <p className="mt-2 text-center text-xs leading-5 text-slate-500">
                  This is the analyzer's score, not a guarantee of passing an
                  employer's ATS.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 md:col-span-2">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 size={21} />
                    <h3 className="font-semibold">Matched skills</h3>
                  </div>

                  <p className="mt-4 text-4xl font-bold text-emerald-800">
                    {matchedSkills.length}
                  </p>

                  <p className="mt-1 text-sm text-emerald-700">
                    Skills matched by the analyzer
                  </p>
                </div>

                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
                  <div className="flex items-center gap-2 text-rose-800">
                    <XCircle size={21} />
                    <h3 className="font-semibold">Missing skills</h3>
                  </div>

                  <p className="mt-4 text-4xl font-bold text-rose-800">
                    {missingSkills.length}
                  </p>

                  <p className="mt-1 text-sm text-rose-700">
                    Skills not found in the match
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={21} className="text-blue-600" />
                    <h3 className="font-semibold">Analysis overview</h3>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-slate-500">Experience gap</p>
                      <p className="mt-1 font-semibold">
                        {result.experienceAnalysis?.requiredGapYears ?? "N/A"}{" "}
                        {result.experienceAnalysis?.requiredGapYears != null
                          ? "years"
                          : ""}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">
                        Parsed experience
                      </p>
                      <p className="mt-1 font-semibold">
                        {result.experienceAnalysis?.parsedExperienceYears ??
                          "N/A"}{" "}
                        {result.experienceAnalysis?.parsedExperienceYears !=
                        null
                          ? "years"
                          : ""}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Education score</p>
                      <p className="mt-1 font-semibold">
                        {result.educationAnalysis?.score ?? "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Keyword gaps</p>
                      <p className="mt-1 font-semibold">{keywordGaps.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Matched skills */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Matched skills</h3>

              <p className="mt-1 text-sm text-slate-500">
                Skills identified as matching the job description.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {matchedSkills.length ? (
                  matchedSkills.map((skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-800"
                    >
                      {typeof skill === "string"
                        ? skill
                        : skill.name || JSON.stringify(skill)}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No matched skills were returned.
                  </p>
                )}
              </div>
            </div>

            {/* Missing skills */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Missing skills</h3>

              <p className="mt-1 text-sm text-slate-500">
                Review these against your actual experience before adding them
                to your resume.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {missingSkills.length ? (
                  missingSkills.map((skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm text-rose-800"
                    >
                      {typeof skill === "string"
                        ? skill
                        : skill.name || JSON.stringify(skill)}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No missing skills were returned.
                  </p>
                )}
              </div>

              {keywordGaps.length > 0 && (
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <h4 className="font-medium">Keyword gaps</h4>
                  <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-600">
                    {keywordGaps.map((keyword, index) => (
                      <li key={`${keyword}-${index}`}>
                        {typeof keyword === "string"
                          ? keyword
                          : keyword.name || JSON.stringify(keyword)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Suggestions */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles size={21} className="text-amber-500" />
                <h3 className="text-lg font-semibold">
                  Improvement suggestions
                </h3>
              </div>

              {suggestions.length > 0 ? (
                <ul className="mt-5 space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700"
                    >
                      <CheckCircle2
                        size={18}
                        className="mt-1 shrink-0 text-blue-600"
                      />
                      <span>
                        {typeof suggestion === "string"
                          ? suggestion
                          : suggestion.message ||
                            suggestion.text ||
                            JSON.stringify(suggestion)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  The analyzer did not return any suggestions for this result.
                </p>
              )}
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <h3 className="font-semibold text-amber-900">
                  Analysis warnings
                </h3>

                <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-amber-900">
                  {warnings.map((warning, index) => (
                    <li key={index}>
                      {typeof warning === "string"
                        ? warning
                        : warning.message || JSON.stringify(warning)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
};

export default ATSChecker;
