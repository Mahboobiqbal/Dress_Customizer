import { useEffect, useState } from "react";
import { gownDesignsAPI } from "../utils/api.js";

const fallbackChats = [
  {
    id: "1",
    name: "Emerald velvet with off-shoulder",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    measurements: "Height: 170cm, Bust: 90cm, Waist: 70cm, Hips: 95cm",
    customizations:
      "Color: Emerald, Pattern: Velvet, Neckline: Off-shoulder, Sleeve: Sleeveless",
    prompt: "Create an elegant emerald velvet dress with off-shoulder neckline",
  },
  {
    id: "2",
    name: "Blush lace A-line with train",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    measurements: "Height: 165cm, Bust: 85cm, Waist: 65cm, Hips: 90cm",
    customizations: "Color: Blush, Pattern: Lace, Style: A-line, Train: Yes",
    prompt: "Design a romantic blush lace A-line gown with elegant train",
  },
  {
    id: "3",
    name: "Minimal silk slip dress",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    measurements: "Height: 175cm, Bust: 88cm, Waist: 68cm, Hips: 92cm",
    customizations: "Color: Nude, Fabric: Silk, Style: Slip, Neckline: V-neck",
    prompt: "Simple minimal silk slip dress for modern elegance",
  },
];

export default function RecentChats() {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await gownDesignsAPI.getAll();
      const designs = response.designs || [];

      if (designs.length > 0) {
        setChats(designs);
      } else {
        setChats(fallbackChats);
      }
    } catch (error) {
      console.error("Failed to fetch designs:", error);
      // Fallback to demo data if not authenticated or API fails
      setChats(fallbackChats);
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
                className="rounded-xl border p-4 shadow-md hover:shadow-lg transition-shadow"
                style={{
                  background: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(255,255,255,0.5)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div
                  className="text-xs font-medium"
                  style={{ color: "#0066cc" }}
                >
                  {new Date(c.created_at).toLocaleDateString()} ·{" "}
                  {new Date(c.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div
                  className="mt-2 font-semibold line-clamp-2"
                  style={{ color: "#001a33" }}
                >
                  {c.name}
                </div>
                {c.measurements && (
                  <div className="mt-2 text-xs" style={{ color: "#004999" }}>
                    <strong>Measurements:</strong> {c.measurements}
                  </div>
                )}
                {c.customizations && (
                  <div className="mt-1 text-xs" style={{ color: "#004999" }}>
                    <strong>Customizations:</strong> {c.customizations}
                  </div>
                )}
                {c.prompt && (
                  <div
                    className="mt-1 text-xs italic"
                    style={{ color: "#0066cc" }}
                  >
                    "{c.prompt}"
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    className="text-xs px-3 py-1.5 rounded-md font-medium transition-all hover:opacity-90"
                    style={{
                      background:
                        "linear-gradient(90deg,#0066cc 0%,#0099ff 100%)",
                      color: "#ffffff",
                      boxShadow: "0 4px 12px rgba(0,102,204,0.2)",
                    }}
                  >
                    Open
                  </button>
                  <button
                    className="text-xs px-3 py-1.5 rounded-md font-medium transition-all hover:opacity-90"
                    style={{
                      background: "rgba(255,255,255,0.5)",
                      border: "1px solid rgba(255,255,255,0.6)",
                      color: "#001a33",
                    }}
                  >
                    Duplicate
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
