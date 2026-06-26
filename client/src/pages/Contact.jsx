import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  MessageCircle,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Send,
  Sparkles,
  MapPin,
  CheckCircle2,
  ChevronDown,
  Check,
} from "lucide-react";
import api from "../lib/api.js";
import PageHero from "../components/PageHero.jsx";

const DEFAULT_SETTINGS = {
  whatsapp_number: "+94755599333",
  admin_phone: "+94755599333",
  email: "adravgconsole@gmail.com",
  instagram: "adra_vgc",
  facebook: "ADRA Gift Console",
};
const REQUEST_TYPES = [
  { value: "service", label: "Service" },
  { value: "product", label: "Product" },
  { value: "event", label: "Event" },
  { value: "editing", label: "Editing" },
  { value: "other", label: "Other" },
];
export default function Contact() {
  const typeRef = useRef(null);
  const [typeOpen, setTypeOpen] = useState(false);
  const location = useLocation();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service_type: location.state?.service || "",
    message: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get("/settings")
      .then((res) => {
        const data = res.data?.settings || res.data?.data || res.data || {};
        setSettings({
          ...DEFAULT_SETTINGS,
          ...data,
        });
      })
      .catch(() => {
        setSettings(DEFAULT_SETTINGS);
      });
  }, []);
  useEffect(() => {
    function handleClickOutside(event) {
      if (typeRef.current && !typeRef.current.contains(event.target)) {
        setTypeOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setTypeOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);
  function handlePhoneChange(value) {
    const onlyDigits = value.replace(/\D/g, "").slice(0, 10);
    setForm({ ...form, phone: onlyDigits });
  }

  async function submitContact(event) {
    event.preventDefault();
    setMessage("");

    if (!form.name.trim()) {
      setMessage("Please enter your name.");
      return;
    }

    if (!/^\d{10}$/.test(form.phone)) {
      setMessage("Phone number must be exactly 10 digits.");
      return;
    }

    if (!form.service_type) {
      setMessage("Please select request type.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone,
        service_type: form.service_type,
        message: form.message.trim(),
      };

      const res = await api.post("/contact", payload);

      setMessage(
        res.data?.message || "Your request has been sent successfully.",
      );

      setForm({
        name: "",
        email: "",
        phone: "",
        service_type: "",
        message: "",
      });
    } catch (error) {
      setMessage(error.response?.data?.message || "Request could not be sent.");
    } finally {
      setLoading(false);
    }
  }

  const cleanWhatsApp = String(
    settings.whatsapp_number || "+94755599333",
  ).replace(/[^0-9]/g, "");

  const whatsappText = encodeURIComponent(
    `Hello ADRA Gift Console, I want to ask about ${
      form.service_type || "service"
    }. My name is ${form.name || ""}.`,
  );

  const instagramUrl = `https://www.instagram.com/${settings.instagram || "adra_vgc"}`;

  const facebookUrl =
    "https://www.facebook.com/search/top?q=adra%20gift%20console";

  return (
    <>
      <PageHero
        title="Contact ADRA"
        subtitle="Send your service, product, event, editing, or other request. Our team will contact you soon."
      />

      <section className="section-padding relative overflow-hidden py-12 lg:py-16">
        <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-pink-500/15 blur-[100px]" />
        <div className="pointer-events-none absolute -right-32 bottom-20 h-72 w-72 rounded-full bg-violet-500/15 blur-[100px]" />

        <div className="container-max relative z-10 grid gap-7 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Contact Form */}
          <form
            onSubmit={submitContact}
            className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl backdrop-blur-xl sm:p-7"
          >
            <div className="mb-6">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-pink-400/25 bg-pink-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-pink-200">
                <Sparkles size={14} />
                Request Form
              </span>

              <h2 className="text-2xl font-black text-white sm:text-3xl">
                Tell us what you need
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
                Fill this form for service requests, product orders, event
                coverage, editing work, frames, albums, or other inquiries.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="input-field"
                  placeholder="Your name"
                  value={form.name}
                  required
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />

                <input
                  className="input-field"
                  type="text"
                  placeholder="Phone number, e.g. 0755599333"
                  value={form.phone}
                  required
                  inputMode="numeric"
                  maxLength={10}
                  pattern="\d{10}"
                  title="Phone number must be exactly 10 digits"
                  onChange={(e) => handlePhoneChange(e.target.value)}
                />
              </div>

              <input
                className="input-field"
                type="email"
                placeholder="Email address, optional"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              <div ref={typeRef} className="relative">
                <button
                  type="button"
                  onClick={() => setTypeOpen((value) => !value)}
                  className={`input-field flex w-full items-center justify-between text-left transition ${
                    form.service_type ? "text-white" : "text-white/40"
                  }`}
                >
                  <span>
                    {REQUEST_TYPES.find(
                      (type) => type.value === form.service_type,
                    )?.label || "Select request type"}
                  </span>

                  <ChevronDown
                    size={18}
                    className={`text-pink-300 transition ${typeOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {typeOpen && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-3xl border border-pink-400/20 bg-zinc-950/95 p-2 shadow-2xl shadow-pink-500/10 backdrop-blur-xl">
                    {REQUEST_TYPES.map((type) => {
                      const active = form.service_type === type.value;

                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => {
                            setForm({ ...form, service_type: type.value });
                            setTypeOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                            active
                              ? "bg-gradient-to-r from-pink-500/25 to-violet-500/25 text-white"
                              : "text-white/65 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <span>{type.label}</span>

                          {active && (
                            <Check size={16} className="text-pink-300" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                <input type="hidden" required value={form.service_type} />
              </div>

              <textarea
                className="input-field min-h-32 resize-none"
                placeholder="Message, optional. You can add date, location, package idea, product details, editing details, or budget..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />

              <button
                type="submit"
                disabled={loading}
                className="btn-primary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={17} />
                {loading ? "Sending..." : "Submit Request"}
              </button>

              {message && (
                <p className="rounded-2xl border border-pink-400/20 bg-pink-500/10 px-4 py-3 text-sm font-medium text-pink-100">
                  {message}
                </p>
              )}
            </div>
          </form>

          {/* Direct Contact */}
          <div className="space-y-5">
            <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-pink-500/15 via-white/[0.04] to-violet-500/15 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-white/70">
                Direct Contact
              </span>

              <h2 className="text-2xl font-black text-white sm:text-3xl">
                Contact ADRA Gift Console
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/55">
                Need a quick response? Contact us directly through phone,
                WhatsApp, email, Instagram, or Facebook.
              </p>

              <div className="mt-6 grid gap-3">
                <a
                  href={`tel:${settings.admin_phone || settings.whatsapp_number}`}
                  className="group flex items-center gap-3 rounded-3xl border border-white/10 bg-black/25 p-4 transition hover:bg-white/10"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-pink-500/15 text-pink-300">
                    <Phone size={19} />
                  </span>
                  <span>
                    <span className="block text-xs text-white/40">Phone</span>
                    <span className="font-semibold text-white/80 group-hover:text-white">
                      +94 75 559 9333
                    </span>
                  </span>
                </a>

                <a
                  href={`https://wa.me/${cleanWhatsApp}?text=${whatsappText}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 rounded-3xl border border-green-400/20 bg-green-500/10 p-4 transition hover:bg-green-500/20"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-green-500/15 text-green-200">
                    <MessageCircle size={19} />
                  </span>
                  <span>
                    <span className="block text-xs text-white/40">
                      WhatsApp
                    </span>
                    <span className="font-semibold text-white/80 group-hover:text-white">
                      +94 75 559 9333
                    </span>
                  </span>
                </a>

                <a
                  href="mailto:adravgconsole@gmail.com"
                  className="group flex items-center gap-3 rounded-3xl border border-white/10 bg-black/25 p-4 transition hover:bg-white/10"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-pink-500/15 text-pink-300">
                    <Mail size={19} />
                  </span>
                  <span>
                    <span className="block text-xs text-white/40">Email</span>
                    <span className="break-all font-semibold text-white/80 group-hover:text-white">
                      adravgconsole@gmail.com
                    </span>
                  </span>
                </a>

                <div className="grid gap-3 sm:grid-cols-2">
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-3 rounded-3xl border border-white/10 bg-black/25 p-4 transition hover:bg-white/10"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-pink-500/15 text-pink-300">
                      <Instagram size={19} />
                    </span>
                    <span>
                      <span className="block text-xs text-white/40">
                        Instagram
                      </span>
                      <span className="font-semibold text-white/80 group-hover:text-white">
                        @adra_vgc
                      </span>
                    </span>
                  </a>

                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-3 rounded-3xl border border-white/10 bg-black/25 p-4 transition hover:bg-white/10"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-500/15 text-blue-200">
                      <Facebook size={19} />
                    </span>
                    <span>
                      <span className="block text-xs text-white/40">
                        Facebook
                      </span>
                      <span className="font-semibold text-white/80 group-hover:text-white">
                        ADRA Gift Console
                      </span>
                    </span>
                  </a>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                <CheckCircle2 className="mb-3 text-pink-300" size={22} />
                <h3 className="font-bold text-white">Fast Reply</h3>
                <p className="mt-1 text-sm leading-6 text-white/50">
                  Send your request and our team will contact you for details.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                <MapPin className="mb-3 text-pink-300" size={22} />
                <h3 className="font-bold text-white">Sri Lanka</h3>
                <p className="mt-1 text-sm leading-6 text-white/50">
                  Services, products, events, editing, and digital solutions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
