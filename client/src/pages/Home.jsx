import React, { useEffect, useMemo, useRef, useState } from "react";
import HomeReviewsSection from "../components/HomeReviewsSection.jsx";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Video,
} from "lucide-react";
import api from "../lib/api.js";
import {
  fallbackEvents,
  fallbackProducts,
  fallbackServices,
} from "../lib/fallback.js";

const heroVideos = [
  // "https://videos.pexels.com/video-files/3195394/3195394-uhd_2560_1440_25fps.mp4",
  // "https://videos.pexels.com/video-files/853879/853879-hd_1920_1080_25fps.mp4",
];

import wedding_couples from "./../docs/images/wedding_couples.png";
import Portrait from "./../docs/images/Portrait.png";
import video_editing from "./../docs/images/video_editing.png";
import photo_editing from "./../docs/images/photo_editing.png";
import camera_work from "./../docs/images/camera_work.png";
import convercation from "./../docs/images/convercation.png";
import Wedding_ceremony from "./../docs/images/Wedding_ceremony.png";
import photo_album from "./../docs/images/photo_album.png";
import birthday_event from "./../docs/images/birthday_event.png";
import videography from "./../docs/images/videography.png";
import wall_frame from "./../docs/images/wall_frame.png";
import website from "./../docs/images/wesite.png";

const fallbackHeroImageSets = [
  [
    {
      src: wedding_couples,
      alt: "Wedding couple",
    },
    {
      src: Portrait,
      alt: "Portrait session",
    },
    {
      src: camera_work,
      alt: "Camera work",
    },
    {
      src: convercation,
      alt: "Graduation photography",
    },
  ],
  [
    {
      src: Wedding_ceremony,
      alt: "Wedding ceremony",
    },
    {
      src: website,
      alt: "Website",
    },
    {
      src: photo_album,
      alt: "Photo album",
    },
    {
      src: birthday_event,
      alt: "Birthday event",
    },
  ],
  [
    {
      src: videography,
      alt: "Videography",
    },
    {
      src: photo_editing,
      alt: "Photo editing",
    },
    {
      src: video_editing,
      alt: "Event Video Editing",
    },
    {
      src: wall_frame,
      alt: "Wall frame display",
    },
  ],
];

const HERO_IMAGES_PER_SET = 4;

function buildHeroImageSets(images = []) {
  const cleanImages = Array.isArray(images)
    ? images
        .filter((image) => image?.image_url)
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
        .map((image) => ({
          src: image.image_url,
          alt: image.alt || "ADRA photography hero image",
        }))
    : [];

  if (!cleanImages.length) {
    return fallbackHeroImageSets;
  }

  const fallbackFlatImages = fallbackHeroImageSets.flat();

  const sets = [];

  for (let i = 0; i < cleanImages.length; i += HERO_IMAGES_PER_SET) {
    const set = cleanImages.slice(i, i + HERO_IMAGES_PER_SET);

    let fallbackIndex = 0;

    while (set.length < HERO_IMAGES_PER_SET) {
      set.push(fallbackFlatImages[fallbackIndex % fallbackFlatImages.length]);
      fallbackIndex += 1;
    }

    sets.push(set);
  }

  return sets.length ? sets : fallbackHeroImageSets;
}

const headingText = "Capture your moments with a modern creative studio.";

