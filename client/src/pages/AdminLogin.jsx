import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!form.password.trim()) {
      setError("Password is required.");
      return;
    }

    setLoading(true);

    try {
      await login(form.email.trim().toLowerCase(), form.password);
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-screen overflow-hidden bg-[#05050a] p-4 text-white lg:grid-cols-2">
      <style>
        {`
          @keyframes floatGlow {
            0%, 100% {
              transform: translateY(0px) scale(1);
            }
            50% {
              transform: translateY(-22px) scale(1.04);
            }
          }

          @keyframes rotateBorder {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }

          .login-glow-one {
            animation: floatGlow 7s ease-in-out infinite;
          }

          .login-glow-two {
            animation: floatGlow 9s ease-in-out infinite;
          }

          .login-border-light {
            animation: rotateBorder 5s linear infinite;
          }
        `}
      </style>

      {/* Background */}
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-pink-500/25 blur-[110px] login-glow-one" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-violet-500/25 blur-[110px] login-glow-two" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(236,72,153,.16),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,.16),transparent_35%)]" />

      {/* Left Branding */}
      <div className="relative z-10 hidden items-center justify-center p-8 lg:flex">
        <div className="max-w-xl">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-pink-400/20 bg-pink-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-pink-200">
            <Sparkles size={14} />
            ADRA Admin Panel
          </span>

          <h1 className="text-5xl font-black leading-tight xl:text-6xl">
            Manage your photography shop with confidence.
          </h1>

          <p className="mt-6 max-w-lg text-base leading-8 text-white/55">
            Secure dashboard for managing services, products, events, reviews,
            bookings, contacts, gallery, uploads, and website content.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
              <ShieldCheck className="mb-3 text-pink-300" />
              <h3 className="font-bold">Secure Access</h3>
              <p className="mt-1 text-sm leading-6 text-white/45">
                Admin-only login with protected dashboard routes.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
              <Camera className="mb-3 text-pink-300" />
              <h3 className="font-bold">ADRA Control</h3>
              <p className="mt-1 text-sm leading-6 text-white/45">
                Update your shop content anytime from one place.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="relative z-10 grid place-items-center">
        <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] p-[1px]">
          <span className="login-border-light absolute -inset-40 bg-[conic-gradient(from_0deg,transparent,rgba(236,72,153,.9),rgba(139,92,246,.9),transparent_35%)]" />

          <form
            onSubmit={handleSubmit}
            noValidate
            autoComplete="off"
            className="relative z-10 rounded-[2rem] border border-white/10 bg-black/80 p-6 shadow-2xl backdrop-blur-2xl sm:p-8"
          >
            <div className="mb-8 text-center">
              <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-600 shadow-glow">
                <Camera size={28} />
              </span>

              <h1 className="text-3xl font-black">Admin Login</h1>

              <p className="mt-2 text-sm leading-6 text-white/50">
                Sign in to manage ADRA Photography & Events.
              </p>
            </div>

            <div className="grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white/65">
                  Email Address
                </span>

                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-pink-300"
                  />
                  <input
                    className="input-field w-full !pl-12 pr-4"
                    placeholder="Enter admin email"
                    type="email"
                    name="admin_login_email"
                    autoComplete="off"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white/65">
                  Password
                </span>

              <div className="relative">
  <LockKeyhole
    size={18}
    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-pink-300"
  />
  <input
    className="input-field w-full !pl-12 pr-4"
    type="password"
    placeholder="Enter password"
    name="admin_login_password"
    autoComplete="current-password"
    value={form.password}
    onChange={(e) =>
      setForm({ ...form, password: e.target.value })
    }
  />
</div>
              </label>

              <div className="flex justify-end">
                <Link
                  to="/admin/forgot-password"
                  className="text-sm font-semibold text-pink-300 transition hover:text-white"
                >
                  Forgot password?
                </Link>
              </div>

              {error && (
                <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">
                  {error}
                </p>
              )}

              <button
                className="btn-primary mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Login"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
