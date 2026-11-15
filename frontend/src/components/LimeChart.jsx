const LimeChart = ({ explanations = [], title = "Prediction Explanation" }) => {
  // Accept either an array or an object containing feature explanations.
  const items = Array.isArray(explanations)
    ? explanations
    : Array.isArray(explanations?.features)
      ? explanations.features
      : [];

  const normalizedItems = items
    .map((item, index) => ({
      feature:
        item.feature ?? item.name ?? item.label ?? `Feature ${index + 1}`,
      value: Number(item.contribution ?? item.weight ?? item.value),
    }))
    .filter((item) => Number.isFinite(item.value))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  const maxValue = Math.max(
    ...normalizedItems.map((item) => Math.abs(item.value)),
    0.01,
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

      <p className="mt-1 text-sm text-slate-500">
        How individual features contribute to the model's prediction.
      </p>

      {normalizedItems.length === 0 ? (
        <div className="mt-6 rounded-xl bg-slate-50 px-4 py-8 text-center">
          <p className="font-medium text-slate-700">
            No explanation data available
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Feature contributions will appear here when the model provides them.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-5">
            {normalizedItems.map((item, index) => {
              const positive = item.value >= 0;
              const width = (Math.abs(item.value) / maxValue) * 100;

              return (
                <div key={`${item.feature}-${index}`}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="break-words text-sm font-medium text-slate-700">
                      {item.feature}
                    </span>

                    <span
                      className={`shrink-0 text-sm font-semibold ${
                        positive ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {positive ? "+" : ""}
                      {item.value.toFixed(3)}
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        positive ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${width}%` }}
                      role="img"
                      aria-label={`${item.feature}: ${
                        positive ? "positive" : "negative"
                      } contribution of ${item.value.toFixed(3)}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="size-3 rounded-full bg-emerald-500" />
              Positive contribution
            </span>
            <span className="flex items-center gap-2 text-slate-600">
              <span className="size-3 rounded-full bg-rose-500" />
              Negative contribution
            </span>
          </div>
        </>
      )}
    </section>
  );
};

export default LimeChart;
