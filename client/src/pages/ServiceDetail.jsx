import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import api from "../lib/api.js";
import { fallbackServices } from "../lib/fallback.js";
import BackButton from "../components/BackButton.jsx";
import default_services from "./../docs/images/default_services.png";

function getServiceImageList(serviceData) {
  const imageMap = new Map();

  function addImage(imageUrl, caption = "") {
    const cleanUrl = String(imageUrl || "").trim();

    if (!cleanUrl || imageMap.has(cleanUrl)) return;

    imageMap.set(cleanUrl, {
      image_url: cleanUrl,
      caption: String(caption || "").trim(),
    });
  }

  addImage(serviceData?.cover_image, "Cover image");

  if (Array.isArray(serviceData?.images)) {
    serviceData.images.forEach((image) => {
      if (typeof image === "string") {
        addImage(image);
        return;
      }

      addImage(image?.image_url || image?.url, image?.caption || image?.alt);
    });
  }

  if (!imageMap.size) {
    addImage(default_services, "Default service image");
  }

  return [...imageMap.values()];
}

function getImageShape(width, height) {
  if (!width || !height) return "landscape";

  const ratio = width / height;

  if (ratio < 0.78) return "portrait";
  if (ratio > 1.22) return "landscape";
  return "square";
}

function getFrameClass(imageShape) {
  if (imageShape === "portrait") {
    return "mx-auto h-[560px] max-w-[430px] sm:h-[620px]";
  }

  if (imageShape === "square") {
    return "mx-auto h-[460px] max-w-[620px] sm:h-[560px]";
  }

  return "h-[340px] sm:h-[430px] lg:h-[520px]";
}

export default function ServiceDetail() {
  const { slug } = useParams();
  const [service, setService] = useState(
    fallbackServices.find((item) => item.slug === slug) || fallbackServices[0],
  );

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageShape, setImageShape] = useState("landscape");
  const [previewImage, setPreviewImage] = useState(null);

  const serviceImages = useMemo(() => getServiceImageList(service), [service]);

  const activeImage =
    serviceImages[activeImageIndex] || serviceImages[0] || { image_url: default_services };

  useEffect(() => {
    api
      .get(`/services/${slug}`)
      .then((res) => setService(res.data))
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    setActiveImageIndex(0);
    setImageShape("landscape");
  }, [service.id, service.slug]);

  useEffect(() => {
    if (activeImageIndex >= serviceImages.length) {
      setActiveImageIndex(0);
    }
  }, [activeImageIndex, serviceImages.length]);

  useEffect(() => {
    if (serviceImages.length <= 1) return undefined;

    const interval = window.setInterval(() => {
      setActiveImageIndex((current) => (current + 1) % serviceImages.length);
    }, 4200);

    return () => window.clearInterval(interval);
  }, [serviceImages.length]);

  function goToPreviousImage() {
    setActiveImageIndex((current) => {
      return current === 0 ? serviceImages.length - 1 : current - 1;
    });
  }

  function goToNextImage() {
    setActiveImageIndex((current) => (current + 1) % serviceImages.length);
  }

  return (
    <section className="section-padding py-16">
      <BackButton fallback="/services" label="Back to services" />

      {previewImage && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 px-4 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute right-5 top-5 rounded-full border border-white/15 bg-white/10 p-3 text-white transition hover:bg-white/20"
            aria-label="Close image preview"
          >
            <X size={22} />
          </button>

          <img
            src={previewImage.image_url}
            alt={previewImage.caption || service.title}
            className="max-h-[86vh] max-w-[94vw] rounded-[2rem] object-contain shadow-2xl"
          />
        </div>
      )}

      <div className="container-max grid gap-10 lg:grid-cols-2 lg:items-start">
        <div>
          <div
            className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/30 shadow-2xl ${getFrameClass(
              imageShape,
            )}`}
          >
            <img
              key={activeImage.image_url}
              src={activeImage.image_url}
              alt={activeImage.caption || service.title}
              onLoad={(event) => {
                const imageElement = event.currentTarget;
                setImageShape(
                  getImageShape(
                    imageElement.naturalWidth,
                    imageElement.naturalHeight,
                  ),
                );
              }}
              className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

            <button
              type="button"
              onClick={() => setPreviewImage(activeImage)}
              className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/45 p-3 text-white backdrop-blur-xl transition hover:bg-white hover:text-black"
              aria-label="Open service image preview"
            >
              <Expand size={18} />
            </button>

            {serviceImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goToPreviousImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 p-3 text-white backdrop-blur-xl transition hover:bg-white hover:text-black"
                  aria-label="Previous service image"
                >
                  <ChevronLeft size={22} />
                </button>

                <button
                  type="button"
                  onClick={goToNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 p-3 text-white backdrop-blur-xl transition hover:bg-white hover:text-black"
                  aria-label="Next service image"
                >
                  <ChevronRight size={22} />
                </button>

                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/45 px-4 py-2 backdrop-blur-xl">
                  {serviceImages.map((image, index) => (
                    <button
                      key={image.image_url}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      className={`h-2.5 rounded-full transition-all ${
                        index === activeImageIndex
                          ? "w-8 bg-white"
                          : "w-2.5 bg-white/40 hover:bg-white/70"
                      }`}
                      aria-label={`Go to service image ${index + 1}`}
                    />
                  ))}
                </div>

                <p className="absolute bottom-4 right-4 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-xs font-bold text-white/80 backdrop-blur-xl">
                  {activeImageIndex + 1}/{serviceImages.length}
                </p>
              </>
            )}
          </div>

          {serviceImages.length > 1 && (
            <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
              {serviceImages.map((image, index) => (
                <button
                  key={image.image_url}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={`relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl border transition sm:h-24 sm:w-32 ${
                    index === activeImageIndex
                      ? "border-pink-300 ring-2 ring-pink-300/40"
                      : "border-white/10 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={image.image_url}
                    alt={image.caption || `${service.title} ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-pink-300">
            Service
          </p>
          <h1 className="text-5xl font-black">{service.title}</h1>
          <p className="mt-5 text-2xl font-bold text-violet-200">
            From LKR {Number(service.price_from || 0).toLocaleString()}
          </p>
          <p className="mt-6 text-lg leading-8 text-white/65">
            {service.description}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              "Professional editing",
              "High-resolution delivery",
              "Friendly direction",
              "Custom packages",
            ].map((item) => (
              <p
                key={item}
                className="flex items-center gap-2 rounded-2xl bg-white/10 p-4 text-sm text-white/70"
              >
                <CheckCircle2 size={18} className="text-pink-300" /> {item}
              </p>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/contact"
              state={{ service: service.title }}
              className="btn-primary"
            >
              Request this service <ArrowRight size={18} />
            </Link>
            <Link to="/products" className="btn-secondary">
              View products
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