function TypewriterHeading() {
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    let currentIndex = 0;
    let isDeleting = false;
    let timeoutId;

    const runTypewriter = () => {
      if (!isDeleting) {
        currentIndex += 1;
        setTypedText(headingText.slice(0, currentIndex));

        if (currentIndex === headingText.length) {
          isDeleting = true;
          timeoutId = window.setTimeout(runTypewriter, 1300);
          return;
        }

        timeoutId = window.setTimeout(runTypewriter, 65);
        return;
      }

      currentIndex -= 1;
      setTypedText(headingText.slice(0, currentIndex));

      if (currentIndex === 0) {
        isDeleting = false;
        timeoutId = window.setTimeout(runTypewriter, 450);
        return;
      }

      timeoutId = window.setTimeout(runTypewriter, 32);
    };

    setTypedText("");
    timeoutId = window.setTimeout(runTypewriter, 300);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <h1
      aria-label={headingText}
      className="min-h-[240px] text-5xl font-black leading-tight tracking-tight sm:min-h-[340px] sm:text-7xl"
    >
      <span aria-hidden="true">
        {typedText.split("").map((letter, index) => (
          <motion.span
            key={`${letter}-${index}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="inline-block"
          >
            {letter === " " ? "\u00A0" : letter}
          </motion.span>
        ))}
      </span>
    </h1>
  );
}

function FlipMomentCard({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.08 }}
      className="group h-[360px] [perspective:1200px]"
    >
      <div className="relative h-full rounded-[2rem] transition duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
        <div className="absolute inset-0 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] [backface-visibility:hidden]">
          <img
            src={item.front}
            alt={item.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-6">
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white/80">
              <RotateCcw size={13} /> Hover to flip
            </p>
            <h3 className="text-2xl font-black">{item.title}</h3>
          </div>
        </div>
        <div className="absolute inset-0 overflow-hidden rounded-[2rem] border border-pink-300/25 bg-gradient-to-br from-pink-500/25 to-violet-500/25 p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <img
            src={item.back}
            alt={`${item.title} after`}
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
          <div className="relative flex h-full flex-col justify-end">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-pink-100">
              Transformation
            </p>
            <h3 className="text-3xl font-black">{item.title}</h3>
            <p className="mt-4 text-sm leading-7 text-white/75">{item.text}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function HeroImageGrid({ imageSetIndex, imageSets }) {
  const sizeClasses = ["h-72", "mt-16 h-72", "h-60", "h-60"];

  const hoverClasses = [
    "hover:[transform:rotateY(8deg)_scale(1.025)]",
    "hover:[transform:rotateX(6deg)_scale(1.025)]",
    "hover:[transform:rotateZ(-1.5deg)_scale(1.03)]",
    "hover:[transform:rotateY(-8deg)_scale(1.025)]",
  ];

  const shadowClasses = [
    "shadow-glow animate-float",
    "shadow-2xl",
    "shadow-2xl",
    "shadow-glow animate-float",
  ];

  const cardRoutes = [
    {
      enter: { x: -90, y: -40, rotate: -5 },
      exit: { x: 90, y: -45, rotate: 6 },
    },
    {
      enter: { x: 90, y: -45, rotate: 5 },
      exit: { x: -90, y: 45, rotate: -6 },
    },
    {
      enter: { x: -80, y: 55, rotate: 5 },
      exit: { x: 85, y: 45, rotate: 7 },
    },
    {
      enter: { x: 85, y: 50, rotate: -5 },
      exit: { x: -85, y: -50, rotate: -7 },
    },
  ];

  const getCardRoute = (index) => {
    const enterRoute = cardRoutes[(imageSetIndex + index) % cardRoutes.length];

    const exitRoute =
      cardRoutes[(imageSetIndex + index + 1) % cardRoutes.length];

    return {
      initial: {
        opacity: 0,
        scale: 0.82,
        ...enterRoute.enter,
      },
      animate: {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        rotate: 0,
      },
      exit: {
        opacity: 0,
        scale: 0.9,
        ...exitRoute.exit,
      },
    };
  };
  const currentImageSet =
    imageSets?.[imageSetIndex] || imageSets?.[0] || fallbackHeroImageSets[0];
  return (
    <div className="grid grid-cols-2 gap-4">
      {currentImageSet.map((image, index) => {
        const cardMotion = getCardRoute(index);

        return (
          <div
            key={index}
            className={`${sizeClasses[index]} relative overflow-visible [perspective:1000px]`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${imageSetIndex}-${index}-${image.src}`}
                initial={cardMotion.initial}
                animate={cardMotion.animate}
                exit={cardMotion.exit}
                transition={{
                  duration: 0.7,
                  delay: index * 0.08,
                  ease: [0.25, 1, 0.35, 1],
                }}
                className={`absolute inset-0 overflow-hidden rounded-[2rem] bg-white/10 ${shadowClasses[index]} ${hoverClasses[index]}`}
                style={{
                  willChange: "transform, opacity",
                  transform: "translateZ(0)",
                  backfaceVisibility: "hidden",
                }}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  loading="eager"
                  decoding="async"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />

                <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-t from-black/30 via-transparent to-white/10" />

                <div className="pointer-events-none absolute -bottom-10 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-pink-400/20 blur-2xl" />
              </motion.div>
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function ServiceMotionCard({ service }) {
  return (
    <Link
      to={`/services/${service.slug}`}
      className="group/card relative min-w-[280px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl transition duration-500 hover:-translate-y-2 hover:border-pink-300/40 hover:bg-white/[0.1] sm:min-w-[340px]"
    >
      <div className="h-64 overflow-hidden">
        <img
          src={service.cover_image}
          alt={service.title}
          className="h-full w-full object-cover transition duration-700 group-hover/card:scale-110"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-6">
        <p className="mb-2 text-sm font-semibold text-pink-200">
          From LKR {Number(service.price_from || 0).toLocaleString()}
        </p>

        <h3 className="mb-3 text-2xl font-black">{service.title}</h3>

        <p className="mb-5 line-clamp-2 text-sm leading-6 text-white/65">
          {service.short_description || service.description}
        </p>

        <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-black transition group-hover/card:bg-pink-200">
          Open service <ArrowRight size={15} />
        </span>
      </div>
    </Link>
  );
}

function ProductShowcase({ products }) {
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const shelfRef = useRef(null);
  const productRefs = useRef([]);

  const productList = products.length ? products : fallbackProducts;
  const activeIndex = featuredIndex % productList.length;
  const featured = productList[activeIndex];

  useEffect(() => {
    if (productList.length < 2) return undefined;

    const timer = setInterval(() => {
      setFeaturedIndex((current) => (current + 1) % productList.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [productList.length]);

  useEffect(() => {
    const shelf = shelfRef.current;
    if (!shelf || !productList.length) return;

    const groupSize = 3;
    const fullGroupStart = Math.floor(activeIndex / groupSize) * groupSize;
    const remainingProducts = productList.length - fullGroupStart;

    let scrollStartIndex;

    if (activeIndex === 0) {
      scrollStartIndex = 0;
    } else if (remainingProducts >= groupSize) {
      scrollStartIndex = fullGroupStart;
    } else {
      scrollStartIndex = Math.max(0, activeIndex - (groupSize - 1));
    }

    const targetItem = productRefs.current[scrollStartIndex];
    if (!targetItem) return;

    const shelfRect = shelf.getBoundingClientRect();
    const targetRect = targetItem.getBoundingClientRect();
    const targetTop = shelf.scrollTop + targetRect.top - shelfRect.top;

    shelf.scrollTo({
      top: targetTop,
      behavior: "smooth",
    });
  }, [activeIndex, productList.length]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
      <Link
        to={`/products/${featured.slug}`}
        className="group relative min-h-[520px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-violet-500/15 via-white/[0.06] to-pink-500/15 p-5 shadow-2xl"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={featured.id || featured.slug}
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -40, scale: 1.03 }}
            transition={{ duration: 0.55 }}
            className="absolute inset-5 overflow-hidden rounded-[2rem]"
          >
            <img
              src={featured.cover_image}
              alt={featured.name}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-8">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-500/25 px-4 py-2 text-sm font-bold text-violet-100">
                <Star size={15} fill="currentColor" /> Featured product
              </p>

              <h3 className="text-4xl font-black">{featured.name}</h3>

              <p className="mt-3 max-w-xl text-sm leading-7 text-white/70">
                {featured.description}
              </p>

              <p className="mt-5 text-2xl font-black">
                LKR {Number(featured.price || 0).toLocaleString()}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </Link>

      <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.05] p-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-300">
              Product shelf
            </p>
            <h3 className="mt-2 text-2xl font-black">Click a pack</h3>
          </div>

          <Link
            to="/products"
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold transition hover:bg-white/15"
          >
            All
          </Link>
        </div>

        <div
          ref={shelfRef}
          className="no-scrollbar flex h-[392px] snap-y flex-col gap-4 overflow-y-auto pr-1"
        >
          {productList.map((product, index) => (
            <motion.button
              ref={(element) => {
                productRefs.current[index] = element;
              }}
              key={product.id || product.slug}
              type="button"
              onClick={() => setFeaturedIndex(index)}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.04 }}
              className={`group flex min-h-[120px] snap-start items-center gap-4 rounded-[1.5rem] border p-3 text-left transition ${
                activeIndex === index
                  ? "border-violet-300/50 bg-violet-400/15"
                  : "border-white/10 bg-black/20 hover:bg-white/10"
              }`}
            >
              <img
                src={product.cover_image}
                alt={product.name}
                className="h-24 w-24 rounded-[1.2rem] object-cover transition group-hover:scale-105"
              />

              <span className="min-w-0 flex-1">
                <span className="mb-1 block text-xs font-bold text-violet-200">
                  {product.category}
                </span>

                <span className="block truncate text-lg font-black">
                  {product.name}
                </span>

                <span className="mt-1 block text-sm text-white/55">
                  LKR {Number(product.price || 0).toLocaleString()}
                </span>
              </span>

              <ArrowRight
                size={18}
                className="text-white/45 transition group-hover:translate-x-1 group-hover:text-white"
              />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

function getTimeLeft(targetDate, now) {
  const diff = Math.max(0, new Date(targetDate).getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

function getEventTime(eventOrDate) {
  const dateValue =
    typeof eventOrDate === "string" ? eventOrDate : eventOrDate?.event_date;

  if (!dateValue) return 0;

  const normalizedDate = String(dateValue).replace(" ", "T");
  const time = new Date(normalizedDate).getTime();

  return Number.isFinite(time) ? time : 0;
}

function isFutureEvent(event, now) {
  return getEventTime(event) > now.getTime();
}

function isEventOpen(event, now) {
  return getEventTime(event) > now.getTime();
}

function EventMotionCard({ event, now }) {
  const date = new Date(String(event.event_date).replace(" ", "T"));
  const canViewEvent = isFutureEvent(event, now);

  const content = (
    <>
      <div className="h-64 overflow-hidden">
        <img
          src={event.cover_image}
          alt={event.title}
          className={`h-full w-full object-cover transition duration-700 ${
            canViewEvent ? "group-hover/card:scale-110" : "grayscale"
          }`}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-6">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-pink-500/20 px-3 py-1 text-xs font-bold text-pink-100">
          <Clock size={13} />
          {date.toLocaleDateString()}{" "}
          {date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        <h3 className="mb-3 line-clamp-2 text-2xl font-black">{event.title}</h3>

        <p className="mb-5 flex items-center gap-2 line-clamp-1 text-sm text-white/65">
          <MapPin size={14} /> {event.location}
        </p>

        <span
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black transition ${
            canViewEvent
              ? "bg-white text-black group-hover/card:bg-pink-200"
              : "cursor-not-allowed bg-white/10 text-white/40"
          }`}
        >
          {canViewEvent ? "Book this event" : "Event closed"}{" "}
          <ArrowRight size={15} />
        </span>
      </div>
    </>
  );

  if (!canViewEvent) {
    return (
      <div
        data-event-card="true"
        className="relative min-w-[280px] snap-start overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] opacity-75 shadow-2xl sm:min-w-[340px]"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      data-event-card="true"
      to={`/events/${event.slug}`}
      className="group/card relative min-w-[280px] snap-start overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl transition duration-500 hover:-translate-y-2 hover:border-pink-300/40 hover:bg-white/[0.1] sm:min-w-[340px]"
    >
      {content}
    </Link>
  );
}

function EventCardWrapper({ canBookEvent, event, children }) {
  if (canBookEvent) {
    return (
      <Link
        to={`/events/${event.slug}`}
        className="group relative grid items-stretch overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-pink-500/20 via-white/[0.06] to-violet-500/20 shadow-2xl lg:grid-cols-[0.9fr_1.1fr]"
      >
        {children}
      </Link>
    );
  }

  return (
    <div className="relative grid items-stretch overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-pink-500/10 via-white/[0.04] to-violet-500/10 opacity-75 shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
      {children}
    </div>
  );
}

function getEventImageList(event) {
  const imageMap = new Map();

  const addImage = (
    image,
    fallbackAlt = event?.title || "ADRA event image",
  ) => {
    if (!image) return;

    const imageUrl =
      typeof image === "string"
        ? image
        : image.image_url || image.url || image.src || image.cover_image;

    if (!imageUrl || imageMap.has(imageUrl)) return;

    imageMap.set(imageUrl, {
      src: imageUrl,
      alt:
        typeof image === "string"
          ? fallbackAlt
          : image.alt || image.caption || fallbackAlt,
    });
  };

  addImage(event?.cover_image, event?.title);

  const possibleImageGroups = [
    event?.images,
    event?.event_images,
    event?.gallery,
    event?.gallery_images,
  ];

  possibleImageGroups.forEach((group) => {
    if (Array.isArray(group)) {
      group.forEach((image) => addImage(image, event?.title));
    }
  });

  return Array.from(imageMap.values());
}

function getImageShape(ratio) {
  if (!ratio) return "landscape";
  if (ratio < 0.85) return "portrait";
  if (ratio > 1.25) return "landscape";
  return "square";
}

function UpcomingEventHeroCard({ event, countdown, displayDate }) {
  const eventImages = useMemo(() => getEventImageList(event), [event]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const [imageRatios, setImageRatios] = useState({});

  const safeImages = eventImages.length
    ? eventImages
    : [
        {
          src: event.cover_image,
          alt: event.title,
        },
      ].filter((image) => image.src);

  const activeImage = safeImages[activeImageIndex % safeImages.length];
  const activeRatio = imageRatios[activeImageIndex];
  const imageShape = getImageShape(activeRatio);
  const eventPath = `/events/${event.slug || event.id}`;

  const gridClass =
    imageShape === "portrait"
      ? "lg:grid-cols-[0.78fr_1.22fr]"
      : imageShape === "square"
        ? "lg:grid-cols-[0.95fr_1.05fr]"
        : "lg:grid-cols-[1.08fr_0.92fr]";

  const imageBoxClass =
    imageShape === "portrait"
      ? "h-[34rem] sm:h-[38rem] lg:h-[36rem]"
      : imageShape === "square"
        ? "h-80 sm:h-[26rem] lg:h-[32rem]"
        : "h-72 sm:h-80 lg:h-[30rem]";

  const goToImage = (nextIndex, direction = 1) => {
    if (safeImages.length <= 1) return;

    setSlideDirection(direction);
    setActiveImageIndex((nextIndex + safeImages.length) % safeImages.length);
  };

  const goNext = () => goToImage(activeImageIndex + 1, 1);
  const goPrevious = () => goToImage(activeImageIndex - 1, -1);

  useEffect(() => {
    setActiveImageIndex(0);
    setSlideDirection(1);
    setImageRatios({});
  }, [event?.id, event?.slug]);

  useEffect(() => {
    if (safeImages.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setSlideDirection(1);
      setActiveImageIndex((current) => (current + 1) % safeImages.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [safeImages.length]);

  return (
    <div
      className={`relative grid items-stretch overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-pink-500/20 via-white/[0.06] to-violet-500/20 shadow-2xl transition-all duration-500 ${gridClass}`}
    >
      <div
        className={`relative overflow-hidden bg-black/45 transition-all duration-500 ${imageBoxClass}`}
      >
        <Link
          to={eventPath}
          aria-label={`View ${event.title}`}
          className="group/image absolute inset-0 block"
        >
          <AnimatePresence initial={false} custom={slideDirection} mode="sync">
            <motion.img
              key={`${activeImage?.src || "event-image"}-${activeImageIndex}`}
              custom={slideDirection}
              initial={{
                x: slideDirection > 0 ? "100%" : "-100%",
                opacity: 0.85,
              }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: slideDirection > 0 ? "-100%" : "100%", opacity: 0.85 }}
              transition={{ duration: 0.65, ease: [0.25, 1, 0.35, 1] }}
              src={activeImage?.src}
              alt={activeImage?.alt || event.title}
              onLoad={(event) => {
                const image = event.currentTarget;
                const ratio =
                  image.naturalWidth && image.naturalHeight
                    ? image.naturalWidth / image.naturalHeight
                    : 1.4;

                setImageRatios((current) => ({
                  ...current,
                  [activeImageIndex]: ratio,
                }));
              }}
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover/image:scale-110"
            />
          </AnimatePresence>
        </Link>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/35" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/65 to-transparent" />

        {safeImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrevious}
              aria-label="Previous event image"
              className="absolute left-4 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/55 text-white shadow-2xl backdrop-blur-xl transition hover:scale-105 hover:bg-white hover:text-black"
            >
              <ChevronLeft size={22} />
            </button>

            <button
              type="button"
              onClick={goNext}
              aria-label="Next event image"
              className="absolute right-4 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/55 text-white shadow-2xl backdrop-blur-xl transition hover:scale-105 hover:bg-white hover:text-black"
            >
              <ChevronRight size={22} />
            </button>

            <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/55 px-3 py-2 backdrop-blur-xl">
              {safeImages.map((image, index) => (
                <button
                  key={`${image.src}-${index}`}
                  type="button"
                  onClick={() =>
                    goToImage(index, index > activeImageIndex ? 1 : -1)
                  }
                  aria-label={`Show event image ${index + 1}`}
                  className={`h-2.5 rounded-full transition-all ${
                    index === activeImageIndex
                      ? "w-7 bg-white"
                      : "w-2.5 bg-white/35 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>

            <div className="absolute right-5 top-5 z-20 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-xs font-black text-white/85 backdrop-blur-xl">
              {activeImageIndex + 1} / {safeImages.length}
            </div>
          </>
        )}
      </div>

      <div className="p-7 md:p-10">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-pink-500/20 px-4 py-2 text-sm font-bold text-pink-100">
          <Calendar size={16} /> {displayDate.toLocaleDateString()}{" "}
          {displayDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        <h3 className="text-3xl font-black md:text-5xl">{event.title}</h3>

        <p className="mt-5 flex items-center gap-2 text-white/60">
          <MapPin size={17} /> {event.location}
        </p>

        <p className="mt-5 max-w-2xl text-sm leading-7 text-white/65">
          {event.promotional_message || event.description}
        </p>

        <div className="mt-8 grid grid-cols-4 gap-3">
          {[
            ["Days", countdown.days],
            ["Hours", countdown.hours],
            ["Minutes", countdown.minutes],
            ["Seconds", countdown.seconds],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center backdrop-blur-xl"
            >
              <p className="text-2xl font-black md:text-3xl">
                {String(value).padStart(2, "0")}
              </p>

              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/45">
                {label}
              </p>
            </div>
          ))}
        </div>

        <Link
          to={eventPath}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-black text-black transition hover:bg-pink-200"
        >
          Book this event <ArrowRight size={17} />
        </Link>
      </div>
    </div>
  );
}
function UpcomingEventsSection({ events }) {
  const [now, setNow] = useState(new Date());
  const eventRailRef = useRef(null);

  const sortedEvents = useMemo(() => {
    return [...(events.length ? events : fallbackEvents)]
      .filter((event) => event.event_date)
      .sort((a, b) => getEventTime(a) - getEventTime(b));
  }, [events]);

  const futureEvents = useMemo(() => {
    return sortedEvents.filter((event) => isFutureEvent(event, now));
  }, [sortedEvents, now]);

  const futureEvent = futureEvents[0];

  const countdown = futureEvent
    ? getTimeLeft(futureEvent.event_date, now)
    : { days: 0, hours: 0, minutes: 0, seconds: 0 };

  const carouselEvents = sortedEvents;

  const eventRailItems = carouselEvents;

  const sectionLabel = futureEvent ? "Upcoming events" : "Event memories";

  const sectionTitle = futureEvent
    ? "Next event with live countdown"
    : "Past event highlights";

  const sectionDescription = futureEvent
    ? "Future events can be viewed and booked. Closed events remain visible in the moving list below."
    : "There are no future events right now. Explore our completed events and memorable moments below.";

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const rail = eventRailRef.current;

    if (!rail || carouselEvents.length < 2) return undefined;

    const getStepSize = () => {
      const firstCard = rail.querySelector('[data-event-card="true"]');

      if (!firstCard) return 364;

      const cardWidth = firstCard.getBoundingClientRect().width;
      const gap = 24;

      return cardWidth + gap;
    };

    const timer = window.setInterval(() => {
      const stepSize = getStepSize();
      const maxScrollLeft = rail.scrollWidth - rail.clientWidth;

      if (maxScrollLeft <= 0) return;

      if (rail.scrollLeft >= maxScrollLeft - 10) {
        rail.scrollTo({
          left: 0,
          behavior: "smooth",
        });
        return;
      }

      rail.scrollTo({
        left: Math.min(rail.scrollLeft + stepSize, maxScrollLeft),
        behavior: "smooth",
      });
    }, 2800);

    return () => {
      window.clearInterval(timer);
    };
  }, [carouselEvents.length]);

  if (!sortedEvents.length) return null;

  const displayDate = futureEvent
    ? new Date(String(futureEvent.event_date).replace(" ", "T"))
    : null;

  return (
    <section className="section-padding py-20">
      <div className="container-max">
        <div className="mb-10">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-pink-300">
            {sectionLabel}
          </p>

          <h2 className="text-4xl font-black">{sectionTitle}</h2>

          <p className="mt-4 max-w-2xl text-white/55">{sectionDescription}</p>
        </div>

        {futureEvent && (
          <UpcomingEventHeroCard
            event={futureEvent}
            countdown={countdown}
            displayDate={displayDate}
          />
        )}

        <div
          className={`${
            futureEvent ? "mt-8" : "mt-0"
          } overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-4`}
        >
          <div
            ref={eventRailRef}
            className="no-scrollbar flex snap-x gap-6 overflow-x-auto scroll-smooth pb-2"
          >
            {eventRailItems.map((event, index) => (
              <EventMotionCard
                key={`${event.id || event.slug}-${index}`}
                event={event}
                now={now}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [services, setServices] = useState(fallbackServices);
  const [products, setProducts] = useState(fallbackProducts);
  const [events, setEvents] = useState(fallbackEvents);
  const [heroSetIndex, setHeroSetIndex] = useState(0);
  const [heroImageSets, setHeroImageSets] = useState(fallbackHeroImageSets);
  useEffect(() => {
    Promise.allSettled([
      api.get("/services"),
      api.get("/products"),
      api.get("/events"),
      api.get("/hero-image-grid"),
    ]).then((results) => {

      
      if (results[0].status === "fulfilled") setServices(results[0].value.data);
      if (results[1].status === "fulfilled") setProducts(results[1].value.data);
      if (results[2].status === "fulfilled") setEvents(results[2].value.data);
      if (results[3].status === "fulfilled") {
        setHeroImageSets(buildHeroImageSets(results[3].value.data));
      }
    });
  }, []);
  

  useEffect(() => {
    heroImageSets.flat().forEach((image) => {
      const preloadImage = new Image();
      preloadImage.src = image.src;
    });
  }, [heroImageSets]);

  useEffect(() => {
    if (heroImageSets.length <= 1) return undefined;

    const timer = setInterval(() => {
      setHeroSetIndex((current) => (current + 1) % heroImageSets.length);
    }, 5200);

    return () => clearInterval(timer);
  }, [heroImageSets.length]);

  const serviceRailItems = useMemo(() => {
    const list = services.length ? services : fallbackServices;
    return [...list, ...list];
  }, [services]);

  return (
    <>
      <section className="section-padding relative min-h-[calc(100vh-80px)] overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(236,72,153,.28),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,.30),transparent_40%)]">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-20"
          autoPlay
          muted
          loop
          playsInline
          poster="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1200&auto=format&fit=crop"
        >
          <source src={heroVideos[0]} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.1)_1px,transparent_1px)] [background-size:70px_70px]" />
        <div className="container-max relative grid min-h-[calc(100vh-80px)] items-center gap-12 py-16 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-pink-100">
              <Sparkles size={16} /> Premium photography for every memory
            </p>
            <TypewriterHeading />
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/60">
              Book weddings, convocations, portraits, albums, frames, product
              photography, and event coverage from one beautiful website.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link to="/contact" className="btn-primary">
                Request a service <ArrowRight size={18} />
              </Link>
              <Link to="/events" className="btn-secondary">
                Upcoming events
              </Link>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
              {[
                ["500+", "Moments"],
                ["50+", "Events"],
                ["4.9", "Rating"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-3xl border border-white/10 bg-white/10 p-5"
                >
                  <p className="text-2xl font-black">{value}</p>
                  <p className="text-sm text-white/50">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="absolute -left-8 top-12 z-10 rounded-3xl border border-white/10 bg-black/70 p-4 shadow-2xl backdrop-blur-xl">
              <Camera className="text-pink-300" />
              <p className="mt-2 text-sm font-bold">Creative Shoots</p>
            </div>
            <div className="absolute -right-3 bottom-20 z-10 rounded-3xl border border-white/10 bg-black/70 p-4 shadow-2xl backdrop-blur-xl">
              <Clock className="text-violet-300" />
              <p className="mt-2 text-sm font-bold">Fast Booking</p>
            </div>
            <HeroImageGrid
              imageSetIndex={heroSetIndex}
              imageSets={heroImageSets}
            />
          </motion.div>
        </div>
      </section>

      <section className="overflow-hidden border-y border-white/10 bg-white/[0.04] py-5">
        <div className="flex w-max animate-marquee gap-10 text-sm font-bold uppercase tracking-[0.3em] text-white/40">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="flex gap-10">
              <span>Wedding</span>
              <span>Convocation</span>
              <span>Portrait</span>
              <span>Frames</span>
              <span>Albums</span>
              <span>Events</span>
              <span>Studio</span>
              <span>Retouching</span>
            </span>
          ))}
        </div>
      </section>

      {/* events */}
      <UpcomingEventsSection events={events} />

      {/* services */}
      <section className="section-padding py-20">
        <div className="container-max">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-pink-300">
                Services
              </p>
              <h2 className="text-4xl font-black">Animated moving services</h2>
              <p className="mt-4 max-w-2xl text-white/55">
                The cards move from right to left, remain horizontally
                scrollable, and each card opens its detail page with a smooth
                hover transition.
              </p>
            </div>
            <Link to="/services" className="btn-secondary">
              View all services
            </Link>
          </div>
          <div className="no-scrollbar overflow-x-auto rounded-[2rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="service-rail flex w-max gap-6">
              {serviceRailItems.map((service, index) => (
                <ServiceMotionCard
                  key={`${service.id || service.slug}-${index}`}
                  service={service}
                  index={index}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* products */}
      <section className="section-padding bg-white/[0.03] py-20">
        <div className="container-max">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-violet-300">
                Products
              </p>
              <h2 className="text-4xl font-black">
                Interactive product showcase
              </h2>
              <p className="mt-4 max-w-2xl text-white/55">
                Instead of a normal grid, products appear as a premium product
                shelf. Click any product pack to preview it in the large
                spotlight.
              </p>
            </div>
            <Link to="/products" className="btn-secondary">
              View products
            </Link>
          </div>
          <ProductShowcase products={products} />
        </div>
      </section>

      <HomeReviewsSection />

      <section className="section-padding pb-20">
        <div className="container-max rounded-[2rem] border border-white/10 bg-gradient-to-r from-pink-500/20 to-violet-500/20 p-8 md:p-12">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <p className="mb-4 flex items-center gap-2 text-pink-200">
                <BadgeCheck size={18} /> Easy booking system
              </p>
              <h2 className="text-4xl font-black">Need a custom package?</h2>
              <p className="mt-4 text-white/60">
                Send your event details, phone number, and service type. The
                request will be saved in the admin dashboard and can also notify
                the admin phone number if Twilio is configured.
              </p>
            </div>
            <Link
              to="/contact"
              className="btn-primary justify-self-start md:justify-self-end"
            >
              Send request now <Play size={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
