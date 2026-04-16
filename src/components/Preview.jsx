import React, { forwardRef } from "react";
import { DressSVG } from "../utils/dressGenerator.jsx";

const Preview = forwardRef(function Preview(
  { params, isGenerating, onExportSvg, onExportPng, useAI },
  ref,
) {
  return (
    <div
      className="rounded-2xl border p-5 backdrop-blur-lg shadow-xl flex flex-col h-full"
      style={{
        border: "1px solid rgba(255,255,255,0.4)",
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.6), rgba(255,255,255,0.3))",
        color: "#001a33",
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#0066cc]/20 pb-3 mb-4">
        <h2 className="text-base font-bold uppercase tracking-widest text-[#0066cc]">
          Preview
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onExportSvg}
            className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-all duration-200 shadow-sm hover:bg-white/50"
            style={{
              border: "1px solid rgba(0, 102, 204, 0.2)",
              background: "rgba(255,255,255,0.4)",
              color: "#001a33",
            }}
          >
            SVG
          </button>
          <button
            onClick={onExportPng}
            className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-all duration-200 shadow-sm hover:bg-white/50"
            style={{
              border: "1px solid rgba(0, 102, 204, 0.2)",
              background: "rgba(255,255,255,0.4)",
              color: "#001a33",
            }}
          >
            PNG
          </button>
        </div>
      </div>

      <div
        className="flex-1 min-h-[500px] w-full rounded-xl grid place-items-center overflow-hidden shadow-inner"
        style={{
          background: "rgba(255,255,255,0.5)",
          border: "1px solid rgba(255,255,255,0.5)",
        }}
      >
        {isGenerating ? (
          <div
            className="flex flex-col items-center text-sm"
            style={{ color: "#0066cc" }}
          >
            <div className="h-8 w-8 rounded-full border-2 border-[#0066cc] border-t-[#0099ff] animate-spin" />
            <span className="mt-2">Rendering…</span>
          </div>
        ) : (
          <DressSVG ref={ref} params={params} useAI={useAI} />
        )}
      </div>
      <p className="mt-3 text-xs" style={{ color: "#0066cc" }}>
        Tip: Save variants to compare styles side-by-side.
      </p>
    </div>
  );
});

export default Preview;
