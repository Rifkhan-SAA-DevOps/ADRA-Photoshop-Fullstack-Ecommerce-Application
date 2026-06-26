import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Edit3,
  ImageIcon,
  Sparkles,
} from "lucide-react";
import api from "../../lib/api.js";

export default function ServiceView() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/services?admin=true")
      .then((res) => {
        const service = res.data.find(
          (serviceItem) => String(serviceItem.id) === String(id),
        );
        setItem(service || null);
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="text-white/60">Loading service...</p>;
  }

  if (!item) {
    return (
      <div className="space-y-5">
        <Link to="/admin/services" className="btn-secondary">
          <ArrowLeft size={18} /> Back to services
        </Link>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-8">
          <h1 className="text-3xl font-black">Service not found</h1>
          <p className="mt-3 text-white/50">
            This service may have been deleted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <Link to="/admin/services" className="btn-secondary">
          <ArrowLeft size={18} /> Back
        </Link>

        <Link to={`/admin/services/${id}/edit`} className="btn-primary">
          <Edit3 size={18} /> Edit Service
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
            <span className="inline-flex items-center gap-2 rounded-full bg-pink-500/20 px-4 py-2 text-sm font-bold text-pink-100">
              <Sparkles size={15} /> Service
            </span>

            <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold capitalize text-white/70">
              {item.status}
            </span>

            {item.is_featured ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-yellow-500/20 px-4 py-2 text-sm font-bold text-yellow-100">
                <BadgeCheck size={15} /> Featured
              </span>
            ) : null}
          </div>

          <h1 className="text-4xl font-black md:text-5xl">{item.title}</h1>

          <p className="mt-4 text-2xl font-black text-pink-200">
            From LKR {Number(item.price_from || 0).toLocaleString()}
          </p>

          {item.short_description && (
            <p className="mt-6 text-lg leading-8 text-white/70">
              {item.short_description}
            </p>
          )}

          {item.description && (
            <div className="mt-8 rounded-[2rem] border border-white/10 bg-black/20 p-6">
              <h2 className="mb-3 text-2xl font-black">Full description</h2>
              <p className="leading-8 text-white/60">{item.description}</p>
            </div>
          )}

          <div className="mt-6 flex items-center gap-2 text-sm text-white/40">
            <CalendarDays size={16} />
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