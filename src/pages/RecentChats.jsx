import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { conversationsAPI } from "../utils/api.js";
import toast from "react-hot-toast";

function timeGroup(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const day = 86400000;
  if (diff < day) return "Today";
  if (diff < 2 * day) return "Yesterday";
  if (diff < 7 * day) return "This Week";
  if (diff < 30 * day) return "This Month";
  return "Older";
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const day = 86400000;
  if (diff < day) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff < 7 * day) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function RecentChats() {
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await conversationsAPI.list();
      setChats(response.conversations || []);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  };

  const openConversation = (convId) => {
    navigate(`/studio/${convId}`);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await conversationsAPI.delete(deleteId);
      setChats((prev) => prev.filter((c) => c.id !== deleteId));
      toast.success("Chat deleted");
    } catch {
      toast.error("Failed to delete");
    }
    setDeleteId(null);
  };

  const filtered = chats.filter(
    (c) => c.title?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = {};
  filtered.forEach((c) => {
    const g = timeGroup(c.created_at);
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(c);
  });
  const groupOrder = ["Today", "Yesterday", "This Week", "This Month", "Older"];

  return (
    <div
      className="h-full overflow-y-auto"
      style={{
        background: "linear-gradient(180deg, rgba(135,206,235,0.95), rgba(173,216,230,0.9))",
        color: "#001a33",
      }}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#001a33" }}>
              Recent Chats
            </h1>
            <p className="text-sm mt-1" style={{ color: "#0066cc" }}>
              {chats.length} {chats.length === 1 ? "conversation" : "conversations"}
            </p>
          </div>
          <button
            onClick={() => navigate("/studio")}
            className="text-sm px-4 py-2 rounded-xl font-bold shadow-md transition-all hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg,#0055bb 0%,#0099ff 100%)",
              color: "#ffffff",
              border: "none",
            }}
          >
            + New Chat
          </button>
        </div>

        <div className="relative mb-6">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#0066cc" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm backdrop-blur-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0099ff] transition-all"
            style={{
              border: "1px solid rgba(255,255,255,0.5)",
              background: "rgba(255,255,255,0.4)",
              color: "#001a33",
            }}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4 opacity-20">&#x1F4AC;</div>
            <p className="text-lg font-medium" style={{ color: "#0066cc" }}>
              {search ? "No matching conversations" : "No conversations yet"}
            </p>
            <p className="text-sm mt-1 mb-6" style={{ color: "#004999" }}>
              {search ? "Try a different search term" : "Start designing in Studio to create your first chat"}
            </p>
            {!search && (
              <button
                onClick={() => navigate("/studio")}
                className="text-sm px-5 py-2.5 rounded-xl font-bold shadow-md transition-all hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg,#0055bb 0%,#0099ff 100%)",
                  color: "#ffffff",
                  border: "none",
                }}
              >
                Start Designing
              </button>
            )}
          </div>
        ) : (
          groupOrder.map((group) => {
            const items = grouped[group];
            if (!items?.length) return null;
            return (
              <div key={group} className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#0066cc" }}>
                    {group}
                  </h2>
                  <div className="flex-1 h-px" style={{ background: "rgba(0,102,204,0.15)" }} />
                  <span className="text-[10px] font-medium" style={{ color: "#0066cc" }}>{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((c) => (
                    <div
                      key={c.id}
                      className="group rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                      style={{
                        background: "rgba(255,255,255,0.7)",
                        border: "1px solid rgba(255,255,255,0.4)",
                        backdropFilter: "blur(10px)",
                      }}
                      onClick={() => openConversation(c.id)}
                    >
                      <div className="flex items-center gap-4 p-4">
                        <div
                          className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-lg shadow-inner"
                          style={{ background: "rgba(255,255,255,0.5)" }}
                        >
                          &#x1F457;
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-sm truncate" style={{ color: "#001a33" }}>
                              {c.title || "Design Session"}
                            </h3>
                            <span className="text-[10px] shrink-0 font-medium" style={{ color: "#0066cc" }}>
                              {formatTime(c.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs" style={{ color: "#004999" }}>
                              {c.message_count || 0} {(c.message_count || 0) === 1 ? "message" : "messages"}
                            </span>
                            <span className="text-[10px]" style={{ color: "#0066cc" }}>
                              {new Date(c.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:scale-105"
                            style={{
                              background: "linear-gradient(90deg,#0066cc 0%,#0099ff 100%)",
                              color: "#ffffff",
                              boxShadow: "0 2px 8px rgba(0,102,204,0.2)",
                            }}
                            onClick={(e) => { e.stopPropagation(); openConversation(c.id); }}
                          >
                            Open
                          </button>
                          <button
                            className="text-xs px-2 py-1.5 rounded-lg font-medium transition-all hover:bg-red-50"
                            style={{ color: "#E11D48", border: "1px solid rgba(225,29,72,0.2)" }}
                            onClick={(e) => { e.stopPropagation(); setDeleteId(c.id); }}
                          >
                            &#x2715;
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteId(null)}>
          <div className="rounded-xl border shadow-xl p-5 w-full max-w-sm mx-4" style={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(255,255,255,0.5)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold mb-2" style={{ color: "#001a33" }}>Delete conversation?</h3>
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
