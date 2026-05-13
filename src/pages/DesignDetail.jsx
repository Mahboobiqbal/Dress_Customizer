import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gownDesignsAPI } from "../utils/api.js";
import toast from "react-hot-toast";

export default function DesignDetail() {
  const { id } = useParams();
  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await gownDesignsAPI.getById(id);
        if (mounted) setDesign(res);
      } catch (err) {
        toast.error("Could not load design");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await gownDesignsAPI.delete(id);
      toast.success("Design deleted");
      navigate("/designs");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  const previewUrl = design?.image_url || design?.thumbnail || null;

  if (loading) {
    return (
      <div className="h-full overflow-y-auto flex items-center justify-center" style={{ background: "linear-gradient(180deg, rgba(135,206,235,0.95), rgba(173,216,230,0.9))" }}>
        <div className="animate-pulse text-sm font-medium" style={{ color: "#004999" }}>Loading design...</div>
      </div>
    );
  }

  if (!design) {
    return (
      <div className="h-full overflow-y-auto flex items-center justify-center" style={{ background: "linear-gradient(180deg, rgba(135,206,235,0.95), rgba(173,216,230,0.9))" }}>
        <div className="text-center">
          <div className="text-5xl mb-4 opacity-20">&#x1F50D;</div>
          <h2 className="text-lg font-bold" style={{ color: "#0066cc" }}>Design not found</h2>
          <p className="text-sm mt-1 mb-6" style={{ color: "#004999" }}>It may have been removed or the link is invalid.</p>
          <button onClick={() => navigate("/designs")} className="text-sm px-5 py-2.5 rounded-xl font-bold shadow-md" style={{ background: "linear-gradient(135deg,#0055bb 0%,#0099ff 100%)", color: "#fff", border: "none" }}>Back to Designs</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: "linear-gradient(180deg, rgba(135,206,235,0.95), rgba(173,216,230,0.9))", color: "#001a33" }}>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs mb-1" style={{ color: "#0066cc" }}>
              <button onClick={() => navigate("/designs")} className="hover:underline">Designs</button>
              <span>/</span>
              <span className="font-medium" style={{ color: "#001a33" }}>{design.name}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{design.name}</h1>
            <p className="text-sm mt-1" style={{ color: "#0066cc" }}>{new Date(design.created_at).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/studio", { state: { design } })} className="text-sm px-4 py-2 rounded-xl font-bold shadow-md transition-all hover:scale-[1.02]" style={{ background: "linear-gradient(135deg,#0055bb 0%,#0099ff 100%)", color: "#fff", border: "none" }}>Edit in Studio</button>
            <button onClick={() => setShowDelete(true)} className="text-sm px-3 py-2 rounded-xl font-medium" style={{ color: "#E11D48", border: "1px solid rgba(225,29,72,0.2)" }}>&#x2715;</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="rounded-xl border shadow-md overflow-hidden" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.4)", backdropFilter: "blur(10px)", minHeight: 400 }}>
              <div className="flex items-center justify-center min-h-[400px] p-4">
                {previewUrl ? (
                  <img src={previewUrl} alt={design.name} className="max-w-full max-h-[600px] rounded-lg object-contain" />
                ) : design.svg ? (
                  <div className="max-w-full" dangerouslySetInnerHTML={{ __html: design.svg }} />
                ) : (
                  <div className="text-center py-16 text-sm" style={{ color: "#004999" }}>No preview available</div>
                )}
              </div>
            </div>
            {design.prompt && (
              <div className="mt-4 rounded-xl border p-4 shadow-sm" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.4)", backdropFilter: "blur(10px)" }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#0066cc" }}>Prompt</h3>
                <p className="text-sm" style={{ color: "#001a33" }}>{design.prompt}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border p-5 shadow-sm" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.4)", backdropFilter: "blur(10px)" }}>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#0066cc" }}>Parameters</h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Color", value: design.color, color: true },
                  { label: "Pattern", value: design.pattern },
                  { label: "Fabric", value: design.texture },
                  { label: "Neckline", value: design.neckline },
                  { label: "Sleeve Length", value: design.sleeve_length },
                  { label: "Train Length", value: design.train_length },
                  { label: "Skirt Volume", value: design.skirt_volume },
                  { label: "Texture Intensity", value: design.texture_intensity },
                ].map((p) => (
                  <div key={p.label} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "#004999" }}>{p.label}</span>
                    <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: "#001a33" }}>
                      {p.color && <span className="w-3 h-3 rounded-full border border-white/50 inline-block" style={{ background: p.value }} />}
                      {p.value ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowDelete(false)}>
          <div className="rounded-xl border shadow-xl p-5 w-full max-w-sm mx-4" style={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(255,255,255,0.5)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold mb-2" style={{ color: "#001a33" }}>Delete design?</h3>
            <p className="text-xs mb-4" style={{ color: "#004999" }}>This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(false)} className="flex-1 text-xs px-3 py-2 rounded-lg font-medium" style={{ background: "rgba(255,255,255,0.5)", color: "#0066cc", border: "1px solid rgba(0,102,204,0.2)" }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 text-xs px-3 py-2 rounded-lg font-medium text-white" style={{ background: deleting ? "rgba(225,29,72,0.5)" : "#E11D48", border: "none" }}>{deleting ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
