import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { conversationsAPI } from "../utils/api.js";
import toast from "react-hot-toast";

function SidebarItem({ icon, label, to, active = false, collapsed }) {
  return (
    <Link
      to={to}
      title={label}
      className={
        "flex items-center gap-2.5 rounded-lg transition-all " +
        (collapsed ? "w-8 h-8 justify-center" : "w-full px-2.5 py-1.5") +
        (active
          ? " bg-[#0066cc] text-white shadow-sm"
          : " text-[#94a3b8] hover:bg-gray-100 hover:text-[#0066cc]")
      }
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="text-[11px] font-medium truncate">{label}</span>}
    </Link>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const base = "/" + (location.pathname.split("/")[1] || "");

  const initials = user
    ? `${(user.first_name?.[0] || "").toUpperCase()}${(user.last_name?.[0] || "").toUpperCase()}`
    : user?.email?.[0]?.toUpperCase() || "?";

  useEffect(() => {
    conversationsAPI.list()
      .then((res) => setRecentChats((res.conversations || []).slice(0, 8)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!menuOpenId) return;
    const close = () => setMenuOpenId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpenId]);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    localStorage.removeItem("user-name");
    navigate("/");
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await conversationsAPI.delete(deleteId);
      setRecentChats((prev) => prev.filter((c) => c.id !== deleteId));
      toast.success("Chat deleted");
    } catch {
      toast.error("Failed to delete");
    }
    setDeleteId(null);
    setMenuOpenId(null);
  };

  const navItems = [
    { to: "/studio", icon: <SparkIcon className="w-4 h-4" />, label: "Studio" },
    { to: "/recent-chats", icon: <ChatIcon className="w-4 h-4" />, label: "Chats" },
    { to: "/styles", icon: <DesignIcon className="w-4 h-4" />, label: "Styles" },
    { to: "/settings", icon: <SettingsIcon className="w-4 h-4" />, label: "Settings" },
  ];

  return (
    <aside
      className="hidden lg:flex flex-col shrink-0 transition-all duration-200"
      style={{
        width: collapsed ? "52px" : "160px",
        background: "#ffffff",
        borderRight: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      {/* Top: Profile + Toggle */}
      <div className={`flex items-center shrink-0 gap-2 ${collapsed ? "flex-col py-3" : "px-3 py-3"}`}>
        <Link to="/profile" title="Profile" className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all hover:ring-2 hover:ring-[#0066cc]/20" style={{ background: "linear-gradient(135deg, #0066cc, #0099ff)", color: "#fff" }}>
          {initials}
        </Link>
        {!collapsed && (
          <span className="text-[11px] font-semibold truncate flex-1" style={{ color: "#001a33" }}>
            {user?.first_name || user?.email?.split("@")[0] || "User"}
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand" : "Collapse"}
          className="w-6 h-6 rounded flex items-center justify-center transition-all shrink-0 hover:bg-gray-100"
          style={{ color: "#cbd5e1" }}
        >
          {collapsed ? <ChevronRightIcon className="w-3.5 h-3.5" /> : <ChevronLeftIcon className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Nav */}
      <div className={`flex flex-col gap-0.5 py-1 ${collapsed ? "items-center px-0" : "px-2"}`}>
        {navItems.map((item) => (
          <SidebarItem key={item.to} {...item} active={base === item.to} collapsed={collapsed} />
        ))}
      </div>

      {/* Recent Chats */}
      {!collapsed && recentChats.length > 0 && (
        <>
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }} className="mx-3" />
          <div className="flex-1 min-h-0 overflow-y-auto py-2 px-2">
            <p className="text-[9px] font-bold uppercase tracking-wider px-2.5 mb-1.5" style={{ color: "#cbd5e1" }}>
              Recent
            </p>
            <div className="space-y-0.5">
              {recentChats.map((c) => (
                <div key={c.id} className="relative">
                  <button
                    onClick={() => navigate(`/studio/${c.id}`)}
                    className="w-full flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-left transition-colors hover:bg-gray-50 group pr-6"
                  >
                    <span className="text-[10px] truncate flex-1" style={{ color: "#64748b" }}>
                      {c.title || "Design Session"}
                    </span>
                  </button>
                  {/* 3-dot menu */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === c.id ? null : c.id); }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200"
                    style={{ color: "#94a3b8", zIndex: 10 }}
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
                    </svg>
                  </button>
                  {/* Dropdown */}
                  {menuOpenId === c.id && (
                    <div
                      className="absolute right-0 top-full mt-0.5 rounded-lg border shadow-lg z-30 overflow-hidden"
                      style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", minWidth: "100px" }}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteId(c.id); setMenuOpenId(null); }}
                        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium transition-colors hover:bg-red-50"
                        style={{ color: "#E11D48" }}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Bottom: Home + Logout */}
      <div className={`flex flex-col gap-0.5 py-2 ${collapsed ? "items-center px-0" : "px-2"}`}>
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }} className={`mb-1 ${collapsed ? "w-5" : "w-full"}`} />
        <Link
          to="/"
          title="Home"
          className={
            "flex items-center gap-2.5 rounded-lg transition-all " +
            (collapsed ? "w-8 h-8 justify-center" : "w-full px-2.5 py-1.5") +
            " text-[#94a3b8] hover:bg-gray-100 hover:text-[#0066cc]"
          }
        >
          <HomeIcon className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-[11px] font-medium">Home</span>}
        </Link>
        <button
          onClick={handleLogout}
          title="Logout"
          className={
            "flex items-center gap-2.5 rounded-lg transition-all " +
            (collapsed ? "w-8 h-8 justify-center" : "w-full px-2.5 py-1.5") +
            " text-[#94a3b8] hover:bg-red-50 hover:text-red-500"
          }
        >
          <LogoutIcon className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-[11px] font-medium">Logout</span>}
        </button>
      </div>

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setDeleteId(null)}>
          <div className="rounded-xl shadow-2xl p-4 w-64 mx-4" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }} onClick={(e) => e.stopPropagation()}>
            <p className="text-xs font-semibold mb-1" style={{ color: "#001a33" }}>Delete this chat?</p>
            <p className="text-[10px] mb-3" style={{ color: "#94a3b8" }}>This cannot be undone.</p>
            <div className="flex gap-1.5">
              <button onClick={() => setDeleteId(null)} className="flex-1 text-[10px] px-2 py-1.5 rounded-lg font-medium hover:bg-gray-50 transition-colors" style={{ color: "#64748b", border: "1px solid rgba(0,0,0,0.08)" }}>Cancel</button>
              <button onClick={confirmDelete} className="flex-1 text-[10px] px-2 py-1.5 rounded-lg font-medium text-white transition-all" style={{ background: "#E11D48" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function SparkIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

function SettingsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ChatIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

function DesignIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}

function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function LogoutIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function ChevronLeftIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
