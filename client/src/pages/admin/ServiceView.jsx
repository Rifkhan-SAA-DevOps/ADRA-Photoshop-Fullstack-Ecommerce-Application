import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ImageIcon,
  Maximize2,
  Sparkles,
} from "lucide-react";
import api from "../../lib/api.js";

function buildImageList(item = {}, title = "Image") {
  const images = [];
  const seen = new Set();

  function addImage(imageUrl, caption = "") {
    const cleanUrl = String(imageUrl || "").trim();

    if (!cleanUrl || seen.has(cleanUrl)) return;

    seen.add(cleanUrl);
    images.push({
      image_url: cleanUrl,
      caption: caption || title,
    });
  }

  addImage(item.cover_image, `${title} cover image`);

  if (Array.isArray(item.images)) {
    item.images.forEach((image, index) => {
      if (typeof image === "string") {
        addImage(image, `${title} image ${index + 1}`);
        return;
      }

      addImage(
        image?.image_url || image?.url,
        image?.caption || image?.alt || `${title} image ${index + 1}`,
      );
    });
  }

  return images;
}

function getFrameClass(shape) {
  if (shape === "portrait") {
    return "mx-auto h-[540px] max-w-[560px]";
  }

  if (shape === "square") {
    return "mx-auto h-[500px] max-w-[720px]";
  }

  return "h-[430px] w-full lg:h-[520px]";
}

function AdminImageCarousel({ item, title }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const [shape, setShape] = useState("landscape");

  const images = useMemo(() => buildImageList(item, title), [item, title]);
  const activeImage = images[activeIndex] || images[0] || null;
  const hasManyImages = images.length > 1;

  useEffect(() => {
    setActiveIndex(0);
  }, [images.length]);

  useEffect(() => {
    if (!hasManyImages) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [hasManyImages, images.length]);

  function goPrevious() {
    if (!hasManyImages) return;
    setActiveIndex((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  }

  function goNext() {
    if (!hasManyImages) return;
    setActiveIndex((current) => (current + 1) % images.length);
  }

  function handleImageLoad(event) {
    const { naturalWidth, naturalHeight } = event.currentTarget;

    if (!naturalWidth || !naturalHeight) return;

    const ratio = naturalWidth / naturalHeight;

    if (ratio < 0.85) {
      setShape("portrait");
      return;
    }

    if (ratio > 1.25) {
      setShape("landscape");
      return;
    }

    setShape("square");
  }

  if (!activeImage) {
    return (
      <div className="grid h-[320px] place-items-center bg-white/[0.04] text-white/35">
        <div className="text-center">
          <ImageIcon className="mx-auto" size={46} />
          <p className="mt-3 text-sm font-semibold">No images available</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-white/10 bg-black/35 p-4 sm:p-6">
        <div
          className={`${getFrameClass(
            shape,
          )} group relative overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl transition-all duration-500`}
        >
          <img
            key={activeImage.image_url}
            src={activeImage.image_url}
            alt={activeImage.caption || title}
            onLoad={handleImageLoad}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

          <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/55 px-4 py-2 text-xs font-black text-white backdrop-blur-xl">
            {activeIndex + 1} / {images.length}
          </div>

          <button
            type="button"
            onClick={() => setPreviewImage(activeImage)}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-xl transition hover:bg-white hover:text-black"
            aria-label="Preview image"
          >
            <Maximize2 size={18} />
          </button>

          {hasManyImages && (
            <>
              <button
                type="button"
                onClick={goPrevious}
                className="absolute left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur-xl transition hover:bg-white hover:text-black"
                aria-label="Previous image"
              >
                <ChevronLeft size={22} />
              </button>

              <button
                type="button"
                onClick={goNext}
                className="absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur-xl transition hover:bg-white hover:text-black"
                aria-label="Next image"
              >
                <ChevronRight size={22} />
              </button>

              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full border border-white/10 bg-black/55 px-3 py-2 backdrop-blur-xl">
                {images.map((image, index) => (
                  <button
                    key={`${image.image_url}-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`h-2.5 rounded-full transition-all ${
                      index === activeIndex
                        ? "w-8 bg-white"
                        : "w-2.5 bg-white/35 hover:bg-white/70"
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button
                key={`${image.image_url}-thumb-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-20 w-28 shrink-0 overflow-hidden rounded-2xl border bg-black transition ${
                  index === activeIndex
                    ? "border-pink-300 ring-2 ring-pink-300/40"
                    : "border-white/10 opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={image.image_url}
                  alt={image.caption || `${title} thumbnail ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4 backdrop-blur-xl"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute right-5 top-5 rounded-full bg-white px-4 py-2 text-sm font-black text-black"
          >
            Close
          </button>

          <img
            src={previewImage.image_url}
            alt={previewImage.caption || title}
            className="max-h-[88vh] max-w-[94vw] rounded-[2rem] object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

export default function ServiceView() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    api
      .get(`/services/${id}`)
      .then((res) => setItem(res.data || null))
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
        <AdminImageCarousel item={item} title={item.title || "Service"} />

        <div className="p-8">
          <div className="mb-5 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-pink-500/20 px-4 py-2 text-sm font-bold text-pink-100">
              <Sparkles size={15} /> Service
            </span>

            <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold capitalize text-white/70">
              {item.status}
            </span>

            {item.category && (
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/70">
                {item.category}
              </span>
            )}

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
