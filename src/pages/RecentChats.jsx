import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { conversationsAPI } from "../utils/api.js";

export default function RecentChats() {
  const [chats, setChats] = useState([]);
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

  const openConversation = async (convId) => {
    try {
      const res = await conversationsAPI.get(convId);
      const conv = res;
      if (conv.messages?.length) {
        const lastAssistant = [...conv.messages].reverse().find((m) => m.sender_role === "assistant");
        const lastUser = [...conv.messages].reverse().find((m) => m.sender_role === "user");
        navigate("/studio", {
          state: {
            conversationId: conv.id,
            prompt: lastUser?.content || conv.title,
            imageUrl: lastAssistant?.image_url || null,
          },
        });
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  return (
    <div
      className="min-h-screen text-[#001a33]"
      style={{
        background:
          "linear-gradient(180deg, rgba(135,206,235,0.95), rgba(173,216,230,0.9))",
      }}
    >
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <h1
          className="text-3xl font-semibold font-['Playfair_Display']"
          style={{ color: "#001a33" }}
        >
          Recent Chats
        </h1>
        <p className="mt-2 text-sm" style={{ color: "#0066cc" }}>
          Your design history and saved generations
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {chats.length === 0 ? (
            <div
              className="col-span-full py-12 text-center rounded-lg"
              style={{
                background: "rgba(255,255,255,0.5)",
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              <p style={{ color: "#0066cc" }} className="font-medium">
                No recent chats yet
              </p>
              <p className="text-sm mt-1" style={{ color: "#004999" }}>
                Start creating designs in the Studio to see them here
              </p>
            </div>
          ) : (
            chats.map((c) => (
              <article
                key={c.id}
                className="rounded-xl border p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(255,255,255,0.5)",
                  backdropFilter: "blur(10px)",
                }}
                onClick={() => openConversation(c.id)}
              >
                <div className="text-xs font-medium" style={{ color: "#0066cc" }}>
                  {new Date(c.created_at).toLocaleDateString()} ·{" "}
                  {new Date(c.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="mt-2 font-semibold line-clamp-2" style={{ color: "#001a33" }}>
                  {c.title || "Design Session"}
                </div>
                <div className="mt-1 text-xs" style={{ color: "#004999" }}>
                  {c.message_count || 0} messages
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    className="text-xs px-3 py-1.5 rounded-md font-medium transition-all hover:opacity-90"
                    style={{
                      background: "linear-gradient(90deg,#0066cc 0%,#0099ff 100%)",
                      color: "#ffffff",
                      boxShadow: "0 4px 12px rgba(0,102,204,0.2)",
                    }}
                    onClick={(e) => { e.stopPropagation(); openConversation(c.id); }}
                  >
                    Open
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
