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

  // Account form state
  const [accountData, setAccountData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    account_type: "individual",
  });

  // Body profile form state
  const [bodyProfile, setBodyProfile] = useState({
    height: 100,
    width: 100,
    build: 0,
    head: 100,
    measurement_unit: "cm",
    gender: "",
    age: "",
    weight: "",
    chest: "",
    waist: "",
    hips: "",
    shoulder_width: "",
    arm_length: "",
    inseam: "",
    thigh: "",
    neck: "",
    calf: "",
    wrist: "",
    patterns: [],
    necklines: [],
    sleeves: [],
    top_styles: [],
    fabric_textures: [],
    fabric_types: {},
  });

  // Fetch profile on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

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
          gender: profile.body_profile.gender || "",
          age: profile.body_profile.age || "",
          weight: profile.body_profile.weight || "",
          chest: profile.body_profile.chest || "",
          waist: profile.body_profile.waist || "",
          hips: profile.body_profile.hips || "",
          shoulder_width: profile.body_profile.shoulder_width || "",
          arm_length: profile.body_profile.arm_length || "",
          inseam: profile.body_profile.inseam || "",
          thigh: profile.body_profile.thigh || "",
          neck: profile.body_profile.neck || "",
          calf: profile.body_profile.calf || "",
          wrist: profile.body_profile.wrist || "",
          patterns: profile.body_profile.patterns || [],
          necklines: profile.body_profile.necklines || [],
          sleeves: profile.body_profile.sleeves || [],
          top_styles: profile.body_profile.top_styles || [],
          fabric_textures: profile.body_profile.fabric_textures || [],
          fabric_types: profile.body_profile.fabric_types || {},
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
    setAccountData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBodyChange = (e) => {
    const { name, value } = e.target;
    setBodyProfile((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await profilesAPI.updateCurrent({
        ...accountData,
        body_profile: bodyProfile,
      });
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
      setBodyProfile({
        height: 100,
        width: 100,
        build: 0,
        head: 100,
        measurement_unit: "cm",
      });
      toast.success("Body profile reset to defaults");
    } catch (error) {
      toast.error(error.message || "Failed to reset body profile");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      await profilesAPI.deleteCurrent();
      toast.success("Account deleted successfully");
      logout();
      // Redirect to landing page
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
      <div
        style={{
          background:
            "linear-gradient(180deg, #87CEEB 0%, #87CEEB 30%, #ADD8E6 70%, #E0F6FF 100%)",
          minHeight: "100vh",
        }}
      >
        {/* Header removed: now globally rendered in ProtectedRoute */}
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div
              className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full"
              style={{
                background: "linear-gradient(135deg,#0066cc 0%,#0099ff 100%)",
              }}
            >
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
            <p style={{ color: "#0066cc" }}>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, #87CEEB 0%, #87CEEB 30%, #ADD8E6 70%, #E0F6FF 100%)",
        minHeight: "100vh",
        color: "#001a33",
      }}
    >
      {/* Header removed: now globally rendered in ProtectedRoute */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Profile</h1>
          <p style={{ color: "#0066cc" }}>
            Manage your account and body measurements
          </p>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleUpdateProfile} className="space-y-8">
          {/* Account Information Section */}
          <div
            className="rounded-xl p-8"
            style={{
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(255,255,255,0.6)",
              boxShadow: "0 4px 20px rgba(0,102,204,0.1)",
            }}
          >
            <h2
              className="text-2xl font-semibold mb-6"
              style={{ color: "#001a33" }}
            >
              Account Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* First Name */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#001a33" }}
                >
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={accountData.first_name}
                  onChange={handleAccountChange}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "rgba(0,102,204,0.3)",
                    background: "rgba(255,255,255,0.9)",
                    color: "#001a33",
                  }}
                />
              </div>

              {/* Last Name */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#001a33" }}
                >
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={accountData.last_name}
                  onChange={handleAccountChange}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "rgba(0,102,204,0.3)",
                    background: "rgba(255,255,255,0.9)",
                    color: "#001a33",
                  }}
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#001a33" }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-4 py-2 rounded-lg border opacity-60"
                  style={{
                    borderColor: "rgba(0,102,204,0.3)",
                    background: "rgba(255,255,255,0.5)",
                    color: "#001a33",
                  }}
                />
              </div>

              {/* Phone */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#001a33" }}
                >
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={accountData.phone}
                  onChange={handleAccountChange}
                  placeholder="+1234567890"
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "rgba(0,102,204,0.3)",
                    background: "rgba(255,255,255,0.9)",
                    color: "#001a33",
                  }}
                />
              </div>
            </div>

            {/* Account Type */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#001a33" }}
              >
                Account Type
              </label>
              <select
                name="account_type"
                value={accountData.account_type}
                onChange={handleAccountChange}
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  borderColor: "rgba(0,102,204,0.3)",
                  background: "rgba(255,255,255,0.9)",
                  color: "#001a33",
                }}
              >
                <option value="individual">Individual</option>
                <option value="business">Business</option>
                <option value="student">Student</option>
              </select>
            </div>
          </div>

          {/* Personal Information Section */}
          <div
            className="rounded-xl p-8"
            style={{
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(255,255,255,0.6)",
              boxShadow: "0 4px 20px rgba(0,102,204,0.1)",
            }}
          >
            <h2
              className="text-2xl font-semibold mb-6"
              style={{ color: "#001a33" }}
            >
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Gender */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#001a33" }}
                >
                  Gender
                </label>
                <select
                  name="gender"
                  value={bodyProfile.gender}
                  onChange={(e) =>
                    setBodyProfile((prev) => ({
                      ...prev,
                      gender: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "rgba(0,102,204,0.3)",
                    background: "rgba(255,255,255,0.9)",
                    color: "#001a33",
                  }}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Age */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#001a33" }}
                >
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  value={bodyProfile.age}
                  onChange={(e) =>
                    setBodyProfile((prev) => ({
                      ...prev,
                      age: e.target.value,
                    }))
                  }
                  placeholder="Enter age"
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "rgba(0,102,204,0.3)",
                    background: "rgba(255,255,255,0.9)",
                    color: "#001a33",
                  }}
                />
              </div>

              {/* Weight */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#001a33" }}
                >
                  Weight ({bodyProfile.measurement_unit === "cm" ? "kg" : "lbs"}
                  )
                </label>
                <input
                  type="number"
                  name="weight"
                  value={bodyProfile.weight}
                  onChange={(e) =>
                    setBodyProfile((prev) => ({
                      ...prev,
                      weight: e.target.value,
                    }))
                  }
                  placeholder={`Enter weight in ${
                    bodyProfile.measurement_unit === "cm" ? "kg" : "lbs"
                  }`}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "rgba(0,102,204,0.3)",
                    background: "rgba(255,255,255,0.9)",
                    color: "#001a33",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Body Measurements Section */}
          <div
            className="rounded-xl p-8"
            style={{
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(255,255,255,0.6)",
              boxShadow: "0 4px 20px rgba(0,102,204,0.1)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-2xl font-semibold"
                style={{ color: "#001a33" }}
              >
                Body Measurements
              </h2>
              <button
                type="button"
                onClick={handleResetBody}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: "rgba(255,255,255,0.8)",
                  border: "1px solid rgba(0,102,204,0.3)",
                  color: "#0066cc",
                }}
              >
                Reset to Defaults
              </button>
            </div>

            <p className="text-sm mb-6" style={{ color: "#0066cc" }}>
              Enter your body measurements for accurate dress previews
            </p>

            {/* Measurement Unit Selector */}
            <div className="mb-6">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#001a33" }}
              >
                Measurement Unit
              </label>
              <select
                value={bodyProfile.measurement_unit}
                onChange={(e) =>
                  setBodyProfile((prev) => ({
                    ...prev,
                    measurement_unit: e.target.value,
                  }))
                }
                className="w-full md:w-64 px-4 py-2 rounded-lg border"
                style={{
                  borderColor: "rgba(0,102,204,0.3)",
                  background: "rgba(255,255,255,0.9)",
                  color: "#001a33",
                }}
              >
                <option value="cm">Centimeters (cm)</option>
                <option value="inches">Inches (in)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Chest */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#001a33" }}
                >
                  Chest ({bodyProfile.measurement_unit})
                </label>
                <input
                  type="number"
                  name="chest"
                  value={bodyProfile.chest}
                  onChange={(e) =>
                    setBodyProfile((prev) => ({
                      ...prev,
                      chest: e.target.value,
                    }))
                  }
                  placeholder={`Chest in ${bodyProfile.measurement_unit}`}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "rgba(0,102,204,0.3)",
                    background: "rgba(255,255,255,0.9)",
                    color: "#001a33",
                  }}
                />
              </div>

              {/* Waist */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#001a33" }}
                >
                  Waist ({bodyProfile.measurement_unit})
                </label>
                <input
                  type="number"
                  name="waist"
                  value={bodyProfile.waist}
                  onChange={(e) =>
                    setBodyProfile((prev) => ({
                      ...prev,
                      waist: e.target.value,
                    }))
                  }
                  placeholder={`Waist in ${bodyProfile.measurement_unit}`}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "rgba(0,102,204,0.3)",
                    background: "rgba(255,255,255,0.9)",
                    color: "#001a33",
                  }}
                />
              </div>

              {/* Hips */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#001a33" }}
                >
                  Hips ({bodyProfile.measurement_unit})
                </label>
                <input
                  type="number"
                  name="hips"
                  value={bodyProfile.hips}
                  onChange={(e) =>
                    setBodyProfile((prev) => ({
                      ...prev,
                      hips: e.target.value,
                    }))
                  }
                  placeholder={`Hips in ${bodyProfile.measurement_unit}`}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "rgba(0,102,204,0.3)",
                    background: "rgba(255,255,255,0.9)",
                    color: "#001a33",
                  }}
                />
              </div>

              {/* Shoulder Width */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#001a33" }}
                >
                  Shoulder Width ({bodyProfile.measurement_unit})
                </label>
                <input
                  type="number"
                  name="shoulder_width"
                  value={bodyProfile.shoulder_width}
                  onChange={(e) =>
                    setBodyProfile((prev) => ({
                      ...prev,
                      shoulder_width: e.target.value,
                    }))
                  }
                  placeholder={`Shoulder width in ${bodyProfile.measurement_unit}`}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "rgba(0,102,204,0.3)",
                    background: "rgba(255,255,255,0.9)",
                    color: "#001a33",
                  }}
                />
              </div>

              {/* Arm Length */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#001a33" }}
                >
                  Arm Length ({bodyProfile.measurement_unit})
                </label>
                <input
                  type="number"
                  name="arm_length"
                  value={bodyProfile.arm_length}
                  onChange={(e) =>
                    setBodyProfile((prev) => ({
                      ...prev,
                      arm_length: e.target.value,
                    }))
                  }
                  placeholder={`Arm length in ${bodyProfile.measurement_unit}`}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "rgba(0,102,204,0.3)",
                    background: "rgba(255,255,255,0.9)",
                    color: "#001a33",
                  }}
                />
              </div>

              {/* Inseam */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#001a33" }}
                >
                  Inseam ({bodyProfile.measurement_unit})
                </label>
                <input
                  type="number"
                  name="inseam"
                  value={bodyProfile.inseam}
                  onChange={(e) =>
                    setBodyProfile((prev) => ({
                      ...prev,
                      inseam: e.target.value,
                    }))
                  }
                  placeholder={`Inseam in ${bodyProfile.measurement_unit}`}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "rgba(0,102,204,0.3)",
                    background: "rgba(255,255,255,0.9)",
                    color: "#001a33",
                  }}
                />
              </div>

              {/* Thigh */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#001a33" }}
                >
                  Thigh ({bodyProfile.measurement_unit})
                </label>
                <input
                  type="number"
                  name="thigh"
                  value={bodyProfile.thigh}
                  onChange={(e) =>
                    setBodyProfile((prev) => ({
                      ...prev,
                      thigh: e.target.value,
                    }))
                  }
                  placeholder={`Thigh in ${bodyProfile.measurement_unit}`}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "rgba(0,102,204,0.3)",
                    background: "rgba(255,255,255,0.9)",
                    color: "#001a33",
                  }}
                />
              </div>

              {/* Neck */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#001a33" }}
                >
                  Neck ({bodyProfile.measurement_unit})
                </label>
                <input
                  type="number"
                  name="neck"
                  value={bodyProfile.neck}
                  onChange={(e) =>
                    setBodyProfile((prev) => ({
                      ...prev,
                      neck: e.target.value,
                    }))
                  }
                  placeholder={`Neck in ${bodyProfile.measurement_unit}`}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "rgba(0,102,204,0.3)",
                    background: "rgba(255,255,255,0.9)",
                    color: "#001a33",
                  }}
                />
              </div>

              {/* Calf */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#001a33" }}
                >
                  Calf ({bodyProfile.measurement_unit})
                </label>
                <input
                  type="number"
                  name="calf"
                  value={bodyProfile.calf}
                  onChange={(e) =>
                    setBodyProfile((prev) => ({
                      ...prev,
                      calf: e.target.value,
                    }))
                  }
                  placeholder={`Calf in ${bodyProfile.measurement_unit}`}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "rgba(0,102,204,0.3)",
                    background: "rgba(255,255,255,0.9)",
                    color: "#001a33",
                  }}
                />
              </div>

              {/* Wrist */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#001a33" }}
                >
                  Wrist ({bodyProfile.measurement_unit})
                </label>
                <input
                  type="number"
                  name="wrist"
                  value={bodyProfile.wrist}
                  onChange={(e) =>
                    setBodyProfile((prev) => ({
                      ...prev,
                      wrist: e.target.value,
                    }))
                  }
                  placeholder={`Wrist in ${bodyProfile.measurement_unit}`}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "rgba(0,102,204,0.3)",
                    background: "rgba(255,255,255,0.9)",
                    color: "#001a33",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Avatar Proportions Section */}
          <div
            className="rounded-xl p-8"
            style={{
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(255,255,255,0.6)",
              boxShadow: "0 4px 20px rgba(0,102,204,0.1)",
            }}
          >
            <h2
              className="text-2xl font-semibold mb-6"
              style={{ color: "#001a33" }}
            >
              Avatar Proportions
            </h2>

            <p className="text-sm mb-6" style={{ color: "#0066cc" }}>
              Customize your avatar's body proportions for accurate dress
              previews
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Height */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#001a33" }}
                >
                  Height: {bodyProfile.height}%
                </label>
                <input
                  type="range"
                  name="height"
                  min="50"
                  max="150"
                  step="1"
                  value={bodyProfile.height}
                  onChange={handleBodyChange}
                  className="w-full"
                />
                <input
                  type="number"
                  name="height"
                  value={bodyProfile.height}
                  onChange={handleBodyChange}
                  className="w-full mt-2 px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "rgba(0,102,204,0.3)",
                    background: "rgba(255,255,255,0.9)",
                    color: "#001a33",
                  }}
                />
              </div>

              {/* Width */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#001a33" }}
                >
                  Width: {bodyProfile.width}%
                </label>
                <input
                  type="range"
                  name="width"
                  min="50"
                  max="150"
                  step="1"
                  value={bodyProfile.width}
                  onChange={handleBodyChange}
                  className="w-full"
                />
                <input
                  type="number"
                  name="width"
                  value={bodyProfile.width}
                  onChange={handleBodyChange}
                  className="w-full mt-2 px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "rgba(0,102,204,0.3)",
                    background: "rgba(255,255,255,0.9)",
                    color: "#001a33",
                  }}
                />
              </div>

              {/* Build */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#001a33" }}
                >
                  Build: {bodyProfile.build}
                </label>
                <input
                  type="range"
                  name="build"
                  min="-50"
                  max="50"
                  step="1"
                  value={bodyProfile.build}
                  onChange={handleBodyChange}
                  className="w-full"
                />
                <input
                  type="number"
                  name="build"
                  value={bodyProfile.build}
                  onChange={handleBodyChange}
                  className="w-full mt-2 px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "rgba(0,102,204,0.3)",
                    background: "rgba(255,255,255,0.9)",
                    color: "#001a33",
                  }}
                />
              </div>

              {/* Head */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#001a33" }}
                >
                  Head: {bodyProfile.head}%
                </label>
                <input
                  type="range"
                  name="head"
                  min="50"
                  max="150"
                  step="1"
                  value={bodyProfile.head}
                  onChange={handleBodyChange}
                  className="w-full"
                />
                <input
                  type="number"
                  name="head"
                  value={bodyProfile.head}
                  onChange={handleBodyChange}
                  className="w-full mt-2 px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: "rgba(0,102,204,0.3)",
                    background: "rgba(255,255,255,0.9)",
                    color: "#001a33",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-6 py-2 rounded-lg font-medium"
              style={{
                background: "rgba(255,0,0,0.1)",
                color: "#dc2626",
                border: "1px solid rgba(255,0,0,0.3)",
              }}
            >
              Delete Account
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-6 py-2 rounded-lg font-medium text-white"
              style={{
                background: updating
                  ? "rgba(0,102,204,0.5)"
                  : "linear-gradient(90deg,#0066cc 0%,#0099ff 100%)",
                boxShadow: "0 4px 12px rgba(0,102,204,0.2)",
              }}
            >
              {updating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div
              className="bg-white rounded-xl p-8 max-w-sm"
              style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}
            >
              <h3
                className="text-xl font-bold mb-4"
                style={{ color: "#001a33" }}
              >
                Delete Account?
              </h3>
              <p className="text-sm mb-6" style={{ color: "#0066cc" }}>
                This action will permanently delete your account and all
                associated data including designs, conversations, and body
                profiles. This cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 rounded-lg font-medium"
                  style={{
                    background: "rgba(0,102,204,0.1)",
                    color: "#0066cc",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-white"
                  style={{
                    background: deleting ? "rgba(220,38,38,0.5)" : "#dc2626",
                  }}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
