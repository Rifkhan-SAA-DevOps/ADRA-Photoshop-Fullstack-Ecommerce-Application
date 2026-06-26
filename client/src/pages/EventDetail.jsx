import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";
import api from "../lib/api.js";
import { fallbackEvents } from "../lib/fallback.js";
import BackButton from "../components/BackButton.jsx";
import default_events from "./../docs/images/default_events.png";

function validatePhone(phone) {
  const cleanPhone = String(phone || "").replace(/\s+/g, "");
  return /^[0-9+]{9,15}$/.test(cleanPhone);
}

function getEventDate(value) {
  if (!value) return null;

  const date = new Date(String(value).replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

export default function EventDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [eventData, setEventData] = useState(
    fallbackEvents.find((item) => item.slug === slug) || fallbackEvents[0],
  );

  const [form, setForm] = useState({
    customer_name: "",
    email: "",
    phone: "",
    service_needed: "Event photography",
    message: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [message, setMessage] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const image =
    eventData.cover_image ||
    eventData.images?.[0]?.image_url ||
    default_events;

  const eventDate = getEventDate(eventData.event_date);
  const eventAvailable = eventDate ? eventDate.getTime() > Date.now() : false;

  useEffect(() => {
    api
      .get(`/events/${slug}`)
      .then((res) => setEventData(res.data))
      .catch(() => {});
  }, [slug]);

  const countdown = useMemo(() => {
    const date = getEventDate(eventData.event_date);

    if (!date) return "Event date not available";

    const diff = date.getTime() - Date.now();

    if (diff <= 0) return "Event date reached";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

    if (days > 0) return `${days} days ${hours} hours remaining`;

    return `${hours} hours remaining`;
  }, [eventData.event_date]);

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
  }

  function validateBookingForm() {
    const errors = {};
    const cleanName = String(form.customer_name || "").trim();
    const cleanPhone = String(form.phone || "").trim();
    const cleanEmail = String(form.email || "").trim();
    const cleanService = String(form.service_needed || "").trim();

    if (!eventAvailable) {
      errors.event = "Booking is closed because this event date has already passed.";
    }

    if (!cleanName) {
      errors.customer_name = "Please enter your name.";
    }

    if (!cleanPhone) {
      errors.phone = "Please enter your phone number.";
    } else if (!validatePhone(cleanPhone)) {
      errors.phone = "Please enter a valid phone number.";
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!cleanService) {
      errors.service_needed = "Please enter the service you need.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function submitBooking(event) {
    event.preventDefault();
    setMessage("");

    const isValid = validateBookingForm();

    if (!isValid) {
      setMessage("Please correct the highlighted fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customer_name: form.customer_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        service_needed: form.service_needed.trim(),
        message: form.message.trim(),
      };

      await api.post(`/events/${eventData.id || slug}/bookings`, payload);

      setShowSuccessAlert(true);

      setForm({
        customer_name: "",
        email: "",
        phone: "",
        service_needed: "Event photography",
        message: "",
      });

      setFormErrors({});
      setMessage("");
    } catch (error) {
      const backendErrors = error.response?.data?.errors || {};

      setFormErrors(backendErrors);

      setMessage(
        error.response?.data?.message ||
          "Booking request could not be sent. Please check your details.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="section-padding py-16">
      <BackButton fallback="/events" label="Back to events" />

      {showSuccessAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-green-300/20 bg-[#12091f] p-7 text-center shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-green-400" />

            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-4xl">
              ✅
            </div>

            <h2 className="text-3xl font-black text-white">
              Booking request sent!
            </h2>

            <p className="mt-4 text-sm leading-7 text-white/65">
              Your event booking request has been sent to the admin
              successfully. We will contact you soon to confirm your booking.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
              <p className="text-sm text-white/55">Event</p>
              <p className="font-bold text-white">{eventData.title}</p>

              <p className="mt-3 text-sm text-white/55">Service requested</p>
              <p className="font-bold text-pink-200">
                {form.service_needed || "Event photography"}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/events")}
                className="btn-primary flex-1"
              >
                Back to events
              </button>

              <button
                type="button"
                onClick={() => setShowSuccessAlert(false)}
                className="btn-secondary flex-1"
              >
                Stay here
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container-max grid gap-10 lg:grid-cols-2">
        <div>
          <img
            src={image}
            alt={eventData.title}
            className="h-[480px] w-full rounded-[2rem] object-cover"
          />

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <p className="rounded-3xl bg-white/10 p-5 text-white/70">
              <Calendar className="mb-2 text-pink-300" />
              {eventDate ? eventDate.toLocaleString() : "Date not available"}
            </p>

            <p className="rounded-3xl bg-white/10 p-5 text-white/70">
              <MapPin className="mb-2 text-violet-300" />
              {eventData.location || "Location not available"}
            </p>
          </div>
        </div>

        <div>
          <p
            className={`mb-4 text-sm font-bold uppercase tracking-[0.3em] ${
              eventAvailable ? "text-pink-300" : "text-red-300"
            }`}
          >
            {countdown}
          </p>

          <h1 className="text-5xl font-black">{eventData.title}</h1>

          {eventData.promotional_message && (
            <p className="mt-5 text-xl text-violet-200">
              {eventData.promotional_message}
            </p>
          )}

          <p className="mt-6 text-lg leading-8 text-white/65">
            {eventData.description}
          </p>

          <form
            onSubmit={submitBooking}
            className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6"
          >
            <h2 className="mb-2 text-2xl font-black">
              Book this event package
            </h2>

            <p className="mb-5 text-sm text-white/55">
              Fill your details. Your booking request will be sent to the admin.
            </p>

            {!eventAvailable && (
              <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-semibold text-red-200">
                Booking is closed because this event date has already passed.
              </div>
            )}

            <div className="grid gap-4">
              <div>
                <input
                  className={`input-field ${
                    formErrors.customer_name ? "border-red-400/70" : ""
                  }`}
                  placeholder="Name"
                  value={form.customer_name}
                  onChange={(e) =>
                    updateField("customer_name", e.target.value)
                  }
                  disabled={!eventAvailable || isSubmitting}
                  required
                />

                {formErrors.customer_name && (
                  <p className="mt-2 text-xs font-semibold text-red-300">
                    {formErrors.customer_name}
                  </p>
                )}
              </div>

              <div>
                <input
                  className={`input-field ${
                    formErrors.phone ? "border-red-400/70" : ""
                  }`}
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  disabled={!eventAvailable || isSubmitting}
                  required
                />

                {formErrors.phone && (
                  <p className="mt-2 text-xs font-semibold text-red-300">
                    {formErrors.phone}
                  </p>
                )}
              </div>

              <div>
                <input
                  className={`input-field ${
                    formErrors.email ? "border-red-400/70" : ""
                  }`}
                  placeholder="Email optional"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  disabled={!eventAvailable || isSubmitting}
                />

                {formErrors.email && (
                  <p className="mt-2 text-xs font-semibold text-red-300">
                    {formErrors.email}
                  </p>
                )}
              </div>

              <div>
                <input
                  className={`input-field ${
                    formErrors.service_needed ? "border-red-400/70" : ""
                  }`}
                  placeholder="Service needed"
                  value={form.service_needed}
                  onChange={(e) =>
                    updateField("service_needed", e.target.value)
                  }
                  disabled={!eventAvailable || isSubmitting}
                  required
                />

                {formErrors.service_needed && (
                  <p className="mt-2 text-xs font-semibold text-red-300">
                    {formErrors.service_needed}
                  </p>
                )}
              </div>

              <div>
                <textarea
                  className={`input-field min-h-28 ${
                    formErrors.message ? "border-red-400/70" : ""
                  }`}
                  placeholder="Message optional"
                  value={form.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  disabled={!eventAvailable || isSubmitting}
                />

                {formErrors.message && (
                  <p className="mt-2 text-xs font-semibold text-red-300">
                    {formErrors.message}
                  </p>
                )}
              </div>

              {formErrors.event && (
                <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm font-semibold text-red-200">
                  {formErrors.event}
                </p>
              )}

              <button
                className="btn-primary"
                disabled={!eventAvailable || isSubmitting}
              >
                {!eventAvailable
                  ? "Booking closed"
                  : isSubmitting
                    ? "Sending booking..."
                    : "Send booking request"}
              </button>

              {message && <p className="text-sm text-pink-200">{message}</p>}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}