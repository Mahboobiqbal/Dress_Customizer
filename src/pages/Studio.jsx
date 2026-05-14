import { useRef, useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import CustomizerPanel from "../components/CustomizerPanel.jsx";
import { conversationsAPI, aiAPI, stylesAPI, gownDesignsAPI } from "../utils/api.js";
import toast from "react-hot-toast";

export default function Studio() {
  const location = useLocation();
  const { convId } = useParams();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("pollinations");
  const [showCustomize, setShowCustomize] = useState(false);
  const [params, setParams] = useState({
    color: "#EC4899", pattern: "solid", sleeveLength: 70,
    neckline: "v-neck", trainLength: 50, texture: "satin",
    textureIntensity: 40, skirtVolume: 60, prompt: "",
    dressType: "frock",
  });
  const [savedStyles, setSavedStyles] = useState([]);
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveNameError, setSaveNameError] = useState("");
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);

  const saveCurrentStyle = () => {
    setSaveName("");
    setSaveNameError("");
    setShowSaveDialog(true);
  };

  const confirmSaveStyle = async () => {
    const name = saveName.trim();
    if (!name) {
      setSaveNameError("Please enter a name");
      return;
    }
    try {
      const res = await stylesAPI.create({
        name,
        color: params.color, pattern: params.pattern,
        sleeve_length: params.sleeveLength, neckline: params.neckline,
        train_length: params.trainLength, texture: params.texture,
        texture_intensity: params.textureIntensity, skirt_volume: params.skirtVolume,
      });
      setSavedStyles((prev) => [res.style, ...prev]);
      setShowSaveDialog(false);
      toast.success(`Style "${name}" saved!`);
    } catch {
      toast.error("Failed to save style");
    }
  };

  const applyStyle = (style) => {
    setParams((p) => ({
      ...p,
      color: style.color || p.color,
      pattern: style.pattern || p.pattern,
      neckline: style.neckline || p.neckline,
      texture: style.texture || p.texture,
      sleeveLength: style.sleeveLength ?? style.sleeve_length ?? p.sleeveLength,
      trainLength: style.trainLength ?? style.train_length ?? p.trainLength,
      textureIntensity: style.textureIntensity ?? style.texture_intensity ?? p.textureIntensity,
      skirtVolume: style.skirtVolume ?? style.skirt_volume ?? p.skirtVolume,
    }));
    setPrompt((prev) => {
      const withoutSlash = prev.replace(/\/\w*$/, "").trim();
      return withoutSlash ? `${withoutSlash} ` : "";
    });
    setShowSlashMenu(false);
    setShowCustomize(true);
    inputRef.current?.focus();
  };

  const deleteStyle = async (styleId) => {
    try {
      await stylesAPI.delete(styleId);
      setSavedStyles((prev) => prev.filter((s) => s.id !== styleId));
      toast.success("Style deleted");
    } catch {
      toast.error("Failed to delete style");
    }
  };

  useEffect(() => {
    stylesAPI.list().then((res) => setSavedStyles(res.styles || [])).catch(() => {});
    gownDesignsAPI.getAll().then((res) => setSavedDesigns(res.designs || [])).catch(() => {});

    aiAPI.listModels().then((res) => {
      if (res.models?.length) {
        setModels(res.models);
        const def = res.models.find((m) => m.id === "pollinations")
          || res.models.find((m) => m.key_configured && !m.requires_key)
          || res.models.find((m) => m.key_configured)
          || res.models[0];
        setSelectedModel(def.id);
      }
    }).catch(() => {
      setModels([
        { id: "pollinations", name: "Pollinations.ai", provider: "Pollinations.ai", requires_key: false, key_configured: true },
        { id: "subnp-turbo", name: "SubNP (turbo)", provider: "SubNP", requires_key: false, key_configured: true },
      ]);
    });
  }, []);

  useEffect(() => {
    const state = location.state;

    if (state?.design) {
      const d = state.design;
      setParams((p) => ({
        ...p, color: d.color || p.color, pattern: d.pattern || p.pattern,
        sleeveLength: d.sleeve_length ?? p.sleeveLength, neckline: d.neckline || p.neckline,
        trainLength: d.train_length ?? p.trainLength, texture: d.texture || p.texture,
        textureIntensity: d.texture_intensity ?? p.textureIntensity, skirtVolume: d.skirt_volume ?? p.skirtVolume,
      }));
      setPrompt(d.name || "");
      try { window.history.replaceState({}, document.title); } catch {}
      return;
    }

    if (convId && convId !== conversationId) {
      setConversationId(convId);
      conversationsAPI.get(convId).then((res) => {
        if (res.messages) {
          setMessages(res.messages);
        }
      }).catch(() => toast.error("Failed to load conversation"));
    }
  }, [location, convId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onGenerate = async () => {
    const text = prompt.trim() || params.prompt?.trim() || "Elegant dress";
    if (!text) return;

    setIsGenerating(true);
    setPrompt("");

    const userMsg = { id: "temp-" + Date.now(), sender_role: "user", content: text, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await aiAPI.generateImage(text, {
        color: params.color, pattern: params.pattern, neckline: params.neckline,
        sleeve_length: params.sleeveLength, train_length: params.trainLength,
        texture: params.texture, texture_intensity: params.textureIntensity,
        skirt_volume: params.skirtVolume, dress_type: params.dressType,
      }, selectedModel, conversationId);

      if (response.image) {
        if (response.conversation_id && !conversationId) {
          setConversationId(response.conversation_id);
        }
        const aiMsg = {
          id: "msg-" + Date.now(), sender_role: "assistant",
          content: "Generated design", image_url: response.image,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        toast.success("Design generated!");
      } else {
        toast.error(response.error || "Generation failed");
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      }
    } catch (error) {
      toast.error("Generation failed: " + (error.message || "Unknown error"));
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
    }
    setIsGenerating(false);
  };

  const resetChat = () => {
    setMessages([]);
    setConversationId(null);
    setPrompt("");
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setPrompt(val);

    const slashMatch = val.match(/\/(\w*)$/);
    if (slashMatch) {
      setSlashFilter(slashMatch[1].toLowerCase());
      setSlashIndex(0);
      setShowSlashMenu(true);
    } else if (showSlashMenu) {
      setShowSlashMenu(false);
    }
  };

  const handleKeyDown = (e) => {
    if (showSlashMenu) {
      const filtered = savedStyles.filter((s) => s.name.toLowerCase().includes(slashFilter));
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashIndex((prev) => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (filtered.length > 0) {
          applyStyle(filtered[Math.min(slashIndex, filtered.length - 1)]);
          return;
        }
        setShowSlashMenu(false);
      }
      if (e.key === "Escape") {
        setShowSlashMenu(false);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onGenerate();
    }
  };

  const downloadImage = (url) => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `design-${Date.now()}.png`;
    a.click();
  };

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #87CEEB 0%, #87CEEB 30%, #ADD8E6 70%, #E0F6FF 100%)",
        color: "#001a33",
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#0066cc]/20 shrink-0">
        <h1 className="text-lg font-bold uppercase tracking-widest text-[#0066cc]">
          {conversationId ? "Chat" : "New Chat"}
        </h1>
        <div className="flex items-center gap-3">
          {conversationId && (
            <button
              onClick={resetChat}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all shrink-0"
              style={{
                background: "linear-gradient(90deg,#0066cc,#0099ff)",
                color: "#fff",
                border: "none",
              }}
            >
              + New Chat
            </button>
          )}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="text-xs rounded-lg border px-2 py-1.5 backdrop-blur-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0099ff] cursor-pointer"
            style={{ border: "1px solid rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.5)", color: "#001a33" }}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id} disabled={m.requires_key && !m.key_configured}>
                {m.name}{m.requires_key && !m.key_configured ? " (no key)" : ""}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowCustomize(!showCustomize)}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all shrink-0"
            style={{
              background: showCustomize ? "linear-gradient(90deg,#0066cc,#0099ff)" : "rgba(255,255,255,0.5)",
              color: showCustomize ? "#fff" : "#0066cc",
              border: "1px solid rgba(255,255,255,0.6)",
            }}
          >
            Customize
          </button>
        </div>
      </div>

      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white/90 backdrop-blur-xl shadow-2xl border-l border-[#0066cc]/20 transform transition-transform duration-300 overflow-y-auto ${
          showCustomize ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-[#0066cc]/20 bg-white/80 backdrop-blur-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#0066cc]">Customize</h2>
          <button
            onClick={() => setShowCustomize(false)}
            className="text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-white/80"
            style={{ color: "#0066cc", border: "1px solid rgba(0,102,204,0.2)" }}
          >
            Close
          </button>
        </div>
        <div className="p-4">
          <CustomizerPanel
            params={params} setParams={setParams}
            onSaveVariant={saveCurrentStyle}
            isGenerating={isGenerating} onGenerate={onGenerate}
            models={models} selectedModel={selectedModel} onModelChange={setSelectedModel}
          />
        </div>
      </div>
      {showCustomize && <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setShowCustomize(false)} />}

      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowSaveDialog(false)}>
          <div className="rounded-xl border shadow-xl p-5 w-full max-w-sm mx-4" style={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(255,255,255,0.5)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "#0066cc" }}>Save Design Style</h3>
            <input
              autoFocus
              value={saveName}
              onChange={(e) => { setSaveName(e.target.value); setSaveNameError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") confirmSaveStyle(); if (e.key === "Escape") setShowSaveDialog(false); }}
              placeholder="e.g. My Red Velvet Dress"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0099ff]"
              style={{ border: "1px solid rgba(0,102,204,0.2)", color: "#001a33" }}
            />
            {saveNameError && <p className="text-xs mt-1" style={{ color: "#E11D48" }}>{saveNameError}</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowSaveDialog(false)} className="flex-1 text-xs px-3 py-2 rounded-lg font-medium" style={{ background: "rgba(255,255,255,0.5)", color: "#0066cc", border: "1px solid rgba(0,102,204,0.2)" }}>Cancel</button>
              <button onClick={confirmSaveStyle} className="flex-1 text-xs px-3 py-2 rounded-lg font-medium text-white" style={{ background: "linear-gradient(90deg,#0066cc,#0099ff)", border: "none" }}>Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="text-4xl mb-4 opacity-30">&#x1F457;</div>
            <p className="text-lg font-medium" style={{ color: "#0066cc" }}>Describe your design</p>
            <p className="text-sm mt-1" style={{ color: "#004999" }}>
              Type a prompt below to generate a fashion design
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-xl p-3 shadow-md ${
                  msg.sender_role === "user" ? "rounded-br-sm" : "rounded-bl-sm"
                }`}
                style={{
                  background: msg.sender_role === "user"
                    ? "linear-gradient(135deg, #0066cc, #0099ff)"
                    : "rgba(255,255,255,0.85)",
                  color: msg.sender_role === "user" ? "#fff" : "#001a33",
                  border: msg.sender_role === "user" ? "none" : "1px solid rgba(255,255,255,0.5)",
                }}
              >
                {msg.sender_role === "user" ? (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div>
                    {msg.image_url ? (
                      <div className="relative group">
                        <p className="text-xs mb-1 opacity-70">{msg.content}</p>
                        <img
                          src={msg.image_url}
                          alt="Generated design"
                          className="w-full rounded-lg object-contain"
                          style={{ maxHeight: "400px" }}
                        />
                        <button
                          onClick={() => downloadImage(msg.image_url)}
                          className="absolute top-7 right-2 text-xs px-2 py-1 rounded bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Download
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                )}
                <p className={`text-[10px] mt-1 ${msg.sender_role === "user" ? "text-white/60" : "text-[#0066cc]/50"}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="px-4 pb-4 pt-2 shrink-0">
        <div
          className="flex items-end gap-2 rounded-xl border p-3 shadow-lg backdrop-blur-xl"
          style={{
            border: "1px solid rgba(255,255,255,0.4)",
            background: "rgba(255,255,255,0.6)",
          }}
        >
          <div className="flex-1 relative">
            {showSlashMenu && (
              <div
                className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border shadow-lg backdrop-blur-xl overflow-hidden"
                style={{
                  border: "1px solid rgba(255,255,255,0.4)",
                  background: "rgba(255,255,255,0.95)",
                  maxHeight: "280px",
                  overflowY: "auto",
                }}
              >
                <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: "#0066cc" }}>
                  Saved Styles
                </div>
                {savedStyles.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-center opacity-60">No saved styles. Open Customize & click Save.</p>
                ) : (
                  savedStyles.filter((s) => s.name.toLowerCase().includes(slashFilter)).map((style, i) => (
                    <button key={style.id} className={`w-full flex items-center justify-between px-3 py-1.5 text-sm transition-colors text-left ${i === slashIndex ? "bg-[#0066cc]/15" : "hover:bg-[#0066cc]/10"}`} style={{ color: "#001a33" }} onClick={() => { setSlashIndex(-1); applyStyle(style); }} onMouseEnter={() => setSlashIndex(i)}>
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full border border-white/50 inline-block shrink-0" style={{ background: style.color }} />
                        {style.name}
                      </span>
                      <span className="text-[10px] opacity-40 hover:opacity-100 px-1" onClick={(e) => { e.stopPropagation(); deleteStyle(style.id); }}>x</span>
                    </button>
                  ))
                )}

                <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider border-t" style={{ color: "#0066cc", borderColor: "rgba(0,102,204,0.1)" }}>
                  Recent Designs
                </div>
                {savedDesigns.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-center opacity-60">No designs yet. Generate in chat.</p>
                ) : (
                  savedDesigns.filter((d) => (d.name || "").toLowerCase().includes(slashFilter)).map((design, i) => (
                    <button key={design.id} className="w-full flex items-center justify-between px-3 py-1.5 text-sm transition-colors text-left hover:bg-[#0066cc]/10" style={{ color: "#001a33" }} onClick={() => applyStyle(design)}>
                      <span className="flex items-center gap-2 truncate">
                        <span className="w-3 h-3 rounded-full border border-white/50 inline-block shrink-0" style={{ background: design.color || "#EC4899" }} />
                        <span className="truncate">{design.name || "Untitled"}</span>
                      </span>
                      <span className="text-[10px] shrink-0 opacity-50" style={{ color: "#0066cc" }}>{new Date(design.created_at).toLocaleDateString()}</span>
                    </button>
                  ))
                )}
              </div>
            )}
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to design... (type / for saved styles)"
              rows={2}
              className="w-full resize-none rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0099ff] backdrop-blur-sm"
              style={{
                border: "1px solid rgba(255,255,255,0.5)",
                background: "rgba(255,255,255,0.4)",
                color: "#001a33",
              }}
            />
          </div>
          <button
            onClick={onGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-bold shadow-md transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
            style={{
              background: "linear-gradient(135deg,#0055bb 0%,#0099ff 100%)",
              color: "#ffffff",
              border: "none",
            }}
          >
            {isGenerating ? (
              <><Spinner className="w-4 h-4" /> Generating</>
            ) : (
              <><WandIcon className="w-4 h-4" /> Generate</>
            )}
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-center font-medium opacity-60" style={{ color: "#0055bb" }}>
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props} className="animate-spin">
      <circle cx="12" cy="12" r="10" strokeWidth="2" fill="none" />
    </svg>
  );
}
