import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Edit3,
  ImageIcon,
  MapPin,
  Megaphone,
} from "lucide-react";
import api from "../../lib/api.js";

export default function EventView() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/events?admin=true")
      .then((res) => {
        const event = res.data.find(
          (eventItem) => String(eventItem.id) === String(id),
        );
        setItem(event || null);
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="text-white/60">Loading event...</p>;
  }

  if (!item) {
    return (
      <div className="space-y-5">
        <Link to="/admin/events" className="btn-secondary">
          <ArrowLeft size={18} /> Back to events
        </Link>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-8">
          <h1 className="text-3xl font-black">Event not found</h1>
          <p className="mt-3 text-white/50">
            This event may have been deleted.
          </p>
        </div>
      </div>
    );
  }

  const eventDate = item.event_date ? new Date(item.event_date) : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <Link to="/admin/events" className="btn-secondary">
          <ArrowLeft size={18} /> Back
        </Link>

        <Link to={`/admin/events/${id}/edit`} className="btn-primary">
          <Edit3 size={18} /> Edit Event
        </Link>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] shadow-2xl">
        {item.cover_image ? (
          <img
            src={item.cover_image}
            alt={item.title}
            className="h-[420px] w-full object-cover"
          />
        ) : (
          <div className="grid h-[320px] place-items-center bg-white/[0.04] text-white/35">
            <ImageIcon size={46} />
          </div>
        )}

        <div className="p-8">
          <div className="mb-5 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-4 py-2 text-sm font-bold text-blue-100">
              <CalendarDays size={15} /> Event
            </span>

            <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold capitalize text-white/70">
              {item.status}
            </span>
          </div>

          <h1 className="text-4xl font-black md:text-5xl">{item.title}</h1>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-white/45">
                <Clock size={16} /> Event date
              </p>
              <p className="text-xl font-black">
                {eventDate ? eventDate.toLocaleString() : "-"}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-white/45">
                <MapPin size={16} /> Location
              </p>
              <p className="text-xl font-black">{item.location || "-"}</p>
            </div>
          </div>

          {item.promotional_message && (
            <div className="mt-8 rounded-[2rem] border border-pink-300/20 bg-pink-500/10 p-6">
              <h2 className="mb-3 flex items-center gap-2 text-2xl font-black">
                <Megaphone size={22} /> Promotional message
              </h2>
              <p className="leading-8 text-pink-50/75">
                {item.promotional_message}
              </p>
            </div>
          )}

          {item.description && (
            <div className="mt-8 rounded-[2rem] border border-white/10 bg-black/20 p-6">
              <h2 className="mb-3 text-2xl font-black">Description</h2>
              <p className="leading-8 text-white/60">{item.description}</p>
            </div>
          )}

          <div className="mt-6 text-sm text-white/40">
            Created:{" "}
            {item.created_at
              ? new Date(item.created_at).toLocaleDateString()
              : "-"}
          </div>
        </div>
      </div>
    </div>
  );
}