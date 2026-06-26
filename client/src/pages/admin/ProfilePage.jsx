import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AtSign,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Save,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function getInitials(name = "") {
  const words = String(name || "Admin")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "A";

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export default function ProfilePage() {
  const { admin, updateProfile } = useAuth();

  const [form, setForm] = useState({
    name: admin?.name || "",
    email: admin?.email || "",
    current_password: "",
    new_password: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      name: admin?.name || "",
      email: admin?.email || "",
    }));
  }, [admin]);

  const initials = useMemo(() => getInitials(admin?.name), [admin?.name]);

  const passwordStrength = useMemo(() => {
    const password = form.new_password || "";

    if (!password) return { label: "No password entered", value: 0 };

    let score = 0;

    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { label: "Weak password", value: 25 };
    if (score === 2) return { label: "Medium password", value: 55 };
    if (score === 3) return { label: "Good password", value: 80 };

    return { label: "Strong password", value: 100 };
  }, [form.new_password]);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFormErrors((current) => ({
      ...current,
      [field]: "",
    }));

    setMessage("");
    setMessageType("");
  }

  function validateForm() {
    const errors = {};
    const cleanName = String(form.name || "").trim();
    const cleanEmail = String(form.email || "").trim();
    const currentPassword = String(form.current_password || "");
    const newPassword = String(form.new_password || "");

    if (!cleanName) {
      errors.name = "Admin name is required.";
    }

    if (!cleanEmail) {
      errors.email = "Admin email is required.";
    } else if (!validateEmail(cleanEmail)) {
      errors.email = "Please enter a valid email address.";
    }

    if (newPassword && !currentPassword) {
      errors.current_password =
        "Current password is required when changing password.";
    }

    if (currentPassword && !newPassword) {
      errors.new_password = "Please enter a new password.";
    }

    if (newPassword && newPassword.length < 8) {
      errors.new_password = "New password must be at least 8 characters.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function save(event) {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    const isValid = validateForm();

    if (!isValid) {
      setMessage("Please correct the highlighted fields.");
      setMessageType("error");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        current_password: form.current_password,
        new_password: form.new_password,
      };

      const res = await updateProfile(payload);

      setMessage(res.message || "Profile updated successfully.");
      setMessageType("success");

      setForm((current) => ({
        ...current,
        current_password: "",
        new_password: "",
      }));

      setFormErrors({});
    } catch (error) {
      const backendErrors = error.response?.data?.errors || {};

      setFormErrors(backendErrors);

      setMessage(
        error.response?.data?.message ||
          "Could not update profile. Please try again.",
      );
      setMessageType("error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-pink-500/20 via-white/[0.05] to-violet-500/10 p-6 shadow-2xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-pink-100">
              <ShieldCheck size={16} />
              Account Settings
            </p>

            <h1 className="text-4xl font-black">Admin Profile</h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">
              Manage your admin name, email address, and password securely.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-3">
            <p className="text-xs font-black uppercase tracking-widest text-white/35">
              Current role
            </p>
            <p className="mt-1 font-black text-pink-200">
              {admin?.role || "Admin"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] shadow-2xl">
          <div className="h-28 bg-gradient-to-r from-pink-500/40 via-violet-500/30 to-blue-500/30" />

          <div className="-mt-12 p-6">
            <div className="mb-5 grid h-24 w-24 place-items-center rounded-[2rem] border-4 border-[#12091f] bg-gradient-to-br from-pink-500 to-violet-500 text-3xl font-black text-white shadow-xl">
              {initials}
            </div>

            <h2 className="text-3xl font-black">
              {admin?.name || "Admin User"}
            </h2>

            <p className="mt-2 flex items-center gap-2 text-white/55">
              <AtSign size={16} />
              {admin?.email || "No email"}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-pink-500/15 px-4 py-2 text-sm font-black text-pink-200">
                <ShieldCheck size={15} />
                {admin?.role || "Admin"}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full bg-green-500/15 px-4 py-2 text-sm font-black text-green-200">
                <CheckCircle2 size={15} />
                Active
              </span>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-bold text-white/70">
                Security reminder
              </p>

              <p className="mt-2 text-sm leading-6 text-white/45">
                Use a strong password and do not share your admin login details
                with others.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={save}
          
          className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-2xl"
        >
          <div className="mb-6 flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-pink-500/15 text-pink-200">
              <KeyRound size={24} />
            </div>

            <div>
              <h2 className="text-2xl font-black">Manage profile</h2>
              <p className="mt-1 text-sm leading-6 text-white/50">
                Update your profile details. Password fields are only required
                when changing password.
              </p>
            </div>
          </div>

          {message && (
            <div
              className={`mb-5 flex items-start gap-3 rounded-2xl border p-4 text-sm font-semibold ${
                messageType === "success"
                  ? "border-green-300/20 bg-green-500/10 text-green-200"
                  : "border-red-300/20 bg-red-500/10 text-red-200"
              }`}
            >
              {messageType === "success" ? (
                <CheckCircle2 size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span>{message}</span>
            </div>
          )}

          <div className="grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-white/70">
                Admin name
              </label>

              <div className="relative">
                <UserCircle
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                />

                <input
                  className={`input-field pl-11 ${
                    formErrors.name ? "border-red-400/70" : ""
                  }`}
                  placeholder="Admin name"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  required
                />
              </div>

              {formErrors.name && (
                <p className="mt-2 text-xs font-semibold text-red-300">
                  {formErrors.name}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-white/70">
                Admin email
              </label>

              <div className="relative">
                <AtSign
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                />

                <input
                  className={`input-field pl-11 ${
                    formErrors.email ? "border-red-400/70" : ""
                  }`}
                  placeholder="Admin email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                />
              </div>

              {formErrors.email && (
                <p className="mt-2 text-xs font-semibold text-red-300">
                  {formErrors.email}
                </p>
              )}
            </div>

            <div className="mt-2 rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 className="mb-4 text-lg font-black">Change password</h3>

              <div className="grid gap-5">
                <div>
                  <label className="mb-2 block text-sm font-bold text-white/70">
                    Current password
                  </label>

                  <div className="relative">
                    <KeyRound
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                    />

                    <input
                      className={`input-field pl-11 pr-12 ${
                        formErrors.current_password
                          ? "border-red-400/70"
                          : ""
                      }`}
                      placeholder="Required only when changing password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={form.current_password}
                      onChange={(e) =>
                        updateField("current_password", e.target.value)
                      }
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword((current) => !current)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  {formErrors.current_password && (
                    <p className="mt-2 text-xs font-semibold text-red-300">
                      {formErrors.current_password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-white/70">
                    New password
                  </label>

                  <div className="relative">
                    <KeyRound
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                    />

                    <input
                      className={`input-field pl-11 pr-12 ${
                        formErrors.new_password ? "border-red-400/70" : ""
                      }`}
                      placeholder="Enter new password"
                      type={showNewPassword ? "text" : "password"}
                      value={form.new_password}
                      onChange={(e) =>
                        updateField("new_password", e.target.value)
                      }
                    />

                    <button
                      type="button"
                      onClick={() => setShowNewPassword((current) => !current)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  {formErrors.new_password && (
                    <p className="mt-2 text-xs font-semibold text-red-300">
                      {formErrors.new_password}
                    </p>
                  )}

                  <div className="mt-3">
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500 transition-all"
                        style={{ width: `${passwordStrength.value}%` }}
                      />
                    </div>

                    <p className="mt-2 text-xs font-semibold text-white/45">
                      {passwordStrength.label}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              className="btn-primary justify-self-start"
              disabled={isSaving}
            >
              <Save size={18} />
              {isSaving ? "Saving profile..." : "Save profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}