import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Camera, LockKeyhole, Save } from "lucide-react";
import api from "../lib/api.js";

export default function AdminUpdatePassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";

  const [form, setForm] = useState({
    password: "",
    confirm_password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitUpdatePassword(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!token) {
      setError("Password reset token is missing.");
      return;
    }

    if (!form.password.trim()) {
      setError("New password is required.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/reset-password", {
        token,
        password: form.password,
      });

      setMessage(res.data?.message || "Password updated successfully.");

      setTimeout(() => {
        navigate("/admin/login");
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#05050a] p-4 text-white">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-pink-500/25 blur-[110px]" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-violet-500/25 blur-[110px]" />

      <form
        onSubmit={submitUpdatePassword}
        noValidate
        autoComplete="off"
        className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl sm:p-8"
      >
        <Link
          to="/admin/login"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-white/55 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to login
        </Link>

        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-600 shadow-glow">
            <Camera size={28} />
          </span>

          <h1 className="text-3xl font-black">Update Password</h1>

          <p className="mt-2 text-sm leading-6 text-white/50">
            Create a new secure password for your admin account.
          </p>
        </div>

        <div className="grid gap-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/65">
              New Password
            </span>

            <div className="relative">
              <LockKeyhole
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-pink-300"
              />
              <input
                className="input-field w-full !pl-12 pr-4"
                type="password"
                placeholder="Enter new password"
                name="new_admin_password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/65">
              Confirm Password
            </span>

            <div className="relative">
              <LockKeyhole
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-pink-300"
              />
              <input
                className="input-field w-full !pl-12 pr-4"
                type="password"
                placeholder="Confirm new password"
                name="confirm_admin_password"
                autoComplete="new-password"
                value={form.confirm_password}
                onChange={(e) =>
                  setForm({ ...form, confirm_password: e.target.value })
                }
              />
            </div>
          </label>

          {message && (
            <p className="rounded-2xl border border-green-400/20 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-100">
              {message}
            </p>
          )}

          {error && (
            <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">
              {error}
            </p>
          )}

          <button
            className="btn-primary mt-2 inline-flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            <Save size={17} />
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
