import { Link, useLocation } from "react-router-dom";

function SidebarItem({ icon, label, to, active = false }) {
  return (
    <Link
      to={to}
      className={
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors " +
        (active
          ? "bg-linear-to-r from-[#87ceeb] to-[#0099ff] text-[#001a33] border border-transparent"
          : "text-[#0066cc] hover:bg-linear-to-r hover:from-[#b3e0ff] hover:to-[#87ceeb] hover:text-[#001a33]")
      }
      style={{
        border: active ? "1px solid #0099ff" : "1px solid transparent",
      }}
    >
      <span className="shrink-0" style={{ color: active ? "#0099ff" : "#0066cc" }}>
        {icon}
      </span>
      <span className="truncate" style={{ color: active ? "#0099ff" : "#0066cc", letterSpacing: 1 }}>
        {label}
      </span>
    </Link>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const base = "/" + (location.pathname.split("/")[1] || "");

  const items = [
    { to: "/", icon: <HomeIcon className="w-4 h-4" />, label: "Home" },
    { to: "/studio", icon: "🎫", label: "Studio" },
    { to: "/recent-chats", icon: <ChatIcon className="w-4 h-4" />, label: "Recent Chats" },
    { to: "/designs", icon: <DesignIcon className="w-4 h-4" />, label: "My Designs" },
    { to: "/profile", icon: <UserIcon className="w-4 h-4" />, label: "Profile" },
    { to: "/settings", icon: <SettingsIcon className="w-4 h-4" />, label: "Settings" },
  ];

  return (
    <aside className="hidden lg:block">
      <nav
        className="sticky top-0 border h-full overflow-auto p-4 flex flex-col gap-3 shadow-sm"
        style={{
          border: "1px solid rgba(255,255,255,0.3)",
          background: "linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.2))",
          backdropFilter: "blur(10px)",
          color: "#001a33",
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          borderTopRightRadius: "0.75rem",
          borderBottomRightRadius: "0.75rem",
        }}
      >
        <div className="px-2 pb-1 text-xs font-medium uppercase tracking-wider text-[#0066cc]">
          Navigation
        </div>
        {items.map((item) => (
          <SidebarItem key={item.to} {...item} active={base === item.to} />
        ))}
      </nav>
    </aside>
  );
}

function SettingsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
      <path d="M3 12h2" /><path d="M19 12h2" />
      <path d="M12 3v2" /><path d="M12 19v2" />
      <path d="m5.6 5.6 1.4 1.4" /><path d="m17 17 1.4 1.4" />
      <path d="m5.6 18.4 1.4-1.4" /><path d="m17 7 1.4-1.4" />
    </svg>
  );
}

function ChatIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
    </svg>
  );
}

function DesignIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M3 7h18v11H3z" /><path d="M7 3v4" /><path d="M17 3v4" />
    </svg>
  );
}

function UserIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
