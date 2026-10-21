import RecommendationCard from "../components/RecommendationCard";
const RecommendationCard = ({
  title,
  subtitle,
  description,
  matchScore,
  skills,
  tags,
  link,
  linkLabel = "View Details",
}) => {
  const score = Number(matchScore);
  const hasScore =
    matchScore !== null &&
    matchScore !== undefined &&
    matchScore !== "" &&
    Number.isFinite(score) &&
    score >= 0 &&
    score <= 100;

  const displayTags = Array.isArray(tags) ? tags : [];
  const displaySkills = Array.isArray(skills) ? skills : [];

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-semibold text-slate-900">
            {title || "Recommendation"}
          </h3>

          {subtitle && (
            <p className="mt-1 text-sm font-medium text-indigo-600">
              {subtitle}
            </p>
          )}
        </div>

        {hasScore && (
          <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
            {Math.round(score)}% match
          </span>
        )}
      </div>

      {description && (
        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">
          {description}
        </p>
      )}

      {displaySkills.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Relevant Skills
          </p>

          <div className="flex flex-wrap gap-2">
            {displaySkills.map((skill, index) => (
              <span
                key={`${skill}-${index}`}
                className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {displayTags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {displayTags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {link && (
        <div className="mt-auto pt-5">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {linkLabel}
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      )}
    </article>
  );
};

export default RecommendationCard;
