import { Link } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  FileSearch,
  FileText,
  GraduationCap,
  Sparkles,
  Target,
  Upload,
} from "lucide-react";

import { useAuth } from "../context/useAuth";

const featureCards = [
  {
    to: "/builder",
    icon: FileText,
    title: "Resume Builder",
    description:
      "Create and refine a polished, professional resume with a live preview that updates as you type.",
    cta: "Open builder",
    accent: "indigo",
  },
  {
    to: "/resume-upload",
    icon: Upload,
    title: "Upload Resume",
    description:
      "Upload or manage your PDF resume and keep your latest version close at hand.",
    cta: "Manage resume",
    accent: "violet",
  },
  {
    to: "/job-recommendations",
    icon: BriefcaseBusiness,
    title: "Job Recommendations",
    description:
      "Find roles that align with the skills in a resume you choose.",
    cta: "Explore jobs",
    accent: "blue",
  },
  {
    to: "/education-recommendations",
    icon: GraduationCap,
    title: "Education Recommendations",
    description: "Explore study programs related to your experience and goals.",
    cta: "Explore programs",
    accent: "emerald",
  },
  {
    to: "/suitability",
    icon: Target,
    title: "Suitability Checker",
    description: "Compare a selected resume with a job description.",
    cta: "Check suitability",
    accent: "amber",
  },
  {
    to: "/ats-checker",
    icon: FileSearch,
    title: "ATS Score Checker",
    description: "Review matching skills and keywords for a target role.",
    cta: "Check ATS score",
    accent: "cyan",
  },
];

const accentStyles = {
  indigo: {
    iconBg: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100",
    border: "hover:border-indigo-200",
    cta: "text-indigo-600",
    arrow:
      "text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-600",
    ring: "focus-visible:ring-indigo-100",
  },
  violet: {
    iconBg: "bg-violet-50 text-violet-600 group-hover:bg-violet-100",
    border: "hover:border-violet-200",
    cta: "text-violet-600",
    arrow:
      "text-slate-400 group-hover:translate-x-1 group-hover:text-violet-600",
    ring: "focus-visible:ring-violet-100",
  },
  blue: {
    iconBg: "bg-blue-50 text-blue-700 group-hover:bg-blue-100",
    border: "hover:border-blue-200",
    cta: "text-blue-700",
    arrow: "text-slate-400 group-hover:translate-x-1 group-hover:text-blue-700",
    ring: "focus-visible:ring-blue-100",
  },
  emerald: {
    iconBg: "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100",
    border: "hover:border-emerald-200",
    cta: "text-emerald-700",
    arrow:
      "text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-700",
    ring: "focus-visible:ring-emerald-100",
  },
  amber: {
    iconBg: "bg-amber-50 text-amber-700 group-hover:bg-amber-100",
    border: "hover:border-amber-200",
    cta: "text-amber-700",
    arrow:
      "text-slate-400 group-hover:translate-x-1 group-hover:text-amber-700",
    ring: "focus-visible:ring-amber-100",
  },
  cyan: {
    iconBg: "bg-cyan-50 text-cyan-700 group-hover:bg-cyan-100",
    border: "hover:border-cyan-200",
    cta: "text-cyan-700",
    arrow: "text-slate-400 group-hover:translate-x-1 group-hover:text-cyan-700",
    ring: "focus-visible:ring-cyan-100",
  },
};

const Dashboard = () => {
  const { user } = useAuth();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="animate-fade-in px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-5xl">
        {/* ── Hero ────────────────────────────────────── */}
        <section aria-labelledby="dashboard-heading" className="mb-10 sm:mb-12">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <Sparkles className="size-3" />
            Your career workspace
          </div>
          <h1
            id="dashboard-heading"
            className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
          >
            {greeting()}, {user?.fullName?.split(" ")[0] || "there"}
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-500">
            Build a standout resume and keep your career materials organized in
            one place. Pick up where you left off.
          </p>
        </section>

        {/* ── Feature cards ───────────────────────────── */}
        <nav
          aria-label="Resume tools"
          className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2"
        >
          {featureCards.map((card) => {
            const styles = accentStyles[card.accent];
            const Icon = card.icon;

            return (
              <Link
                key={card.to}
                to={card.to}
                className={`group flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md no-underline sm:p-7 ${styles.border} ${styles.ring} focus-visible:outline-none focus-visible:ring-4`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span
                    className={`flex size-10 items-center justify-center rounded-lg transition ${styles.iconBg}`}
                  >
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <ArrowRight
                    className={`size-4 shrink-0 transition duration-200 ${styles.arrow}`}
                    strokeWidth={2}
                  />
                </div>

                <h2 className="mb-1.5 text-base font-semibold tracking-tight text-slate-900">
                  {card.title}
                </h2>
                <p className="mb-5 flex-1 text-sm leading-relaxed text-slate-500">
                  {card.description}
                </p>
                <span className={`text-sm font-semibold ${styles.cta}`}>
                  {card.cta}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* ── Empty tip ───────────────────────────────── */}
        <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-4 sm:mt-10">
          <p className="text-sm leading-relaxed text-slate-500">
            <span className="font-medium text-slate-600">Tip:</span> Start with
            the Resume Builder to create your professional CV, or upload an
            existing PDF to keep everything in one place.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
