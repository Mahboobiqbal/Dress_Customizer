import { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import PromptBar from "../components/PromptBar.jsx";
import CustomizerPanel from "../components/CustomizerPanel.jsx";
import Preview from "../components/Preview.jsx";
import VariantsTray from "../components/VariantsTray.jsx";
import { gownDesignsAPI, aiAPI } from "../utils/api.js";
import toast from "react-hot-toast";

export default function Studio() {
  const location = useLocation();
  const [prompt, setPrompt] = useState("");
  const [params, setParams] = useState({
    color: "#EC4899",
    pattern: "solid",
    sleeveLength: 70,
    neckline: "v-neck",
    trainLength: 50,
    texture: "satin",
    textureIntensity: 40,
    skirtVolume: 60,
    prompt: "",
  });
  const [variants, setVariants] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiImageUrl, setAiImageUrl] = useState(null);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("pollinations");
  const previewRef = useRef(null);

  useEffect(() => {
    aiAPI.listModels().then((res) => {
      if (res.models?.length) {
        setModels(res.models);
        const defaultModel = res.models.find((m) => m.id === 'pollinations')
          || res.models.find((m) => m.key_configured && !m.requires_key)
          || res.models.find((m) => m.key_configured)
          || res.models[0];
        setSelectedModel(defaultModel.id);
      }
    }).catch(() => {
      setModels([
        { id: "subnp-turbo", name: "SubNP (turbo)", provider: "SubNP", requires_key: false, key_configured: true },
        { id: "subnp-flux", name: "SubNP (flux)", provider: "SubNP", requires_key: false, key_configured: true },
        { id: "subnp-magic", name: "SubNP (magic)", provider: "SubNP", requires_key: false, key_configured: true },
      ]);
    });
  }, []);

  useEffect(() => {
    const incoming = location?.state?.design;
    if (incoming) {
      setParams((p) => ({
        ...p,
        color: incoming.color || p.color,
        pattern: incoming.pattern || p.pattern,
        sleeveLength: incoming.sleeve_length ?? p.sleeveLength,
        neckline: incoming.neckline || p.neckline,
        trainLength: incoming.train_length ?? p.trainLength,
        texture: incoming.texture || p.texture,
        textureIntensity: incoming.texture_intensity ?? p.textureIntensity,
        skirtVolume: incoming.skirt_volume ?? p.skirtVolume,
      }));
      setPrompt(incoming.name || "");
      if (incoming.id) setEditingId(incoming.id);
      try {
        window.history.replaceState({}, document.title);
      } catch (err) {
        console.debug("replaceState ignored:", err);
      }
    }
  }, [location]);

  const onGenerate = async () => {
    setIsGenerating(true);
    const effectivePrompt = prompt.trim() || params.prompt?.trim() || "Elegant dress";
    try {
      const response = await aiAPI.generateImage(effectivePrompt, {
        color: params.color,
        pattern: params.pattern,
        neckline: params.neckline,
        sleeve_length: params.sleeveLength,
        train_length: params.trainLength,
        texture: params.texture,
        texture_intensity: params.textureIntensity,
        skirt_volume: params.skirtVolume,
      }, selectedModel);

      if (response.image) {
        setAiImageUrl(response.image);
        const name = prompt?.trim() || "Realistic Design";
        setVariants((v) =>
          [
            {
              id: crypto.randomUUID(),
              name,
              timestamp: Date.now(),
              svg: null,
              params,
              thumb: response.image,
              isAIGenerated: true,
            },
            ...v,
          ].slice(0, 12),
        );
        toast.success("Realistic design generated!");
      } else {
        toast.error(response.error || "Image generation failed");
      }
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("Generation failed: " + (error.message || "Unknown error"));
    }
    setIsGenerating(false);
  };

  const addVariant = async () => {
    const currentImage = aiImageUrl;
    if (!currentImage) {
      toast.error("Generate a design first before saving.");
      return;
    }

    try {
      const name = prompt?.trim() || "Design";

      const designData = {
        name,
        prompt: prompt || "",
        color: params.color,
        pattern: params.pattern,
        sleeve_length: params.sleeveLength,
        neckline: params.neckline,
        train_length: params.trainLength,
        texture: params.texture,
        texture_intensity: params.textureIntensity,
        skirt_volume: params.skirtVolume,
        image_url: currentImage,
      };

      let result;
      if (editingId) {
        result = await gownDesignsAPI.update(editingId, designData);
        toast.success(`Design "${name}" updated`);
      } else {
        result = await gownDesignsAPI.create(designData);
        toast.success(`Design "${name}" saved to your library!`);
      }

      setVariants((v) => [{
        id: result.design.id,
        name,
        timestamp: Date.now(),
        params,
        thumb: currentImage,
        isAIGenerated: true,
      }, ...v].slice(0, 12));

      if (editingId) setEditingId(null);
    } catch (error) {
      console.error("Failed to save design:", error);
      toast.error("Failed to save design. Please try again.");
    }
  };

  const loadVariant = (v) => {
    setParams(v.params);
    setPrompt(v.name === "Design" ? "" : v.name);
    if (v.thumb) {
      setAiImageUrl(v.thumb);
    }
  };

  const downloadImage = (format) => {
    const url = aiImageUrl;
    if (!url) {
      toast.error("Generate a design first before exporting.");
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = `dress-design-${Date.now()}.${format}`;
    a.click();
  };

  const exportSvg = () => downloadImage("jpg");
  const exportPng = () => downloadImage("png");

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, #87CEEB 0%, #87CEEB 30%, #ADD8E6 70%, #E0F6FF 100%)",
        color: "#001a33",
      }}
    >
      <main className="mx-auto max-w-7xl px-4 pb-8">
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <section className="lg:col-span-7 order-2 lg:order-1 flex flex-col gap-4">
                <CustomizerPanel
                  params={params}
                  setParams={setParams}
                  onSaveVariant={addVariant}
                  isGenerating={isGenerating}
                  onGenerate={onGenerate}
                  models={models}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                />
                <PromptBar
                  prompt={prompt}
                  onChange={setPrompt}
                  onGenerate={onGenerate}
                  isGenerating={isGenerating}
                />
              </section>

              <section className="lg:col-span-5 order-1 lg:order-2 flex lg:justify-end justify-center">
                <div className="w-full max-w-lg">
                  <Preview
                    ref={previewRef}
                    isGenerating={isGenerating}
                    onExportSvg={exportSvg}
                    onExportPng={exportPng}
                    aiImageUrl={aiImageUrl}
                  />
                </div>
              </section>
            </div>

            <VariantsTray variants={variants} onSelect={loadVariant} />
          </div>
        </div>
      </main>
    </div>
  );
}


