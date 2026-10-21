const ScoreGauge = ({ score, label = "Candidate Suitability" }) => {
  const numericScore = Number(score);
  const validScore =
    score !== null &&
    score !== undefined &&
    score !== "" &&
    Number.isFinite(numericScore) &&
    numericScore >= 0 &&
    numericScore <= 100;

  const value = validScore ? numericScore : 0;

  const status = !validScore
    ? "Score unavailable"
    : value >= 80
      ? "Strong match"
      : value >= 60
        ? "Moderate match"
        : "Needs improvement";

  const color = !validScore
    ? "#94a3b8"
    : value >= 80
      ? "#059669"
      : value >= 60
        ? "#d97706"
        : "#e11d48";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{label}</h2>

      <div className="mt-6 flex justify-center">
        <div
          className="relative flex size-48 items-center justify-center rounded-full"
          style={{
            background: validScore
              ? `conic-gradient(${color} ${value * 3.6}deg, #e2e8f0 0deg)`
              : "#e2e8f0",
          }}
          role="img"
          aria-label={
            validScore
              ? `${label}: ${value} out of 100`
              : `${label}: unavailable`
          }
        >
          <div className="flex size-40 flex-col items-center justify-center rounded-full bg-white">
            <span className="text-5xl font-bold text-slate-900">
              {validScore ? Math.round(value) : "—"}
            </span>

            <span className="mt-1 text-sm text-slate-500">
              {validScore ? "out of 100" : "No score"}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-5 text-center font-semibold" style={{ color }}>
        {status}
      </p>

      <p className="mt-2 text-center text-sm leading-6 text-slate-500">
        This score reflects the model's output. It is not a guarantee of hiring
        or selection.
      </p>
    </section>
  );
};

export default ScoreGauge;
