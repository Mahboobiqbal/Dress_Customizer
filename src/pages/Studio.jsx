import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import CustomizerPanel from "../components/CustomizerPanel.jsx";
import MarkdownMessage from "../components/MarkdownMessage.jsx";
import { conversationsAPI, aiAPI, stylesAPI, gownDesignsAPI } from "../utils/api.js";
import toast from "react-hot-toast";

export default function Studio() {
  const location = useLocation();
  const { convId } = useParams();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [models, setModels] = useState([]);
  const [textModels, setTextModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("pollinations");
  const [genMode, setGenMode] = useState("text");
  const [showCustomize, setShowCustomize] = useState(false);
  const [params, setParams] = useState({
    color: "#EC4899", pattern: "solid", sleeveLength: 70,
    neckline: "v-neck", trainLength: 50, texture: "satin",
    textureIntensity: 40, skirtVolume: 60, prompt: "",
    dressType: "frock", category: "simple-party",
  });
  const [savedStyles, setSavedStyles] = useState([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveNameError, setSaveNameError] = useState("");
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [activeMention, setActiveMention] = useState(null);
  const inputRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [lastImageUrl, setLastImageUrl] = useState("");
  const [inputImage, setInputImage] = useState(null);
  const [inputImagePreview, setInputImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  const userInitials = user
    ? `${(user.first_name?.[0] || "").toUpperCase()}${(user.last_name?.[0] || "").toUpperCase()}`
    : user?.email?.[0]?.toUpperCase() || "?";

  const formatMsgTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

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
        category: params.category,
      });
      setSavedStyles((prev) => [res.style, ...prev]);
      if (lastImageUrl) {
        await gownDesignsAPI.create({
          name, prompt: name,
          color: params.color, pattern: params.pattern,
          sleeve_length: params.sleeveLength, neckline: params.neckline,
          train_length: params.trainLength, texture: params.texture,
          texture_intensity: params.textureIntensity, skirt_volume: params.skirtVolume,
          image_url: lastImageUrl,
        });
      }
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
      category: style.category || p.category,
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

    aiAPI.listModels().then((res) => {
      const img = res.image_models || [];
      const txt = res.text_models || [];
      setModels(img);
      setTextModels(txt);
      const def = img.find((m) => m.id === "pollinations")
        || img.find((m) => m.key_configured && !m.requires_key)
        || img[0];
      if (def) setSelectedModel(def.id);
    }).catch(() => {
      setModels([
        { id: "pollinations", name: "Pollinations.ai", provider: "Pollinations.ai", type: "image", requires_key: false, key_configured: true },
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

    if (state?.style) {
      const s = state.style;
      setParams((p) => ({
        ...p, color: s.color || p.color, pattern: s.pattern || p.pattern,
        sleeveLength: s.sleeve_length ?? p.sleeveLength, neckline: s.neckline || p.neckline,
        trainLength: s.train_length ?? p.trainLength, texture: s.texture || p.texture,
        textureIntensity: s.texture_intensity ?? p.textureIntensity, skirtVolume: s.skirt_volume ?? p.skirtVolume,
        category: s.category || p.category,
      }));
      setPrompt(s.name ? `Style: ${s.name}` : "");
      setShowCustomize(true);
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

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

  const onGenerate = async (forceImage = false) => {
    const text = prompt.trim() || params.prompt?.trim() || "Elegant dress";
    if (!text) return;

    // Check for @model:prompt pattern
    const mentionMatch = text.match(/^@(.+?):\s*(.+)$/s);
    let forceImageModel = null;
    let actualPrompt = text;

    if (mentionMatch) {
      const modelName = mentionMatch[1].trim();
      actualPrompt = mentionMatch[2].trim() || "Elegant dress";
      forceImageModel = models.find((m) => m.name.toLowerCase() === modelName.toLowerCase());
      if (!forceImageModel) {
        toast.error(`Model "${modelName}" not found.`);
        return;
      }
    }

    if (forceImageModel) {
      // @ mention overrides to image generation
      if (forceImageModel.requires_key && !forceImageModel.key_configured) {
        toast.error(`"${forceImageModel.name}" is not available. Please select another model.`);
        return;
      }

      setIsGenerating(true);
      setIsTyping(true);
      setPrompt("");
      setActiveMention(null);

      const userMsg = {
        id: "temp-" + Date.now(), sender_role: "user", content: actualPrompt,
        image_url: inputImagePreview || null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        let inputImageData = null;
        if (inputImage) inputImageData = await toBase64(inputImage);

        const response = await aiAPI.generateImage(actualPrompt, {
          color: params.color, pattern: params.pattern, neckline: params.neckline,
          sleeve_length: params.sleeveLength, train_length: params.trainLength,
          texture: params.texture, texture_intensity: params.textureIntensity,
          skirt_volume: params.skirtVolume, dress_type: params.dressType,
        }, forceImageModel.id, conversationId, inputImageData);

        if (response.image) {
          if (response.conversation_id && !conversationId) setConversationId(response.conversation_id);
          setLastImageUrl(response.image);
          clearInputImage();
          const aiMsg = {
            id: "msg-" + Date.now(), sender_role: "assistant",
            content: actualPrompt,
            image_url: response.image,
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
      setIsTyping(false);
      setIsGenerating(false);
      return;
    }

    // Normal flow (no @ mention)
    if (genMode === "text" && !forceImage) {
      const textModel = textModels.find((m) => m.key_configured) || textModels[0];
      if (textModel?.requires_key && !textModel?.key_configured) {
        toast.error(`"${textModel.name}" is not available. Please select another model.`);
        return;
      }
    } else {
      const currentModel = models.find((m) => m.id === selectedModel) || textModels.find((m) => m.id === selectedModel);
      if (currentModel?.requires_key && !currentModel?.key_configured) {
        toast.error(`"${currentModel.name}" is not available. Please select another model.`);
        return;
      }
    }

    setIsGenerating(true);
    setIsTyping(true);
    setPrompt("");

    const userMsg = {
      id: "temp-" + Date.now(), sender_role: "user", content: text,
      image_url: inputImagePreview || null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      let inputImageData = null;
      if (inputImage) {
        inputImageData = await toBase64(inputImage);
      }

      if (genMode === "text" && !forceImage) {
        const textModelId = (textModels.find((m) => m.key_configured) || textModels[0])?.id || "gemini-3.8-flash";
        const response = await aiAPI.generateText(text, textModelId, conversationId, inputImageData);
        if (response.text) {
          if (response.conversation_id && !conversationId) setConversationId(response.conversation_id);
          const aiMsg = {
            id: "msg-" + Date.now(), sender_role: "assistant",
            content: response.text,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, aiMsg]);
        } else {
          toast.error(response.error || "Generation failed");
          setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        }
      } else {
        const response = await aiAPI.generateImage(text, {
          color: params.color, pattern: params.pattern, neckline: params.neckline,
          sleeve_length: params.sleeveLength, train_length: params.trainLength,
          texture: params.texture, texture_intensity: params.textureIntensity,
          skirt_volume: params.skirtVolume, dress_type: params.dressType,
        }, selectedModel, conversationId, inputImageData);

        if (response.image) {
          if (response.conversation_id && !conversationId) setConversationId(response.conversation_id);
          setLastImageUrl(response.image);
          clearInputImage();
          const aiMsg = {
            id: "msg-" + Date.now(), sender_role: "assistant",
            content: prompt || "Here's your design",
            image_url: response.image,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, aiMsg]);
          toast.success("Design generated!");
        } else {
          toast.error(response.error || "Generation failed");
          setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        }
      }
    } catch (error) {
      toast.error("Generation failed: " + (error.message || "Unknown error"));
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
    }
    setIsTyping(false);
    setIsGenerating(false);
  };

  const resetChat = () => {
    setMessages([]);
    setConversationId(null);
    setPrompt("");
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in your browser");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setPrompt(finalTranscript + (interimTranscript ? " " + interimTranscript : ""));
    };

    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setPrompt(val);

    // Check for @ mention
    const mentionMatch = val.match(/@(\w*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1].toLowerCase());
      setMentionIndex(0);
      setShowMentionMenu(true);
      setShowSlashMenu(false);
      return;
    }
    if (showMentionMenu) setShowMentionMenu(false);

    const slashMatch = val.match(/\/(\w*)$/);
    if (slashMatch) {
      setSlashFilter(slashMatch[1].toLowerCase());
      setSlashIndex(0);
      setShowSlashMenu(true);
    } else if (showSlashMenu) {
      setShowSlashMenu(false);
    }
  };

  const selectMention = (model) => {
    // Replace @query with @ModelName: in the input
    const newPrompt = prompt.replace(/@\w*$/, `@${model.name}:`);
    setPrompt(newPrompt);
    setActiveMention(model);
    setShowMentionMenu(false);
    inputRef.current?.focus();
  };

  const removeMention = () => {
    const newPrompt = prompt.replace(/@\w+:\s*/, "");
    setPrompt(newPrompt);
    setActiveMention(null);
  };

  const handleKeyDown = (e) => {
    if (showMentionMenu) {
      const filtered = models.filter((m) => m.name.toLowerCase().includes(mentionQuery));
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((prev) => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (filtered.length > 0) {
          selectMention(filtered[Math.min(mentionIndex, filtered.length - 1)]);
          return;
        }
        setShowMentionMenu(false);
      }
      if (e.key === "Escape") {
        setShowMentionMenu(false);
        return;
      }
    }
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

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInputImage(file);
    setInputImagePreview(URL.createObjectURL(file));
  };

  const clearInputImage = () => {
    setInputImage(null);
    if (inputImagePreview) URL.revokeObjectURL(inputImagePreview);
    setInputImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const supportsImageInput = useMemo(() => {
    const m = models.find((m) => m.id === selectedModel);
    return m?.supports_image_input ?? false;
  }, [models, selectedModel]);

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{
        background: "#f0f4f8",
        color: "#001a33",
      }}
    >
      <div className="flex items-center justify-between px-3 py-2 shrink-0">
        <div className="flex items-center gap-1.5">
          {conversationId && (
            <button
              onClick={resetChat}
              className="text-[11px] px-2.5 py-1 rounded-full font-medium transition-all shrink-0 hover:shadow-sm"
              style={{
                background: "#ffffff",
                color: "#0066cc",
                border: "1px solid rgba(0,102,204,0.15)",
              }}
            >
              + New Chat
            </button>
          )}
        </div>
        <button
          onClick={() => setShowCustomize(!showCustomize)}
          className="text-[11px] px-3 py-1.5 rounded-full font-medium transition-all shrink-0 hover:shadow-sm flex items-center gap-1.5"
          style={{
            background: showCustomize ? "#0066cc" : "#ffffff",
            color: showCustomize ? "#fff" : "#0066cc",
            border: showCustomize ? "none" : "1px solid rgba(0,102,204,0.15)",
          }}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Customize
        </button>
      </div>

      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 overflow-y-auto ${
          showCustomize ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ borderLeft: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 border-b bg-white" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
          <h2 className="text-sm font-bold tracking-wide" style={{ color: "#001a33" }}>Customize</h2>
          <button
            onClick={() => setShowCustomize(false)}
            className="text-xs px-3 py-1.5 rounded-xl font-medium hover:bg-gray-100 transition-colors"
            style={{ color: "#0066cc", border: "1px solid rgba(0,102,204,0.15)" }}
          >
            Close
          </button>
        </div>
        <div className="p-4">
          <CustomizerPanel
            params={params} setParams={setParams}
            onSaveVariant={saveCurrentStyle}
            isGenerating={isGenerating} onGenerate={() => onGenerate(true)}
            models={models} selectedModel={selectedModel} onModelChange={setSelectedModel}
          />
        </div>
      </div>
      {showCustomize && <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm" onClick={() => setShowCustomize(false)} />}

      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowSaveDialog(false)}>
          <div className="rounded-2xl border shadow-2xl p-6 w-full max-w-sm mx-4" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold tracking-wide mb-4" style={{ color: "#001a33" }}>Save Design Style</h3>
            <input
              autoFocus
              value={saveName}
              onChange={(e) => { setSaveName(e.target.value); setSaveNameError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") confirmSaveStyle(); if (e.key === "Escape") setShowSaveDialog(false); }}
              placeholder="e.g. My Red Velvet Dress"
              className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0099ff]/30 transition-all"
              style={{ border: "1px solid rgba(0,0,0,0.08)", background: "#f8fafc", color: "#001a33" }}
            />
            {saveNameError && <p className="text-xs mt-1.5" style={{ color: "#E11D48" }}>{saveNameError}</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowSaveDialog(false)} className="flex-1 text-xs px-3 py-2.5 rounded-xl font-medium hover:bg-gray-100 transition-colors" style={{ background: "#f8fafc", color: "#0066cc", border: "1px solid rgba(0,102,204,0.15)" }}>Cancel</button>
              <button onClick={confirmSaveStyle} className="flex-1 text-xs px-3 py-2.5 rounded-xl font-medium text-white transition-all hover:shadow-md" style={{ background: "linear-gradient(135deg, #0066cc, #0099ff)", border: "none" }}>Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-2xl mx-auto px-4 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: "linear-gradient(135deg, rgba(0,102,204,0.1), rgba(0,153,255,0.05))", border: "1px solid rgba(0,102,204,0.1)" }}>
              <WandIcon className="w-5 h-5" style={{ color: "#0066cc" }} />
            </div>
            <p className="text-base font-bold" style={{ color: "#001a33" }}>Design Your Dream Dress</p>
            <p className="text-xs mt-1.5 max-w-xs" style={{ color: "#004999" }}>
              Describe a dress, upload a photo, or both — and let MenteE AI bring your vision to life.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
              {["A red velvet evening gown", "Upload my photo & pick a dress", "Elegant outfit for a wedding"].map((s) => (
                <button key={s} onClick={() => setPrompt(s)} className="text-[11px] px-2.5 py-1 rounded-full font-medium transition-all hover:scale-105" style={{ background: "rgba(0,102,204,0.08)", color: "#0066cc", border: "1px solid rgba(0,102,204,0.15)" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2.5 ${msg.sender_role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.sender_role !== "user" && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg, #0066cc, #0099ff)", color: "#fff" }}>
                    M
                  </div>
                )}
                <div className={`flex flex-col ${msg.sender_role === "user" ? "items-end" : "items-start"} max-w-[70%]`}>
                  <div
                    className={`rounded-2xl px-3.5 py-2 ${
                      msg.sender_role === "user" ? "rounded-br-md" : "rounded-bl-md"
                    }`}
                    style={{
                      background: msg.sender_role === "user"
                        ? "linear-gradient(135deg, #0066cc, #0099ff)"
                        : "#ffffff",
                      color: msg.sender_role === "user" ? "#fff" : "#001a33",
                      border: msg.sender_role === "user" ? "none" : "1px solid rgba(0,0,0,0.06)",
                      boxShadow: msg.sender_role === "user"
                        ? "0 1px 6px rgba(0,102,204,0.2)"
                        : "0 1px 4px rgba(0,0,0,0.04)",
                    }}
                  >
                    {msg.sender_role === "user" ? (
                      <div>
                        {msg.image_url && (
                          <img src={msg.image_url} alt="Your upload" className="w-16 h-16 rounded-lg object-cover mb-1.5" />
                        )}
                        <p className="text-xs whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                    ) : (
                      <div>
                        {msg.image_url ? (
                          <div className="relative group cursor-pointer" onClick={() => downloadImage(msg.image_url)}>
                            <img
                              src={msg.image_url}
                              alt="Generated design"
                              className="w-full rounded-xl object-cover"
                              style={{ maxHeight: "240px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button className="text-[10px] px-2 py-1 rounded-md font-medium bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors">
                                Download
                              </button>
                            </div>
                          </div>
                        ) : (
                          <MarkdownMessage content={msg.content} />
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] mt-1 px-1" style={{ color: "#cbd5e1" }}>
                    {formatMsgTime(msg.created_at)}
                  </span>
                </div>
                {msg.sender_role === "user" && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5" style={{ background: "#f0f4f8", color: "#0066cc", border: "1px solid rgba(0,0,0,0.06)" }}>
                    {userInitials}
                  </div>
                )}
              </div>
            ))}
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg, #0066cc, #0099ff)", color: "#fff" }}>
                  M
                </div>
                <div className="rounded-2xl rounded-bl-md px-4 py-3" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#94a3b8", animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#94a3b8", animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#94a3b8", animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={chatEndRef} />
        </div>
      </div>

      <div className="px-4 pb-3 pt-1.5 shrink-0 flex justify-center">
        <div
          className="w-full max-w-2xl rounded-2xl"
          style={{
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          {/* Active mention chip */}
          {activeMention && (
            <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-0">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1" style={{ background: "rgba(0,102,204,0.08)", color: "#0066cc" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#0066cc" }} />
                @{activeMention.name}
              </span>
              <button onClick={removeMention} className="text-[9px] w-4 h-4 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors" style={{ color: "#94a3b8" }}>x</button>
            </div>
          )}

          {/* Input image preview */}
          {inputImagePreview && (
            <div className="px-3 pt-2.5 pb-0">
              <div className="inline-flex items-center gap-1.5 rounded-lg border bg-gray-50 p-1.5" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                <img src={inputImagePreview} alt="Input" className="h-10 w-10 rounded-md object-cover" />
                <span className="text-[10px] font-medium truncate max-w-[80px]" style={{ color: "#001a33" }}>{inputImage.name}</span>
                <button onClick={clearInputImage} className="text-[10px] p-0.5 rounded hover:bg-gray-200 transition-colors" style={{ color: "#94a3b8" }}>&#x2715;</button>
              </div>
            </div>
          )}

          {/* Menus */}
          <div className="relative">
            {showMentionMenu && (() => {
              const filtered = models.filter((m) => m.name.toLowerCase().includes(mentionQuery));
              return filtered.length > 0 ? (
                <div
                  className="absolute bottom-full left-3 right-3 mb-2 rounded-xl border shadow-xl overflow-hidden z-10"
                  style={{ border: "1px solid rgba(0,0,0,0.06)", background: "#ffffff", maxHeight: "180px", overflowY: "auto" }}
                >
                  <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider" style={{ color: "#cbd5e1" }}>
                    Generate Image With
                  </div>
                  {filtered.map((m, i) => (
                    <button
                      key={m.id}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] transition-colors text-left ${i === mentionIndex ? "bg-[#0066cc]/8" : "hover:bg-gray-50"}`}
                      style={{ color: "#001a33" }}
                      onClick={() => selectMention(m)}
                      onMouseEnter={() => setMentionIndex(i)}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: m.key_configured ? "#10B981" : "#E11D48" }} />
                      <span className="font-medium">{m.name}</span>
                      <span className="text-[9px]" style={{ color: "#94a3b8" }}>{m.provider}</span>
                    </button>
                  ))}
                </div>
              ) : null;
            })()}
            {showSlashMenu && (
              <div
                className="absolute bottom-full left-3 right-3 mb-2 rounded-xl border shadow-xl overflow-hidden z-10"
                style={{ border: "1px solid rgba(0,0,0,0.06)", background: "#ffffff", maxHeight: "200px", overflowY: "auto" }}
              >
                <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider" style={{ color: "#cbd5e1" }}>
                  Saved Styles
                </div>
                {savedStyles.length === 0 ? (
                  <p className="px-3 py-2 text-[11px] text-center" style={{ color: "#94a3b8" }}>No saved styles yet.</p>
                ) : (
                  savedStyles.filter((s) => s.name.toLowerCase().includes(slashFilter)).map((style, i) => (
                    <button key={style.id} className={`w-full flex items-center justify-between px-3 py-1.5 text-[11px] transition-colors text-left ${i === slashIndex ? "bg-[#0066cc]/8" : "hover:bg-gray-50"}`} style={{ color: "#001a33" }} onClick={() => { setSlashIndex(-1); applyStyle(style); }} onMouseEnter={() => setSlashIndex(i)}>
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full border border-black/5 inline-block shrink-0" style={{ background: style.color }} />
                        <span className="truncate max-w-[120px]">{style.name}</span>
                      </span>
                      <span className="text-[9px] opacity-30 hover:opacity-100 px-1 rounded hover:bg-red-50 transition-all" onClick={(e) => { e.stopPropagation(); deleteStyle(style.id); }}>x</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Textarea + buttons row */}
          <div className="flex items-end gap-1 px-3 pb-2 pt-1.5">
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask MenteE AI anything... (type @ for image generation)"
              rows={1}
              className="flex-1 resize-none text-[13px] py-1 focus:outline-none transition-all leading-relaxed"
              style={{ background: "transparent", color: "#001a33" }}
            />
            <button
              onClick={toggleVoiceInput}
              className="rounded-lg p-1.5 transition-all duration-200 shrink-0 hover:bg-gray-100"
              style={{ color: isListening ? "#E11D48" : "#94a3b8" }}
              title={isListening ? "Stop voice input" : "Start voice input"}
            >
              <MicIcon className={`w-4 h-4 ${isListening ? "animate-pulse" : ""}`} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!supportsImageInput}
              className="rounded-lg p-1.5 transition-all duration-200 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100"
              style={{ color: inputImage ? "#0066cc" : "#94a3b8" }}
              title="Upload an image"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>
            <button
              onClick={onGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="rounded-lg p-1.5 transition-all duration-200 shrink-0 disabled:opacity-30 hover:bg-gray-100"
              style={{ color: "#0066cc" }}
            >
              {isGenerating ? (
                <Spinner className="w-4 h-4" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 7-7 7 7" />
                  <path d="M12 19V5" />
                </svg>
              )}
            </button>
          </div>
        </div>
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

function MicIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
