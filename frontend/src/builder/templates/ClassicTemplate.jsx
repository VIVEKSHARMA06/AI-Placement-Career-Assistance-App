const ClassicTemplate = ({ data = {} }) => {
  const personal = data.personalInfo || data.personal || data;
  const education = Array.isArray(data.education) ? data.education : [];
  const experience = Array.isArray(data.experience)
    ? data.experience
    : Array.isArray(data.workExperience)
      ? data.workExperience
      : [];
  const projects = Array.isArray(data.projects) ? data.projects : [];
  const certifications = Array.isArray(data.certifications)
    ? data.certifications
    : [];

  const skills = Array.isArray(data.skills)
    ? data.skills
    : typeof data.skills === "string"
      ? data.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
      : [];

  const name = personal.fullName || personal.name || "Your Name";
  const summary = data.summary || data.professionalSummary || "";

  const get = (item, ...keys) => {
    for (const key of keys) {
      if (item?.[key]) return item[key];
    }
    return "";
  };

  const sectionHeading =
    "mb-3 border-b border-slate-500 pb-1 text-base font-bold uppercase tracking-wide text-slate-900";

  return (
    <article className="mx-auto min-h-[1056px] w-full max-w-[794px] bg-white px-8 py-10 font-serif text-slate-900 sm:px-12 sm:py-12">
      <header className="border-b-2 border-slate-800 pb-5 text-center">
        <h1 className="break-words text-3xl font-bold uppercase tracking-wide sm:text-4xl">
          {name}
        </h1>

        {get(personal, "jobTitle", "title", "headline") && (
          <p className="mt-2 text-base italic text-slate-700">
            {get(personal, "jobTitle", "title", "headline")}
          </p>
        )}

        <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-slate-700 sm:text-sm">
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>{personal.phone}</span>}
          {get(personal, "location", "address") && (
            <span>{get(personal, "location", "address")}</span>
          )}
          {personal.linkedin && <span>{personal.linkedin}</span>}
          {personal.github && <span>{personal.github}</span>}
        </div>
      </header>

      {summary && (
        <section className="mt-6">
          <h2 className={sectionHeading}>Professional Summary</h2>
          <p className="whitespace-pre-line text-sm leading-6">{summary}</p>
        </section>
      )}

      {experience.length > 0 && (
        <section className="mt-6">
          <h2 className={sectionHeading}>Work Experience</h2>
          <div className="space-y-4">
            {experience.map((item, index) => (
              <div key={item.id || index}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-bold">
                    {get(item, "position", "jobTitle", "role", "title")}
                  </h3>
                  <span className="text-xs italic text-slate-600">
                    {get(item, "duration", "dateRange", "dates")}
                  </span>
                </div>
                <p className="text-sm italic">
                  {get(item, "company", "organization", "employer")}
                </p>
                {get(item, "description", "responsibilities") && (
                  <p className="mt-1 whitespace-pre-line text-sm leading-6">
                    {get(item, "description", "responsibilities")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {education.length > 0 && (
        <section className="mt-6">
          <h2 className={sectionHeading}>Education</h2>
          <div className="space-y-3">
            {education.map((item, index) => (
              <div key={item.id || index}>
                <div className="flex flex-wrap justify-between gap-2">
                  <h3 className="font-bold">
                    {get(item, "degree", "qualification", "title")}
                  </h3>
                  <span className="text-xs text-slate-600">
                    {get(item, "year", "graduationYear", "duration")}
                  </span>
                </div>
                <p className="text-sm">
                  {get(item, "institution", "school", "college", "university")}
                </p>
                {get(item, "grade", "cgpa", "percentage") && (
                  <p className="text-xs text-slate-600">
                    Grade: {get(item, "grade", "cgpa", "percentage")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {skills.length > 0 && (
        <section className="mt-6">
          <h2 className={sectionHeading}>Skills</h2>
          <p className="text-sm leading-6">{skills.join(" • ")}</p>
        </section>
      )}

      {projects.length > 0 && (
        <section className="mt-6">
          <h2 className={sectionHeading}>Projects</h2>
          <div className="space-y-3">
            {projects.map((item, index) => (
              <div key={item.id || index}>
                <h3 className="font-bold">
                  {get(item, "name", "title", "projectName")}
                </h3>
                {get(item, "technologies", "techStack") && (
                  <p className="text-xs italic text-slate-600">
                    {Array.isArray(get(item, "technologies", "techStack"))
                      ? get(item, "technologies", "techStack").join(", ")
                      : get(item, "technologies", "techStack")}
                  </p>
                )}
                {item.description && (
                  <p className="mt-1 whitespace-pre-line text-sm leading-6">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {certifications.length > 0 && (
        <section className="mt-6">
          <h2 className={sectionHeading}>Certifications</h2>
          <ul className="list-inside list-disc space-y-1 text-sm leading-6">
            {certifications.map((item, index) => (
              <li key={item.id || index}>
                {typeof item === "string"
                  ? item
                  : get(item, "name", "title", "certification")}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
};

export default ClassicTemplate;
