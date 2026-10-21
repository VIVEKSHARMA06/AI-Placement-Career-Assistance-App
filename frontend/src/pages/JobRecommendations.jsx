import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Target,
  TriangleAlert,
} from "lucide-react";

// import Sidebar from "../components/Sidebar";
import { getResume } from "../services/resumeService";
import { getJobRecommendations } from "../services/careerService";

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Unable to load job recommendations. Please try again.";

const getJobTitle = (job) =>
  job.title || job.jobTitle || job.role || job.position || "Recommended role";

const getCompany = (job) =>
  job.company || job.companyName || job.organization || "";

const getSkills = (job) => {
  const skills = job.requiredSkills || job.skills || job.matchedSkills || [];

  if (Array.isArray(skills)) {
    return skills
      .map((skill) =>
        typeof skill === "string" ? skill : skill?.name || skill?.skill || "",
      )
      .filter(Boolean);
  }

  if (typeof skills === "string") {
    return skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  return [];
};

const getMatchScore = (job) => {
  const value =
    job.matchScore ?? job.similarityScore ?? job.score ?? job.similarity;

  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  // Some similarity models return values between 0 and 1.
  const percentage = number >= 0 && number <= 1 ? number * 100 : number;

  return Math.round(Math.min(100, Math.max(0, percentage)));
};

const JobCard = ({ job, index }) => {
  const title = getJobTitle(job);
  const company = getCompany(job);
  const skills = getSkills(job);
  const matchScore = getMatchScore(job);

  const description =
    job.description || job.summary || job.reason || job.explanation || "";

  const location = job.location || job.jobLocation || "";
  const jobUrl = job.url || job.applyUrl || job.applicationUrl || "";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <BriefcaseBusiness size={23} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

              {company && (
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <Building2 size={15} />
                  {company}
                </p>
              )}

              {location && (
                <p className="mt-1 text-sm text-slate-500">{location}</p>
              )}
            </div>

            {matchScore !== null && (
              <div className="shrink-0 rounded-xl bg-emerald-50 px-3 py-2 text-center">
                <p className="text-xl font-bold text-emerald-700">
                  {matchScore}%
                </p>
                <p className="text-xs text-emerald-700">Match</p>
              </div>
            )}
          </div>

          {description && (
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {description}
            </p>
          )}

          {skills.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-slate-700">
                Relevant skills
              </p>

              <div className="flex flex-wrap gap-2">
                {skills.map((skill, skillIndex) => (
                  <span
                    key={`${skill}-${skillIndex}`}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-400">Recommendation {index + 1}</p>

            {jobUrl && (
              <a
                href={jobUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white no-underline hover:bg-indigo-700"
              >
                View opportunity
                <ExternalLink size={15} />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

const JobRecommendations = () => {
  const [resume, setResume] = useState(null);
  const [jobs, setJobs] = useState([]);
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
          "No uploaded resume found. Upload your resume before requesting job recommendations.",
        );
      }

      const resumeId = savedResume.id || savedResume._id;

      if (!resumeId) {
        throw new Error("Your saved resume does not have a valid ID.");
      }

      setResume(savedResume);

      const response = await getJobRecommendations(resumeId);

      if (response?.success !== true) {
        throw new Error(
          response?.message ||
            "The recommendation service returned an unsuccessful response.",
        );
      }

      setJobs(
        Array.isArray(response.recommendations) ? response.recommendations : [],
      );
    } catch (err) {
      setError(getErrorMessage(err));
      setJobs([]);
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
              AI-powered career matching
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Job Recommendations
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Discover job opportunities relevant to the skills and experience
              in your resume.
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
              Finding relevant opportunities...
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Analyzing your resume with the recommendation service.
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
                  Recommendations unavailable
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

        {!loading && !error && jobs.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Target size={28} />
            </div>

            <h2 className="mt-4 text-xl font-semibold">
              No recommendations yet
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              The recommendation service returned no jobs. Make sure your resume
              contains readable text and that the Python recommendation service
              has job data available.
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

        {!loading && !error && jobs.length > 0 && (
          <>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">
                Recommended opportunities
              </h2>
              <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700">
                {jobs.length} results
              </span>
            </div>

            <div className="space-y-4">
              {jobs.map((job, index) => (
                <JobCard
                  key={
                    job.id ||
                    job._id ||
                    job.jobId ||
                    `${getJobTitle(job)}-${index}`
                  }
                  job={job}
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

export default JobRecommendations;
