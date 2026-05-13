import { useEffect, useState } from "react";
import { aiAPI } from "../utils/api";

export default function Settings() {
  const [density, setDensity] = useState("comfortable");
  const [notifications, setNotifications] = useState(true);
  const [defaultModel, setDefaultModel] = useState("pollinations");
  const [models, setModels] = useState([]);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("settings") || "{}");
      if (s.density) setDensity(s.density);
      if (typeof s.notifications === "boolean") setNotifications(s.notifications);
      if (s.defaultModel) setDefaultModel(s.defaultModel);
    } catch {}
    aiAPI.listModels().then((r) => setModels(r.models || [])).catch(() => {});
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("settings", JSON.stringify({ density, notifications, defaultModel }));
    } catch {}
  }, [density, notifications, defaultModel]);

  return (
    <div className="h-full overflow-y-auto" style={{ background: "linear-gradient(180deg, rgba(135,206,235,0.95), rgba(173,216,230,0.9))", color: "#001a33" }}>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Settings</h1>
        <p className="text-sm mb-6" style={{ color: "#0066cc" }}>Customize your experience</p>

        <div className="space-y-4">
          <div className="rounded-xl border p-5 shadow-md" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.4)", backdropFilter: "blur(10px)" }}>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#0066cc" }}>Display</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: "#001a33" }}>Layout Density</label>
                <div className="flex gap-2">
                  {["comfortable", "compact"].map((d) => (
                    <button key={d} onClick={() => setDensity(d)} className={`text-xs px-4 py-2 rounded-lg font-medium transition-all ${density === d ? "shadow-sm" : "hover:bg-white/50"}`} style={{ background: density === d ? "linear-gradient(90deg,#0066cc,#0099ff)" : "rgba(255,255,255,0.5)", color: density === d ? "#fff" : "#0066cc", border: density === d ? "none" : "1px solid rgba(0,102,204,0.2)" }}>
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-5 shadow-md" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.4)", backdropFilter: "blur(10px)" }}>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#0066cc" }}>AI & Generation</h2>
            </div>
            <div>
              <label className="text-xs font-medium block mb-2" style={{ color: "#001a33" }}>Default Model</label>
              <select value={defaultModel} onChange={(e) => setDefaultModel(e.target.value)} className="w-full md:w-72 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0099ff]" style={{ border: "1px solid rgba(0,102,204,0.2)", background: "rgba(255,255,255,0.7)", color: "#001a33" }}>
                {models.map((m) => (
                  <option key={m.id} value={m.id} disabled={m.requires_key && !m.key_configured}>{m.name}</option>
                ))}
              </select>
              <p className="text-[10px] mt-1.5" style={{ color: "#004999" }}>Selected model will be pre-selected when you open Studio</p>
            </div>
          </div>

          <div className="rounded-xl border p-5 shadow-md" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.4)", backdropFilter: "blur(10px)" }}>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#0066cc" }}>Notifications</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium" style={{ color: "#001a33" }}>Email updates</span>
                <p className="text-[10px]" style={{ color: "#004999" }}>Receive updates about new features</p>
              </div>
              <button onClick={() => setNotifications(!notifications)} className={`relative w-11 h-6 rounded-full transition-colors ${notifications ? "" : "opacity-50"}`} style={{ background: notifications ? "linear-gradient(90deg,#0066cc,#0099ff)" : "rgba(0,102,204,0.2)" }}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${notifications ? "translate-x-[22px]" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>

          <div className="rounded-xl border p-5 shadow-md" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.4)", backdropFilter: "blur(10px)" }}>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#0066cc" }}>API Keys</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium" style={{ color: "#001a33" }}>Google AI</span>
                <p className="text-[10px]" style={{ color: "#004999" }}>Used for Gemini-Enhanced generation</p>
              </div>
              <span className="text-[10px] px-2 py-1 rounded font-medium" style={{ background: models.find((m) => m.id === "gemini-enhanced")?.key_configured ? "rgba(16,185,129,0.15)" : "rgba(225,29,72,0.1)", color: models.find((m) => m.id === "gemini-enhanced")?.key_configured ? "#10B981" : "#E11D48" }}>
                {models.find((m) => m.id === "gemini-enhanced")?.key_configured ? "Configured" : "Not set"}
              </span>
            </div>
          </div>

          <div className="rounded-xl border p-5 shadow-md" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.4)", backdropFilter: "blur(10px)" }}>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#0066cc" }}>About</h2>
            </div>
            <div className="text-xs space-y-1" style={{ color: "#004999" }}>
              <p>Dress Customizer v1.0</p>
              <p>AI-powered fashion design with real-time image generation</p>
              <p>Uses Pollinations.ai, Gemini, and SubNP APIs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
