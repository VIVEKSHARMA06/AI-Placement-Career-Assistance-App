import { FileText } from "lucide-react";

const cleanText = (value) =>
    typeof value === "string" && value.trim() ? value.trim() : "";

const formatMonth = (value) => {
    const monthValue = cleanText(value);
    const match = monthValue.match(/^(\d{4})-(\d{2})$/);

    if (!match) {
        return monthValue;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    return month >= 1 && month <= 12
        ? monthNames[month - 1] + " " + year
        : monthValue;
};

const formatDateRange = (startDate, endDate) => {
    const start = formatMonth(startDate);
    const end = formatMonth(endDate);

    if (start && end) {
        return start + " – " + end;
    }

    return start || end;
};

const getEntries = (entries, fieldNames) =>
    (Array.isArray(entries) ? entries : []).filter(
        (entry) =>
            entry &&
            typeof entry === "object" &&
            fieldNames.some((fieldName) => cleanText(entry[fieldName])),
    );

const parseDescription = (value) =>
    cleanText(value)
        .split(/\r?\n/)
        .map((line) => line.trim().replace(/^(?:[-*•]|\d+[.)])\s*/, ""))
        .filter(Boolean);

const getSafeHref = (value) => {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:"
            ? url.href
            : "";
    } catch {
        return "";
    }
};

const DescriptionList = ({ value }) => {
    const bullets = parseDescription(value);

    if (!bullets.length) {
        return null;
    }

    return (
        <ul className="resume-bullets">
            {bullets.map((bullet, index) => (
                <li key={index}>{bullet}</li>
            ))}
        </ul>
    );
};

const EntryHeading = ({ primary, secondary, detail, date }) => (
    <div className="resume-entry-heading">
        <div className="resume-entry-main">
            {(primary || secondary) && (
                <h3 className="resume-entry-title">
                    {primary || secondary}
                    {primary && secondary && (
                        <span className="resume-entry-secondary">
                            {" — "}{secondary}
                        </span>
                    )}
                </h3>
            )}
            {detail && <p className="resume-entry-detail">{detail}</p>}
        </div>
        {date && <p className="resume-entry-date">{date}</p>}
    </div>
);

const Section = ({ title, children }) => (
    <section className="resume-section print-section">
        <h2 className="resume-section-title">{title}</h2>
        {children}
    </section>
);

const EmptyState = () => (
    <div className="resume-empty-state no-print">
        <div className="resume-empty-icon" aria-hidden="true">
            <FileText strokeWidth={1.5} />
        </div>
        <p className="resume-empty-title">Your resume starts here</p>
        <p className="resume-empty-copy">
            Add your details in the editor to build a polished, printable resume.
        </p>
    </div>
);

