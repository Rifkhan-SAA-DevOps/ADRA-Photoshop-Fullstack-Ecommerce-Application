import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Filter, Images, X } from "lucide-react";

import PageHero from "../components/PageHero.jsx";
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
import ifthar from "./../docs/images/ifthar.png";
import Portrait_1 from "./../docs/images/Portrait_1.png";
import jersey from "./../docs/images/jersey.png";
const LOAD_COUNT = 6;

const images = [
  {
    src: wedding_couples,
    title: "Elegant Wedding Moment",
    category: "Wedding",
    height: "h-[430px]",
  },
  {
    src: convercation,
    title: "Convocation Portrait",
    category: "Convocation",
    height: "h-[300px]",
  },
  {
    src: Portrait,
    title: "Studio Portrait",
    category: "Portrait",
    height: "h-[380px]",
  },
  {
    src: camera_work,
    title: "Camera Story",
    category: "Studio",
    height: "h-[280px]",
  },

  {
    src: photo_album,
    title: "Premium Album",
    category: "Albums",
    height: "h-[300px]",
  },

  {
    src: videography,
    title: "Videography Mood",
    category: "Video",
    height: "h-[360px]",
  },
  {
    src: Wedding_ceremony,
    title: "Wedding Ceremony",
    category: "Wedding",
    height: "h-[320px]",
  },
  {
    src: website,
    title: "Website",
    category: "Website",
    height: "h-[390px]",
  },

  {
    src: video_editing,
    title: "Video Editing",
    category: "Editing",
    height: "h-[300px]",
  },
  {
    src: photo_editing,
    title: "Photo Editing",
    category: "Editing",
    height: "h-[300px]",
  },
  {
    src: jersey,
    title: "Jersey",
    category: "Products",
    height: "h-[360px]",
  },
  {
    src: wall_frame,
    title: "Wall Frame Display",
    category: "Frames",
    height: "h-[420px]",
  },
  {
    src: ifthar,
    title: "Ifthar Event",
    category: "Events",
    height: "h-[330px]",
  },
  {
    src: birthday_event,
    title: "Birthday Event",
    category: "Events",
    height: "h-[390px]",
  },
];

export default function Gallery() {
  const [visibleCount, setVisibleCount] = useState(LOAD_COUNT);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState(null);

  const categories = useMemo(() => {
    return ["All", ...new Set(images.map((image) => image.category))];
  }, []);

  const filteredImages = useMemo(() => {
    if (selectedCategory === "All") return images;

    return images.filter((image) => image.category === selectedCategory);
  }, [selectedCategory]);

  const visibleImages = useMemo(() => {
    return filteredImages.slice(0, visibleCount);
  }, [filteredImages, visibleCount]);

  const hasMore = visibleCount < filteredImages.length;
  const shouldStartFromLeft =
    selectedCategory !== "All" && filteredImages.length <= 2;
  function showMore() {
    setVisibleCount((current) =>
      Math.min(current + LOAD_COUNT, filteredImages.length),
    );
  }

  function changeCategory(category) {
    setSelectedCategory(category);
    setVisibleCount(LOAD_COUNT);
  }

  return (
    <>
      <PageHero
        title="Gallery"
        subtitle="A creative gallery section for studio, event, wedding, portrait, and convocation photography."
      />

      <section className="section-padding py-16">
        <div className="container-max">
          <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="mb-5 flex items-center gap-2">
              <Filter size={18} className="text-pink-300" />
              <h3 className="text-xl font-black">Filter gallery</h3>
            </div>

            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => changeCategory(category)}
                  className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                    selectedCategory === category
                      ? "bg-pink-300 text-black"
                      : "bg-white/10 text-white hover:bg-white/15"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div
            dir={shouldStartFromLeft ? "ltr" : "rtl"}
            className="columns-1 gap-5 sm:columns-2 lg:columns-3"
          >
            <AnimatePresence>
              {visibleImages.map((image, index) => (
                <motion.button
                  dir="ltr"
                  key={image.src}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  initial={{ opacity: 0, y: 28, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.96 }}
                  transition={{
                    duration: 0.45,
                    delay: (index % LOAD_COUNT) * 0.04,
                  }}
                  className="group relative mb-5 block w-full break-inside-avoid overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] text-left shadow-2xl transition duration-700 hover:scale-[1.015] hover:border-pink-300/40"
                >
                  <div className={`${image.height} overflow-hidden`}>
                    <img
                      src={image.src}
                      alt={image.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-110 group-hover:brightness-110"
                    />
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 transition group-hover:opacity-100" />

                  <div className="absolute left-5 top-5 rounded-full bg-black/45 px-4 py-2 text-xs font-black text-white/80 backdrop-blur-xl">
                    {image.category}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="mb-2 flex items-center gap-2 text-sm font-bold text-pink-100">
                      <Camera size={15} /> Creative shot
                    </p>

                    <h3 className="text-2xl font-black text-white">
                      {image.title}
                    </h3>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={showMore}
                className="btn-secondary"
              >
                <Images size={18} /> Show more images
              </button>
            </div>
          )}

          {!visibleImages.length && (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center">
              <p className="text-xl font-black">No images found</p>
              <p className="mt-3 text-white/50">
                Try another gallery category.
              </p>
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-black/60 text-white backdrop-blur-xl transition hover:bg-white hover:text-black"
              >
                <X size={20} />
              </button>

              <img
                src={selectedImage.src}
                alt={selectedImage.title}
                className="max-h-[78vh] w-full object-cover"
              />

              <div className="bg-black p-6">
                <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-pink-300">
                  {selectedImage.category}
                </p>

                <h3 className="text-3xl font-black text-white">
                  {selectedImage.title}
                </h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
