export default function PromptBar({
  prompt,
  onChange,
  onGenerate,
  isGenerating,
}) {
  const suggestions = [
    "Blue evening gown with lace sleeves and long train",
    "Red satin A-line with off-shoulder neckline",
    "Emerald velvet ballgown with long sleeves",
    "Minimal white silk slip dress",
  ];

  return (
    <section className="mt-0">
      <div
        className="rounded-xl border p-4 backdrop-blur-lg shadow-lg flex flex-col gap-3"
        style={{
          border: "1px solid rgba(255,255,255,0.3)",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.2))",
          color: "#001a33",
        }}
      >
        <h2 className="text-sm font-medium uppercase tracking-wider text-[#0066cc]">
          Magic Prompt
        </h2>

        <textarea
          value={prompt}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder="Describe your dress… e.g. 'Generate a blue evening gown with lace sleeves and a long train.'"
          className="w-full resize-none rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0099ff] backdrop-blur-sm"
          style={{
            border: "1px solid rgba(255,255,255,0.5)",
            background: "rgba(255,255,255,0.4)",
            color: "#001a33",
          }}
        />

        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => onChange(s)}
              className="text-xs px-2.5 py-1 rounded-full border transition-all duration-200 hover:bg-white/50 cursor-pointer"
              style={{
                border: "1px solid rgba(0, 102, 204, 0.2)",
                background: "rgba(255,255,255,0.2)",
                color: "#001a33",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          onClick={onGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="mt-2 w-full inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5 font-medium shadow-md transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(90deg,#0066cc 0%,#0099ff 100%)",
            color: "#ffffff",
            border: "none",
          }}
        >
          {isGenerating ? (
            <span className="inline-flex items-center gap-2">
              <Spinner className="w-4 h-4 text-white" /> Generating…
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <WandIcon className="w-4 h-4 text-white" /> Generate Design
            </span>
          )}
        </button>
      </div>
    </section>
  );
}

function WandIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M6 19 19 6l-1-1L5 18l1 1Z" />
      <path d="M15 6l3 3" />
      <path d="M8 7 7 8" />
      <path d="M16 19l1 1" />
      <path d="M3 3l1 1" />
    </svg>
  );
}

function Spinner(props) {
  return (
    <svg viewBox="0 0 24 24" className="animate-spin" {...props}>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        opacity="0.2"
        fill="none"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
    </svg>
  );
}
