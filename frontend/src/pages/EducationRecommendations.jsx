import { useEffect, useState } from "react";
import {
  BookOpen,
  Building2,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import { getResume } from "../services/resumeService";
import { getEducationRecommendations } from "../services/careerService";

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Unable to load education recommendations. Please try again.";

const getProgramTitle = (program) =>
  program.program ||
  program.programName ||
  program.title ||
  program.course ||
  program.name ||
  "Recommended program";

const getInstitution = (program) =>
  program.institution ||
  program.university ||
  program.college ||
  program.school ||
  "";

const getScore = (program) => {
  const value =
    program.matchScore ??
    program.similarityScore ??
    program.score ??
    program.similarity;

  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  const percentage = number >= 0 && number <= 1 ? number * 100 : number;

  return Math.round(Math.min(100, Math.max(0, percentage)));
};

const asText = (value) => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string" ? item : item?.name || item?.title || "",
      )
      .filter(Boolean)
      .join(", ");
  }

  return "";
};

const EducationCard = ({ program, index }) => {
  const title = getProgramTitle(program);
  const institution = getInstitution(program);
  const score = getScore(program);

  const description =
    program.description ||
    program.reason ||
    program.explanation ||
    program.summary ||
    "";

  const duration = program.duration || program.programDuration || "";

  const fees = program.fees ?? program.estimatedCost ?? program.tuitionFees;

  const eligibility =
    program.eligibility ||
    program.entryRequirements ||
    program.requirements ||
    "";

  const skills = asText(program.relevantSkills || program.skills || []);

  const location = program.location || program.country || "";

  const programUrl = program.url || program.website || program.programUrl || "";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <GraduationCap size={25} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

              {institution && (
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                  <Building2 size={16} />
                  {institution}
                </p>
              )}

              {location && (
                <p className="mt-1 text-sm text-slate-500">{location}</p>
              )}
            </div>

            {score !== null && (
              <div className="shrink-0 rounded-xl bg-emerald-50 px-3 py-2 text-center">
                <p className="text-xl font-bold text-emerald-700">{score}%</p>
                <p className="text-xs text-emerald-700">Match</p>
              </div>
            )}
          </div>

          {description && (
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {description}
            </p>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {duration && (
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Duration
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {asText(duration)}
                </p>
              </div>
            )}

            {fees !== undefined && fees !== null && fees !== "" && (
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Estimated fees
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {typeof fees === "number"
                    ? fees.toLocaleString()
                    : asText(fees)}
                </p>
              </div>
            )}
          </div>

          {eligibility && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Eligibility / entry requirements
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {asText(eligibility)}
              </p>
            </div>
          )}

          {skills && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Relevant skills
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{skills}</p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-400">Recommendation {index + 1}</p>

            {programUrl && (
              <a
                href={programUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white no-underline hover:bg-indigo-700"
              >
                View program
                <ExternalLink size={15} />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

const EducationRecommendations = () => {
  const [resume, setResume] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecommendations = async () => {
    setLoading(true);
    setError("");

    try {
      const resumeResponse = await getResume();
      const savedResume = resumeResponse?.data?.resume;

      if (!savedResume) {
        throw new Error(
          "No uploaded resume found. Upload your resume before requesting education recommendations.",
        );
      }

      const resumeId = savedResume.id || savedResume._id;

      if (!resumeId) {
        throw new Error("Your saved resume does not have a valid ID.");
      }

      setResume(savedResume);

      const response = await getEducationRecommendations(resumeId);

      if (response?.success !== true) {
        throw new Error(
          response?.message ||
            "The education recommendation service returned an unsuccessful response.",
        );
      }

      setPrograms(
        Array.isArray(response.recommendations) ? response.recommendations : [],
      );
    } catch (err) {
      setError(getErrorMessage(err));
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1.5 text-sm font-medium text-indigo-700">
              <Sparkles size={16} />
              AI-powered education matching
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Higher Education Recommendations
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Explore education programs relevant to your academic background,
              skills, and career goals.
            </p>
          </div>

          <button
            type="button"
            onClick={loadRecommendations}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 sm:self-auto"
          >
            {loading ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <RefreshCw size={17} />
            )}
            Refresh
          </button>
        </header>

        {resume && (
          <section className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <CheckCircle2 size={21} className="shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800">
                Recommendations based on your resume
              </p>
              <p className="mt-1 truncate text-sm text-slate-500">
                {resume.fileName || "Uploaded resume"}
              </p>
            </div>
          </section>
        )}

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center">
            <LoaderCircle
              size={34}
              className="mx-auto animate-spin text-indigo-600"
            />
            <p className="mt-4 font-medium">
              Finding suitable education programs...
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Checking your resume against the education recommendation service.
            </p>
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
          >
            <div className="flex items-start gap-3">
              <TriangleAlert size={22} className="shrink-0 text-amber-700" />
              <div>
                <h2 className="font-semibold text-amber-900">
                  Education recommendations unavailable
                </h2>
                <p className="mt-2 text-sm leading-6 text-amber-900">{error}</p>
                <button
                  type="button"
                  onClick={loadRecommendations}
                  className="mt-4 rounded-lg bg-amber-900 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && programs.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <BookOpen size={28} />
            </div>

            <h2 className="mt-4 text-xl font-semibold">
              No recommendations yet
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              The education service returned no programs. Recommendations will
              be available when the Python service and education dataset are
              ready.
            </p>

            <button
              type="button"
              onClick={loadRecommendations}
              className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && programs.length > 0 && (
          <>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Recommended programs</h2>
              <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700">
                {programs.length} results
              </span>
            </div>

            <div className="space-y-4">
              {programs.map((program, index) => (
                <EducationCard
                  key={
                    program.id ||
                    program._id ||
                    program.programId ||
                    `${getProgramTitle(program)}-${index}`
                  }
                  program={program}
                  index={index}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default EducationRecommendations;
