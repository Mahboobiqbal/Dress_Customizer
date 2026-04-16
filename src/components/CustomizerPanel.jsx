import React from "react";

export default function CustomizerPanel({
  params,
  setParams,
  onSaveVariant,
  isGenerating,
  useAI,
  setUseAI,
  onGenerate,
}) {
  const set = (k, v) => setParams((p) => ({ ...p, [k]: v }));

  const presets = [
    "#111827",
    "#2457F5",
    "#E11D48",
    "#10B981",
    "#A855F7",
    "#F59E0B",
    "#FFFFFF",
  ];

  return (
    <div
      className="rounded-2xl border p-5 backdrop-blur-lg shadow-xl"
      style={{
        border: "1px solid rgba(255,255,255,0.4)",
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.6), rgba(255,255,255,0.3))",
        color: "#001a33",
      }}
    >
      <div className="flex items-center justify-between border-b border-[#0066cc]/20 pb-3 mb-4">
        <h2 className="text-base font-bold uppercase tracking-widest text-[#0066cc] flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            ></path>
          </svg>
          Customize
        </h2>

        {/* Toggle Mode Button */}
        <div className="bg-white/40 p-1 rounded-lg border border-white/50 flex shadow-inner">
          <button
            onClick={() => setUseAI(false)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              !useAI
                ? "bg-[#0066cc] text-white shadow"
                : "text-[#001a33] hover:bg-white/50"
            }`}
          >
            SVG
          </button>
          <button
            onClick={() => setUseAI(true)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              useAI
                ? "bg-[#0099ff] text-white shadow"
                : "text-[#001a33] hover:bg-white/50"
            }`}
          >
            AI
          </button>
        </div>
      </div>

      {useAI ? (
        <div className="flex flex-col gap-2">
          <Label>Generation Prompt</Label>
          <textarea
            value={params.prompt || ""}
            onChange={(e) => set("prompt", e.target.value)}
            placeholder="Describe your dream dress (e.g., 'elegant red evening gown with lace details')"
            className="w-full rounded-xl border px-4 py-3 text-sm backdrop-blur-md resize-none shadow-inner focus:outline-none focus:ring-2 focus:ring-[#0099ff] focus:border-transparent transition-all"
            style={{
              border: "1px solid rgba(255,255,255,0.7)",
              background: "rgba(255,255,255,0.5)",
              color: "#001a33",
              minHeight: "120px",
            }}
            rows={4}
          />
          <button
            onClick={onGenerate}
            disabled={isGenerating || !params.prompt?.trim()}
            className="mt-3 w-full inline-flex items-center justify-center whitespace-nowrap rounded-xl px-5 py-3 font-bold shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: "linear-gradient(135deg,#0055bb 0%,#0099ff 100%)",
              color: "#ffffff",
              border: "none",
            }}
          >
            {isGenerating ? "Generating…" : "Generate AI Image"}
          </button>
          <p
            className="mt-2 text-xs text-center font-medium opacity-80"
            style={{ color: "#0055bb" }}
          >
            Powered by Google Generative AI
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-6">
          <div className="col-span-1">
            <Label>Color Palette</Label>
            <div className="flex items-center gap-3 mt-3">
              <input
                type="color"
                value={params.color}
                onChange={(e) => set("color", e.target.value)}
                className="h-10 w-14 rounded-xl border border-white/60 bg-white/40 cursor-pointer shadow-sm p-0 overflow-hidden"
              />
              <div className="flex flex-wrap gap-2">
                {presets.map((c) => (
                  <button
                    key={c}
                    onClick={() => set("color", c)}
                    aria-pressed={params.color === c}
                    className={`h-8 w-8 rounded-full border border-white/40 ring-2 ring-transparent transition-all duration-200 hover:scale-110 shadow-sm ${
                      params.color === c
                        ? "ring-[#0099ff] ring-offset-2 ring-offset-white/50 scale-110"
                        : "hover:ring-[#0066cc]/50"
                    }`}
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label>Pattern</Label>
            <select
              value={params.pattern}
              onChange={(e) => set("pattern", e.target.value)}
              className="mt-2 w-full rounded-xl border px-3 py-2.5 text-sm backdrop-blur-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0099ff] transition-all cursor-pointer"
              style={{
                border: "1px solid rgba(255,255,255,0.7)",
                background: "rgba(255,255,255,0.5)",
                color: "#001a33",
              }}
            >
              <option value="solid">Solid</option>
              <option value="stripes">Stripes</option>
              <option value="polka">Polka</option>
              <option value="floral">Floral</option>
              <option value="lace">Lace</option>
            </select>
          </div>

          <Slider
            label="Sleeve Length"
            value={params.sleeveLength}
            onChange={(v) => set("sleeveLength", v)}
          />

          <div>
            <Label>Neckline</Label>
            <select
              value={params.neckline}
              onChange={(e) => set("neckline", e.target.value)}
              className="mt-2 w-full rounded-xl border px-3 py-2.5 text-sm backdrop-blur-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0099ff] transition-all cursor-pointer"
              style={{
                border: "1px solid rgba(255,255,255,0.7)",
                background: "rgba(255,255,255,0.5)",
                color: "#001a33",
              }}
            >
              <option value="v-neck">V‑Neck</option>
              <option value="scoop">Scoop</option>
              <option value="off-shoulder">Off‑Shoulder</option>
              <option value="halter">Halter</option>
              <option value="boat">Boat</option>
            </select>
          </div>

          <Slider
            label="Train Length"
            value={params.trainLength}
            onChange={(v) => set("trainLength", v)}
          />

          <Slider
            label="Skirt Volume"
            value={params.skirtVolume}
            onChange={(v) => set("skirtVolume", v)}
          />

          <div>
            <Label>Fabric</Label>
            <select
              value={params.texture}
              onChange={(e) => set("texture", e.target.value)}
              className="mt-2 w-full rounded-xl border px-3 py-2.5 text-sm backdrop-blur-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0099ff] transition-all cursor-pointer"
              style={{
                border: "1px solid rgba(255,255,255,0.7)",
                background: "rgba(255,255,255,0.5)",
                color: "#001a33",
              }}
            >
              <option value="silk">Silk</option>
              <option value="satin">Satin</option>
              <option value="lace">Lace</option>
              <option value="velvet">Velvet</option>
              <option value="chiffon">Chiffon</option>
            </select>
          </div>

          <Slider
            label="Texture Intensity"
            value={params.textureIntensity}
            onChange={(v) => set("textureIntensity", v)}
          />
        </div>
      )}

      {/* Footer controls for procedural / common actions */}
      {!useAI && (
        <div className="mt-8 flex gap-3">
          <button
            onClick={onGenerate}
            disabled={
              isGenerating || (!useAI && !params.color && !params.pattern)
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-bold shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex-1"
            style={{
              background: "linear-gradient(135deg,#0055bb 0%,#0099ff 100%)",
              color: "#ffffff",
              border: "none",
            }}
          >
            {isGenerating ? (
              <>
                <Spinner className="w-5 h-5" /> Rendering...
              </>
            ) : (
              <>
                <WandIcon className="w-5 h-5" /> Render
              </>
            )}
          </button>
          <button
            onClick={onSaveVariant}
            disabled={isGenerating}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-bold shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "rgba(255,255,255,0.6)",
              color: "#0066cc",
              border: "1px solid rgba(255,255,255,1)",
            }}
          >
            <SaveIcon className="w-5 h-5" /> Save
          </button>
        </div>
      )}
    </div>
  );
}

function Label({ children }) {
  return (
    <div className="text-xs font-medium" style={{ color: "#001a33" }}>
      {children}
    </div>
  );
}

function Slider({ label, value, onChange }) {
  return (
    <div>
      <Label>
        {label}
        <span className="ml-2 font-normal" style={{ color: "#0066cc" }}>
          {value}
        </span>
      </Label>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,102,204,0.5) 0%, rgba(0,153,255,0.5) 100%)",
          outline: "none",
        }}
      />
    </div>
  );
}

function SaveIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M5 3h14l2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </svg>
  );
}

function WandIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="m15 4 6-3-3 6m-4 2 4 4" />
      <path d="M9 9l-5 5" />
      <path d="M6 20l-4 4" />
    </svg>
  );
}

function Spinner(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      {...props}
      className="animate-spin"
    >
      <circle cx="12" cy="12" r="10" strokeWidth="2" fill="none" />
    </svg>
  );
}
