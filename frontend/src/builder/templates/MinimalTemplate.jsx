const MinimalTemplate = ({ data = {} }) => {
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
    "mb-3 border-b border-slate-300 pb-2 text-sm font-bold uppercase tracking-widest text-slate-800";

  return (
    <article className="mx-auto min-h-[1056px] w-full max-w-[794px] bg-white px-8 py-10 font-sans text-slate-800 sm:px-12 sm:py-12">
      <header className="border-b border-slate-300 pb-6">
        <h1 className="break-words text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          {name}
        </h1>

        {get(personal, "jobTitle", "title", "headline") && (
          <p className="mt-2 text-base text-slate-600">
            {get(personal, "jobTitle", "title", "headline")}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600 sm:text-sm">
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
        <section className="mt-7">
          <h2 className={sectionHeading}>Professional Summary</h2>
          <p className="whitespace-pre-line text-sm leading-6 text-slate-700">
            {summary}
          </p>
        </section>
      )}

      {skills.length > 0 && (
        <section className="mt-7">
          <h2 className={sectionHeading}>Skills</h2>
          <p className="text-sm leading-7 text-slate-700">
            {skills.join(" • ")}
          </p>
        </section>
      )}

      {experience.length > 0 && (
        <section className="mt-7">
          <h2 className={sectionHeading}>Experience</h2>
          <div className="space-y-5">
            {experience.map((item, index) => (
              <div key={item.id || index}>
                <div className="flex flex-wrap justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {get(item, "position", "jobTitle", "role", "title")}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {get(item, "duration", "dateRange", "dates")}
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-600">
                  {get(item, "company", "organization", "employer")}
                </p>

                {get(item, "description", "responsibilities") && (
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                    {get(item, "description", "responsibilities")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section className="mt-7">
          <h2 className={sectionHeading}>Projects</h2>
          <div className="space-y-4">
            {projects.map((item, index) => (
              <div key={item.id || index}>
                <h3 className="text-sm font-semibold text-slate-900">
                  {get(item, "name", "title", "projectName")}
                </h3>

                {get(item, "technologies", "techStack") && (
                  <p className="mt-1 text-xs text-slate-500">
                    {Array.isArray(get(item, "technologies", "techStack"))
                      ? get(item, "technologies", "techStack").join(", ")
                      : get(item, "technologies", "techStack")}
                  </p>
                )}

                {item.description && (
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {education.length > 0 && (
        <section className="mt-7">
          <h2 className={sectionHeading}>Education</h2>
          <div className="space-y-4">
            {education.map((item, index) => (
              <div key={item.id || index}>
                <div className="flex flex-wrap justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {get(item, "degree", "qualification", "title")}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {get(item, "year", "graduationYear", "duration")}
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-600">
                  {get(item, "institution", "school", "college", "university")}
                </p>

                {get(item, "grade", "cgpa", "percentage") && (
                  <p className="mt-1 text-xs text-slate-500">
                    Grade: {get(item, "grade", "cgpa", "percentage")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {certifications.length > 0 && (
        <section className="mt-7">
          <h2 className={sectionHeading}>Certifications</h2>
          <ul className="space-y-2 text-sm leading-6 text-slate-700">
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

export default MinimalTemplate;
