const ModernTemplate = ({ data = {} }) => {
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
  const email = personal.email || "";
  const phone = personal.phone || personal.mobile || "";
  const location = personal.location || personal.address || "";
  const summary = data.summary || data.professionalSummary || "";

  const headingClass =
    "mb-3 border-b-2 border-indigo-500 pb-2 text-sm font-bold uppercase tracking-widest text-slate-800";

  const get = (item, ...keys) => {
    for (const key of keys) {
      if (item?.[key]) return item[key];
    }
    return "";
  };

  return (
    <article className="mx-auto min-h-[1056px] w-full max-w-[794px] bg-white p-8 font-sans text-slate-800 sm:p-12">
      <header className="border-l-4 border-indigo-600 pl-5">
        <h1 className="break-words text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {name}
        </h1>

        {get(personal, "jobTitle", "title", "headline") && (
          <p className="mt-2 text-lg font-medium text-indigo-700">
            {get(personal, "jobTitle", "title", "headline")}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600 sm:text-sm">
          {email && <span>{email}</span>}
          {phone && <span>{phone}</span>}
          {location && <span>{location}</span>}
          {personal.linkedin && <span>{personal.linkedin}</span>}
          {personal.github && <span>{personal.github}</span>}
        </div>
      </header>

      {summary && (
        <section className="mt-8">
          <h2 className={headingClass}>Professional Summary</h2>
          <p className="whitespace-pre-line text-sm leading-6 text-slate-700">
            {summary}
          </p>
        </section>
      )}

      {skills.length > 0 && (
        <section className="mt-7">
          <h2 className={headingClass}>Skills</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span
                key={`${skill}-${index}`}
                className="rounded-md bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-800"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {experience.length > 0 && (
        <section className="mt-7">
          <h2 className={headingClass}>Experience</h2>
          <div className="space-y-5">
            {experience.map((item, index) => (
              <div key={item.id || index}>
                <div className="flex flex-wrap justify-between gap-2">
                  <h3 className="font-bold text-slate-900">
                    {get(item, "position", "jobTitle", "role", "title")}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {get(item, "duration", "dateRange", "dates")}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-indigo-700">
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
          <h2 className={headingClass}>Projects</h2>
          <div className="space-y-4">
            {projects.map((item, index) => (
              <div key={item.id || index}>
                <h3 className="font-bold text-slate-900">
                  {get(item, "name", "title", "projectName")}
                </h3>
                {get(item, "technologies", "techStack") && (
                  <p className="mt-1 text-xs font-medium text-indigo-700">
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
          <h2 className={headingClass}>Education</h2>
          <div className="space-y-4">
            {education.map((item, index) => (
              <div key={item.id || index}>
                <div className="flex flex-wrap justify-between gap-2">
                  <h3 className="font-bold text-slate-900">
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
          <h2 className={headingClass}>Certifications</h2>
          <ul className="list-inside list-disc space-y-2 text-sm leading-6 text-slate-700">
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

export default ModernTemplate;
