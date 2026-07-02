import { useEffect, useMemo, useState } from "react";
import {
  ImagePlus,
  Images,
  RefreshCcw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";

import api from "../../lib/api.js";
import { compressImageFile } from "../../lib/imageCompression.js";

const MAX_UPLOAD_COUNT = 8;

function makePreviewItem(file) {
  return {
    id: `new_${crypto.randomUUID()}`,
    file,
    previewUrl: URL.createObjectURL(file),
    alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
  };
}

async function compressForHeroGrid(file) {
  return compressImageFile(file, {
    targetBytes: 420 * 1024,
    maxBytes: 700 * 1024,
    maxWidth: 1600,
    maxHeight: 1600,
    startQuality: 0.8,
    minQuality: 0.48,
  });
}

export default function ManageHeroImageGrid() {
  const [images, setImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [replaceFiles, setReplaceFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const activeCount = useMemo(() => {
    return images.filter((image) => image.status === "active").length;
  }, [images]);

  async function loadImages() {
    setLoading(true);
    setMessage("");

    try {
      const res = await api.get("/hero-image-grid/admin");
      setImages(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Failed to load hero image grid.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadImages();
  }, []);

  useEffect(() => {
    return () => {
      newFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      Object.values(replaceFiles).forEach((item) => {
        if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [newFiles, replaceFiles]);

  function handleNewFiles(event) {
    const selectedFiles = Array.from(event.target.files || []);

    if (!selectedFiles.length) return;

    const availableSlots = Math.max(0, MAX_UPLOAD_COUNT - newFiles.length);
    const acceptedFiles = selectedFiles.slice(0, availableSlots);

    if (selectedFiles.length > availableSlots) {
      setMessage(`Maximum ${MAX_UPLOAD_COUNT} images can be uploaded at once.`);
    }

    setNewFiles((current) => [...current, ...acceptedFiles.map(makePreviewItem)]);
    event.target.value = "";
  }

  function removeNewFile(id) {
    setNewFiles((current) => {
      const removed = current.find((item) => item.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  function updateNewFileAlt(id, alt) {
    setNewFiles((current) =>
      current.map((item) => (item.id === id ? { ...item, alt } : item)),
    );
  }

  async function uploadNewImages() {
    if (!newFiles.length) {
      setMessage("Please select at least one image first.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const formData = new FormData();
      const captions = [];

      for (const item of newFiles) {
        const compressedFile = await compressForHeroGrid(item.file);
        formData.append("new_images", compressedFile);
        captions.push(item.alt || "ADRA hero image");
      }

      formData.append("new_image_captions", JSON.stringify(captions));
      formData.append("sort_order", String(images.length + 1));
      formData.append("status", "active");

      await api.post("/hero-image-grid", formData);

      newFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setNewFiles([]);
      setMessage("Hero image grid images uploaded successfully.");
      await loadImages();
    } catch (error) {
      setMessage(
        error.response?.data?.message || error.message || "Upload failed.",
      );
    } finally {
      setSaving(false);
    }
  }

  function updateImageField(id, field, value) {
    setImages((current) =>
      current.map((image) =>
        image.id === id ? { ...image, [field]: value } : image,
      ),
    );
  }

  function handleReplaceFile(id, event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setReplaceFiles((current) => {
      const oldItem = current[id];
      if (oldItem?.previewUrl) URL.revokeObjectURL(oldItem.previewUrl);

      return {
        ...current,
        [id]: {
          file,
          previewUrl: URL.createObjectURL(file),
        },
      };
    });

    event.target.value = "";
  }

  async function saveImage(image) {
    setSaving(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("alt", image.alt || "ADRA hero image");
      formData.append("sort_order", String(image.sort_order || 0));
      formData.append("status", image.status || "active");
      formData.append(
        "new_image_captions",
        JSON.stringify([image.alt || "ADRA hero image"]),
      );

      const replacement = replaceFiles[image.id];

      if (replacement?.file) {
        const compressedFile = await compressForHeroGrid(replacement.file);
        formData.append("new_images", compressedFile);
      }

      await api.put(`/hero-image-grid/${image.id}`, formData);

      if (replacement?.previewUrl) URL.revokeObjectURL(replacement.previewUrl);
      setReplaceFiles((current) => {
        const updated = { ...current };
        delete updated[image.id];
        return updated;
      });

      setMessage("Hero image updated successfully.");
      await loadImages();
    } catch (error) {
      setMessage(
        error.response?.data?.message || error.message || "Update failed.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteImage(id) {
    if (!confirm("Delete this hero image?")) return;

    setSaving(true);
    setMessage("");

    try {
      await api.delete(`/hero-image-grid/${id}`);
      setMessage("Hero image deleted successfully.");
      await loadImages();
    } catch (error) {
      setMessage(
        error.response?.data?.message || error.message || "Delete failed.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-pink-500/20 to-violet-500/10 p-6 shadow-2xl md:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-pink-100">
              <Images size={16} /> Home hero image grid
            </p>
            <h1 className="text-4xl font-black">Manage Hero Images</h1>
            <p className="mt-3 max-w-3xl text-white/55">
              These images appear in the animated image grid on the Home page.
              Uploads are stored in the S3 folder hero-image-grid and active
              images are shown publicly.
            </p>
          </div>

          <button
            type="button"
            onClick={loadImages}
            className="btn-secondary"
            disabled={loading || saving}
          >
            <RefreshCcw size={18} /> Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
            <p className="text-2xl font-black">{images.length}</p>
            <p className="text-sm text-white/45">Total images</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
            <p className="text-2xl font-black">{activeCount}</p>
            <p className="text-sm text-white/45">Active images</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
            <p className="text-2xl font-black">4</p>
            <p className="text-sm text-white/45">Images per home grid set</p>
          </div>
        </div>
      </div>

      {message && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm font-bold text-white/75">
          {message}
        </div>
      )}

      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 md:p-6">
        <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-black">Upload new images</h2>
            <p className="mt-2 text-sm text-white/45">
              Recommended: upload 4, 8, or 12 images so the grid animation stays
              balanced.
            </p>
          </div>

          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-black transition hover:bg-white/15">
            <ImagePlus size={18} /> Select images
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleNewFiles}
            />
          </label>
        </div>

        {newFiles.length > 0 && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {newFiles.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-black/25"
                >
                  <img
                    src={item.previewUrl}
                    alt="New hero preview"
                    className="h-44 w-full object-cover"
                  />
                  <div className="space-y-3 p-3">
                    <input
                      value={item.alt}
                      onChange={(event) =>
                        updateNewFileAlt(item.id, event.target.value)
                      }
                      placeholder="Alt text"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewFile(item.id)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/20 px-3 py-2 text-xs font-bold text-red-100 hover:bg-red-500/30"
                    >
                      <Trash2 size={15} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={uploadNewImages}
              disabled={saving}
              className="btn-primary"
            >
              <Upload size={18} /> {saving ? "Uploading..." : "Upload to Hero Grid"}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 md:p-6">
        <div className="mb-5">
          <h2 className="text-2xl font-black">Current hero images</h2>
          <p className="mt-2 text-sm text-white/45">
            Lower sort order appears first. Inactive images stay saved but do not
            appear on the Home page.
          </p>
        </div>

        {loading ? (
          <p className="text-white/45">Loading hero images...</p>
        ) : images.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-black/20 p-5 text-white/45">
            No dynamic hero images yet. The Home page will use the static
            fallback images until you upload images here.
          </p>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {images.map((image) => {
              const replacement = replaceFiles[image.id];

              return (
                <div
                  key={image.id}
                  className="grid gap-4 rounded-[1.7rem] border border-white/10 bg-black/25 p-4 sm:grid-cols-[180px_1fr]"
                >
                  <div>
                    <img
                      src={replacement?.previewUrl || image.image_url}
                      alt={image.alt || "Hero image"}
                      className="h-44 w-full rounded-2xl object-cover sm:w-44"
                    />
                    {replacement && (
                      <p className="mt-2 rounded-full bg-violet-500/20 px-3 py-1 text-center text-xs font-bold text-violet-100">
                        New image selected
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <input
                      value={image.alt || ""}
                      onChange={(event) =>
                        updateImageField(image.id, "alt", event.target.value)
                      }
                      placeholder="Alt text"
                      className="input-field"
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        value={image.sort_order ?? ""}
                        onChange={(event) =>
                          updateImageField(
                            image.id,
                            "sort_order",
                            event.target.value,
                          )
                        }
                        type="number"
                        placeholder="Sort order"
                        className="input-field"
                      />

                      <select
                        value={image.status || "active"}
                        onChange={(event) =>
                          updateImageField(image.id, "status", event.target.value)
                        }
                        className="input-field"
                      >
                        <option value="active" className="text-black">
                          Active
                        </option>
                        <option value="inactive" className="text-black">
                          Inactive
                        </option>
                      </select>
                    </div>

                    <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black transition hover:bg-white/15">
                      <ImagePlus size={17} /> Replace image
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(event) => handleReplaceFile(image.id, event)}
                      />
                    </label>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => saveImage(image)}
                        disabled={saving}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-black transition hover:bg-pink-100"
                      >
                        <Save size={17} /> Save
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteImage(image.id)}
                        disabled={saving}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-500/20 px-4 py-3 text-sm font-black text-red-100 transition hover:bg-red-500/30"
                      >
                        <Trash2 size={17} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
