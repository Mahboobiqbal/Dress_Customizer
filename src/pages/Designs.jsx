import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { gownDesignsAPI } from "../utils/api.js";
import toast from "react-hot-toast";

export default function Designs() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchDesigns(); }, []);

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      const res = await gownDesignsAPI.getAll();
      setDesigns(res.designs || []);
    } catch (err) {
      console.error("Failed to load designs", err);
      setDesigns([]);
      toast.error("Unable to load designs");
    } finally {
      setLoading(false);
    }
  };

  const openDesign = (id) => navigate(`/designs/${id}`);
  const editDesign = (d) => navigate("/studio", { state: { design: d } });

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await gownDesignsAPI.delete(deleteId);
      setDesigns((s) => s.filter((x) => x.id !== deleteId));
      toast.success("Design deleted");
    } catch {
      toast.error("Delete failed");
    }
    setDeleteId(null);
  };

  const sortedDesigns = useMemo(() => {
    const filtered = designs.filter((d) =>
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.prompt?.toLowerCase().includes(search.toLowerCase())
    );
    const arr = [...filtered];
    if (sort === "newest") arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (sort === "oldest") arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    else if (sort === "name") arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [designs, sort, search]);

  return (
    <div className="h-full overflow-y-auto" style={{ background: "linear-gradient(180deg, rgba(135,206,235,0.95), rgba(173,216,230,0.9))", color: "#001a33" }}>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Designs</h1>
            <p className="text-sm mt-1" style={{ color: "#0066cc" }}>{designs.length} {designs.length === 1 ? "design" : "designs"} saved</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#0066cc" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search designs..." className="w-44 rounded-lg border pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#0099ff]" style={{ border: "1px solid rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.4)", color: "#001a33" }} />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#0099ff]" style={{ border: "1px solid rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.4)", color: "#001a33" }}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-pulse text-sm font-medium" style={{ color: "#004999" }}>Loading designs...</div>
          </div>
        ) : sortedDesigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4 opacity-20">&#x1F3F0;</div>
            <p className="text-lg font-medium" style={{ color: "#0066cc" }}>
              {search ? "No matching designs" : "No designs yet"}
            </p>
            <p className="text-sm mt-1 mb-6" style={{ color: "#004999" }}>
              {search ? "Try a different search term" : "Generate your first design in the Studio"}
            </p>
            {!search && (
              <button onClick={() => navigate("/studio")} className="text-sm px-5 py-2.5 rounded-xl font-bold shadow-md transition-all hover:scale-[1.02]" style={{ background: "linear-gradient(135deg,#0055bb 0%,#0099ff 100%)", color: "#fff", border: "none" }}>
                Go to Studio
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedDesigns.map((d) => (
              <div
                key={d.id}
                className="group rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5 overflow-hidden"
                style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.4)", backdropFilter: "blur(10px)" }}
                onClick={() => openDesign(d.id)}
              >
                <div className="h-36 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.3)" }}>
                  {d.image_url ? (
                    <img src={d.image_url} alt={d.name} className="w-full h-full object-contain p-2" />
                  ) : d.thumbnail ? (
                    <img src={`data:image/png;base64,${d.thumbnail}`} alt={d.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="text-4xl opacity-20">&#x1F457;</div>
                  )}
                </div>
                <div className="p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold truncate" style={{ color: "#001a33" }}>{d.name || "Untitled"}</h3>
                    <span className="text-[10px] shrink-0" style={{ color: "#0066cc" }}>{new Date(d.created_at).toLocaleDateString()}</span>
                  </div>
                  {d.prompt && <p className="text-[11px] mt-1 line-clamp-2" style={{ color: "#004999" }}>{d.prompt}</p>}
                  <div className="flex items-center gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); openDesign(d.id); }} className="text-[10px] px-2.5 py-1.5 rounded-md font-medium text-white" style={{ background: "linear-gradient(90deg,#0066cc,#0099ff)" }}>
                      Open
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); editDesign(d); }} className="text-[10px] px-2.5 py-1.5 rounded-md font-medium" style={{ color: "#0066cc", border: "1px solid rgba(0,102,204,0.2)" }}>
                      Edit
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(d.id); }} className="text-[10px] px-2 py-1.5 rounded-md font-medium ml-auto" style={{ color: "#E11D48", border: "1px solid rgba(225,29,72,0.2)" }}>
                      &#x2715;
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteId(null)}>
          <div className="rounded-xl border shadow-xl p-5 w-full max-w-sm mx-4" style={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(255,255,255,0.5)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold mb-2" style={{ color: "#001a33" }}>Delete design?</h3>
            <p className="text-xs mb-4" style={{ color: "#004999" }}>This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 text-xs px-3 py-2 rounded-lg font-medium" style={{ background: "rgba(255,255,255,0.5)", color: "#0066cc", border: "1px solid rgba(0,102,204,0.2)" }}>Cancel</button>
              <button onClick={confirmDelete} className="flex-1 text-xs px-3 py-2 rounded-lg font-medium text-white" style={{ background: "#E11D48", border: "none" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
