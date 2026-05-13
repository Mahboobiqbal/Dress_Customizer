import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { profilesAPI } from "../utils/api";
import toast from "react-hot-toast";

export default function Profile() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [accountData, setAccountData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    account_type: "individual",
  });

  const [bodyProfile, setBodyProfile] = useState({
    height: 100, width: 100, build: 0, head: 100,
    measurement_unit: "cm",
  });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profile = await profilesAPI.getCurrent();
      if (profile.account) {
        setAccountData({
          first_name: profile.account.first_name || "",
          last_name: profile.account.last_name || "",
          phone: profile.account.phone || "",
          account_type: profile.account.account_type || "individual",
        });
      }
      if (profile.body_profile) {
        setBodyProfile({
          height: profile.body_profile.height || 100,
          width: profile.body_profile.width || 100,
          build: profile.body_profile.build || 0,
          head: profile.body_profile.head || 100,
          measurement_unit: profile.body_profile.measurement_unit || "cm",
        });
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBodyChange = (e) => {
    const { name, value } = e.target;
    setBodyProfile((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await profilesAPI.updateCurrent({ ...accountData, body_profile: bodyProfile });
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleResetBody = async () => {
    try {
      await profilesAPI.bodyProfile.reset();
      setBodyProfile({ height: 100, width: 100, build: 0, head: 100, measurement_unit: "cm" });
      toast.success("Body profile reset to defaults");
    } catch (error) {
      toast.error(error.message || "Failed to reset body profile");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      await profilesAPI.deleteCurrent();
      toast.success("Account deleted");
      logout();
      window.location.href = "/";
    } catch (error) {
      toast.error(error.message || "Failed to delete account");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: "linear-gradient(180deg, rgba(135,206,235,0.95), rgba(173,216,230,0.9))" }}>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full" style={{ background: "linear-gradient(135deg,#0066cc 0%,#0099ff 100%)" }}>
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p style={{ color: "#0066cc" }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  const initials = `${accountData.first_name?.[0] || ""}${accountData.last_name?.[0] || ""}`.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";

  return (
    <div className="h-full overflow-y-auto" style={{ background: "linear-gradient(180deg, rgba(135,206,235,0.95), rgba(173,216,230,0.9))", color: "#001a33" }}>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center gap-5 mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg shrink-0" style={{ background: "linear-gradient(135deg,#0066cc,#0099ff)", color: "#fff" }}>
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{accountData.first_name || accountData.last_name ? `${accountData.first_name} ${accountData.last_name}` : "My Profile"}</h1>
            <p className="text-sm" style={{ color: "#0066cc" }}>{user?.email || ""}</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <div className="rounded-xl border p-5 shadow-md" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.4)", backdropFilter: "blur(10px)" }}>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#0066cc" }}>Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "First Name", name: "first_name", value: accountData.first_name, type: "text" },
                { label: "Last Name", name: "last_name", value: accountData.last_name, type: "text" },
                { label: "Email", value: user?.email || "", disabled: true },
                { label: "Phone", name: "phone", value: accountData.phone, type: "tel", placeholder: "+1234567890" },
              ].map((f) => (
                <div key={f.name || f.label}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#001a33" }}>{f.label}</label>
                  <input
                    type={f.type || "text"}
                    name={f.name}
                    value={f.value}
                    onChange={f.disabled ? undefined : handleAccountChange}
                    disabled={f.disabled}
                    placeholder={f.placeholder}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0099ff] transition-all"
                    style={{ border: "1px solid rgba(0,102,204,0.2)", background: f.disabled ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.7)", color: "#001a33", opacity: f.disabled ? 0.6 : 1 }}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#001a33" }}>Account Type</label>
                <select name="account_type" value={accountData.account_type} onChange={handleAccountChange} className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0099ff]" style={{ border: "1px solid rgba(0,102,204,0.2)", background: "rgba(255,255,255,0.7)", color: "#001a33" }}>
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                  <option value="student">Student</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-5 shadow-md" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.4)", backdropFilter: "blur(10px)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#0066cc" }}>Body Profile</h2>
              <button type="button" onClick={handleResetBody} className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:bg-white/50" style={{ color: "#0066cc", border: "1px solid rgba(0,102,204,0.2)" }}>Reset</button>
            </div>
            <p className="text-xs mb-4" style={{ color: "#004999" }}>Customize avatar proportions for accurate dress previews</p>

            <div className="mb-4">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#001a33" }}>Measurement Unit</label>
              <select value={bodyProfile.measurement_unit} onChange={(e) => setBodyProfile((p) => ({ ...p, measurement_unit: e.target.value }))} className="w-48 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0099ff]" style={{ border: "1px solid rgba(0,102,204,0.2)", background: "rgba(255,255,255,0.7)", color: "#001a33" }}>
                <option value="cm">Centimeters (cm)</option>
                <option value="inches">Inches (in)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { label: "Height", name: "height", min: 50, max: 150, value: bodyProfile.height, suffix: "%" },
                { label: "Width", name: "width", min: 50, max: 150, value: bodyProfile.width, suffix: "%" },
                { label: "Build", name: "build", min: -50, max: 50, value: bodyProfile.build },
                { label: "Head", name: "head", min: 50, max: 150, value: bodyProfile.head, suffix: "%" },
              ].map((s) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium" style={{ color: "#001a33" }}>{s.label}</label>
                    <span className="text-xs font-mono" style={{ color: "#0066cc" }}>{s.value}{s.suffix || ""}</span>
                  </div>
                  <input type="range" name={s.name} min={s.min} max={s.max} step="1" value={s.value} onChange={handleBodyChange} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer" style={{ background: "linear-gradient(90deg, rgba(0,102,204,0.3), rgba(0,153,255,0.3))", outline: "none" }} />
                  <input type="number" name={s.name} value={s.value} onChange={handleBodyChange} className="w-full mt-1.5 rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0099ff]" style={{ border: "1px solid rgba(0,102,204,0.2)", background: "rgba(255,255,255,0.7)", color: "#001a33" }} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button type="button" onClick={() => setShowDeleteConfirm(true)} className="text-xs px-4 py-2 rounded-lg font-medium transition-all hover:bg-red-50" style={{ color: "#E11D48", border: "1px solid rgba(225,29,72,0.2)" }}>
              Delete Account
            </button>
            <button type="submit" disabled={updating} className="text-sm px-6 py-2.5 rounded-xl font-bold shadow-md transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100" style={{ background: updating ? "rgba(0,102,204,0.5)" : "linear-gradient(135deg,#0055bb 0%,#0099ff 100%)", color: "#fff", border: "none" }}>
              {updating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}>
            <div className="rounded-xl border shadow-xl p-5 w-full max-w-sm mx-4" style={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(255,255,255,0.5)" }} onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-bold mb-2" style={{ color: "#001a33" }}>Delete Account?</h3>
              <p className="text-xs mb-4" style={{ color: "#004999" }}>This permanently deletes your account, designs, conversations, and body profiles. Cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 text-xs px-3 py-2 rounded-lg font-medium" style={{ background: "rgba(255,255,255,0.5)", color: "#0066cc", border: "1px solid rgba(0,102,204,0.2)" }}>Cancel</button>
                <button onClick={handleDeleteAccount} disabled={deleting} className="flex-1 text-xs px-3 py-2 rounded-lg font-medium text-white" style={{ background: deleting ? "rgba(225,29,72,0.5)" : "#E11D48", border: "none" }}>{deleting ? "Deleting..." : "Delete"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
