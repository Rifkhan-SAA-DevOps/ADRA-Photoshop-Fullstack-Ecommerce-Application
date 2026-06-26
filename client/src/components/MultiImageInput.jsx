import { useEffect, useMemo, useRef } from "react";
import { ImagePlus, Star, Trash2 } from "lucide-react";

function makeLocalImage(file) {
  return {
    id: `local_${crypto.randomUUID()}`,
    file,
    image_url: URL.createObjectURL(file),
    caption: "",
    isNew: true,
  };
}

export default function MultiImageInput({
  value = [],
  onChange,
  coverImage,
  onCoverChange,
}) {
  const localUrlsRef = useRef(new Set());

  const images = useMemo(() => {
    return Array.isArray(value) ? value : [];
  }, [value]);

  useEffect(() => {
    images.forEach((image) => {
      if (image.isNew && image.image_url?.startsWith("blob:")) {
        localUrlsRef.current.add(image.image_url);
      }
    });
  }, [images]);

  useEffect(() => {
    return () => {
      localUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });

      localUrlsRef.current.clear();
    };
  }, []);

  function handleFiles(event) {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const newImages = files.map(makeLocalImage);
    const updatedImages = [...images, ...newImages];

    newImages.forEach((image) => {
      localUrlsRef.current.add(image.image_url);
    });

    onChange(updatedImages);

    if (!coverImage && newImages[0]) {
      onCoverChange(newImages[0]);
    }

    event.target.value = "";
  }

  function updateCaption(imageId, caption) {
    onChange(
      images.map((image) =>
        image.id === imageId ? { ...image, caption } : image,
      ),
    );
  }

  function removeImage(imageId) {
    const removedImage = images.find((image) => image.id === imageId);
    const updatedImages = images.filter((image) => image.id !== imageId);

    if (removedImage?.isNew && removedImage.image_url?.startsWith("blob:")) {
      URL.revokeObjectURL(removedImage.image_url);
      localUrlsRef.current.delete(removedImage.image_url);
    }

    onChange(updatedImages);

    if (coverImage?.id === imageId) {
      onCoverChange(updatedImages[0] || null);
    }
  }

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-sm font-bold text-white/70 transition hover:bg-white/10">
        <ImagePlus size={20} />
        Select images

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFiles}
        />
      </label>

      {images.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => {
            const isCover = coverImage?.id === image.id;

            return (
              <div
                key={image.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
              >
                <div className="relative h-44">
                  <img
                    src={image.image_url}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />

                  {isCover && (
                    <span className="absolute left-3 top-3 rounded-full bg-pink-500 px-3 py-1 text-xs font-black text-white">
                      Cover
                    </span>
                  )}

                  {image.isNew && (
                    <span className="absolute right-3 top-3 rounded-full bg-violet-500 px-3 py-1 text-xs font-black text-white">
                      New
                    </span>
                  )}
                </div>

                <div className="space-y-3 p-3">
                  <input
                    value={image.caption || ""}
                    onChange={(event) =>
                      updateCaption(image.id, event.target.value)
                    }
                    placeholder="Caption"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onCoverChange(image)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15"
                    >
                      <Star size={14} />
                      Set Cover
                    </button>

                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="rounded-xl bg-red-500/20 px-3 py-2 text-red-100 hover:bg-red-500/30"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-white/40">
        Images are previewed only. New images upload to S3 only after clicking
        Create or Update. Removed existing images are deleted from S3 after
        Update.
      </p>
    </div>
  );
}