const ResumePreview = ({ resume = {}, template = "professional" }) => {
    const data = resume && typeof resume === "object" ? resume : {};
    const selectedTemplate = ["modern", "executive"].includes(template)
        ? template
        : "professional";
    const fullName = cleanText(data.fullName);
    const email = cleanText(data.email);
    const phone = cleanText(data.phone);
    const location = cleanText(data.location);
    const summary = cleanText(data.summary);

    const rawSkills = Array.isArray(data.skills) ? data.skills : [data.skills];
    const skills = [
        ...new Map(
            rawSkills
                .filter((value) => typeof value === "string")
                .flatMap((value) => value.split(/[,;\n]/))
                .map((skill) => skill.trim())
                .filter(Boolean)
                .map((skill) => [skill.toLocaleLowerCase(), skill]),
        ).values(),
    ];

    const education = getEntries(data.education, [
        "institution",
        "degree",
        "fieldOfStudy",
        "location",
        "startDate",
        "endDate",
        "description",
    ]);
    const workExperience = getEntries(data.workExperience, [
        "company",
        "position",
        "location",
        "startDate",
        "endDate",
        "description",
    ]);
    const projects = getEntries(data.projects, [
        "name",
        "link",
        "technologies",
        "description",
    ]);
    const certifications = getEntries(data.certifications, [
        "name",
        "issuer",
        "date",
    ]);

    const contactItems = [
        email && { kind: "email", value: email },
        phone && { kind: "phone", value: phone },
        location && { kind: "location", value: location },
    ].filter(Boolean);

    const hasContent = Boolean(
        fullName ||
            contactItems.length ||
            summary ||
            skills.length ||
            education.length ||
            workExperience.length ||
            projects.length ||
            certifications.length,
    );

    return (
        <article
            aria-label="Resume preview"
            className={"print-resume resume-template resume-template-" + selectedTemplate}
        >
            {!hasContent ? (
                <EmptyState />
            ) : (
                <>
                    {(fullName || contactItems.length > 0) && (
                        <header className="resume-header">
                            {fullName && <h1 className="resume-name">{fullName}</h1>}
                            {contactItems.length > 0 && (
                                <div className="resume-contact">
                                    {contactItems.map((item, index) => (
                                        <span className="resume-contact-item" key={item.kind}>
                                            {index > 0 && (
                                                <span
                                                    className="resume-contact-separator"
                                                    aria-hidden="true"
                                                >
                                                    |
                                                </span>
                                            )}
                                            {item.kind === "email" ? (
                                                <a href={"mailto:" + item.value}>{item.value}</a>
                                            ) : item.kind === "phone" ? (
                                                <a href={"tel:" + item.value}>{item.value}</a>
                                            ) : (
                                                item.value
                                            )}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </header>
                    )}

                    {summary && (
                        <Section title="Professional Summary">
                            <p className="resume-summary">{summary}</p>
                        </Section>
                    )}

                    {skills.length > 0 && (
                        <Section title="Skills">
                            <p className="resume-skills">
                                {skills.map((skill, index) => (
                                    <span key={skill.toLocaleLowerCase()}>
                                        {skill}
                                        {index < skills.length - 1 && (
                                            <span aria-hidden="true" className="resume-skill-separator">
                                                {" · "}
                                            </span>
                                        )}
                                    </span>
                                ))}
                            </p>
                        </Section>
                    )}

                    {workExperience.length > 0 && (
                        <Section title="Work Experience">
                            <div className="resume-entry-list">
                                {workExperience.map((entry, index) => {
                                    const position = cleanText(entry.position);
                                    const company = cleanText(entry.company);
                                    const detail = [cleanText(entry.location)]
                                        .filter(Boolean)
                                        .join(" · ");

                                    return (
                                        <article
                                            className="resume-entry print-entry"
                                            key={"experience-" + index}
                                        >
                                            <EntryHeading
                                                primary={position}
                                                secondary={company}
                                                detail={detail}
                                                date={formatDateRange(entry.startDate, entry.endDate)}
                                            />
                                            <DescriptionList value={entry.description} />
                                        </article>
                                    );
                                })}
                            </div>
                        </Section>
                    )}

                    {education.length > 0 && (
                        <Section title="Education">
                            <div className="resume-entry-list">
                                {education.map((entry, index) => {
                                    const degree = cleanText(entry.degree);
                                    const institution = cleanText(entry.institution);
                                    const detail = [
                                        cleanText(entry.fieldOfStudy),
                                        cleanText(entry.location),
                                    ]
                                        .filter(Boolean)
                                        .join(" · ");

                                    return (
                                        <article
                                            className="resume-entry print-entry"
                                            key={"education-" + index}
                                        >
                                            <EntryHeading
                                                primary={degree}
                                                secondary={institution}
                                                detail={detail}
                                                date={formatDateRange(entry.startDate, entry.endDate)}
                                            />
                                            <DescriptionList value={entry.description} />
                                        </article>
                                    );
                                })}
                            </div>
                        </Section>
                    )}

                    {projects.length > 0 && (
                        <Section title="Projects">
                            <div className="resume-entry-list">
                                {projects.map((entry, index) => {
                                    const name = cleanText(entry.name);
                                    const link = cleanText(entry.link);
                                    const technologies = cleanText(entry.technologies);
                                    const safeHref = getSafeHref(link);

                                    return (
                                        <article
                                            className="resume-entry print-entry"
                                            key={"project-" + index}
                                        >
                                            {(name || link) && (
                                                <div className="resume-project-heading">
                                                    {name && (
                                                        <h3 className="resume-entry-title">{name}</h3>
                                                    )}
                                                    {link && (
                                                        <a
                                                            className="resume-project-link"
                                                            href={safeHref || undefined}
                                                            target={safeHref ? "_blank" : undefined}
                                                            rel={safeHref ? "noreferrer" : undefined}
                                                        >
                                                            {link}
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                            {technologies && (
                                                <p className="resume-entry-detail resume-technologies">
                                                    <span className="resume-metadata-label">
                                                        Technologies:
                                                    </span>{" "}
                                                    {technologies}
                                                </p>
                                            )}
                                            <DescriptionList value={entry.description} />
                                        </article>
                                    );
                                })}
                            </div>
                        </Section>
                    )}

                    {certifications.length > 0 && (
                        <Section title="Certifications">
                            <div className="resume-entry-list">
                                {certifications.map((entry, index) => (
                                    <article
                                        className="resume-entry print-entry"
                                        key={"certification-" + index}
                                    >
                                        <EntryHeading
                                            primary={cleanText(entry.name)}
                                            detail={cleanText(entry.issuer)}
                                            date={formatMonth(entry.date)}
                                        />
                                    </article>
                                ))}
                            </div>
                        </Section>
                    )}
                </>
            )}
        </article>
    );
};

export default ResumePreview;
