import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleOff,
  ExternalLink,
  Eye,
  ImagePlus,
  Images,
  LayoutList,
  RefreshCcw,
  Save,
  Search,
  Table2,
  Trash2,
  Upload,
  X,
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

function StatusPill({ status }) {
  const isActive = status === "active";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${
        isActive
          ? "bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-300/20"
          : "bg-white/10 text-white/50 ring-1 ring-white/10"
      }`}
    >
      {isActive ? <CheckCircle2 size={14} /> : <CircleOff size={14} />}
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function ViewModeButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black transition ${
        active
          ? "bg-white text-black"
          : "bg-white/10 text-white/65 hover:bg-white/15 hover:text-white"
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );
}

export default function ManageHeroImageGrid() {
  const [images, setImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [replaceFiles, setReplaceFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [previewImage, setPreviewImage] = useState(null);

  const activeCount = useMemo(() => {
    return images.filter((image) => image.status === "active").length;
  }, [images]);

  const inactiveCount = useMemo(() => {
    return images.filter((image) => image.status !== "active").length;
  }, [images]);

  const filteredImages = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return images
      .filter((image) => {
        if (statusFilter !== "all" && image.status !== statusFilter) {
          return false;
        }

        if (!keyword) return true;

        const searchableText = [
          image.id,
          image.alt,
          image.status,
          image.image_url,
          String(image.sort_order ?? ""),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(keyword);
      })
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  }, [images, searchTerm, statusFilter]);

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
    if (!window.confirm("Delete this hero image?")) return;

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

  function openPreview(image) {
    const replacement = replaceFiles[image.id];

    setPreviewImage({
      ...image,
      preview_url: replacement?.previewUrl || image.image_url,
      hasReplacement: Boolean(replacement),
    });
  }

  function renderRowActions(image) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => openPreview(image)}
          className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-white/80 transition hover:bg-white/15 hover:text-white"
        >
          <Eye size={15} /> View
        </button>

        <button
          type="button"
          onClick={() => saveImage(image)}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-black transition hover:bg-pink-100 disabled:opacity-60"
        >
          <Save size={15} /> Save
        </button>

        <button
          type="button"
          onClick={() => deleteImage(image.id)}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-red-500/20 px-3 py-2 text-xs font-black text-red-100 transition hover:bg-red-500/30 disabled:opacity-60"
        >
          <Trash2 size={15} /> Delete
        </button>
      </div>
    );
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

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
            <p className="text-2xl font-black">{images.length}</p>
            <p className="text-sm text-white/45">Total images</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
            <p className="text-2xl font-black text-emerald-100">{activeCount}</p>
            <p className="text-sm text-white/45">Active images</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
            <p className="text-2xl font-black text-white/60">{inactiveCount}</p>
            <p className="text-sm text-white/45">Inactive images</p>
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

      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl">
        <div className="border-b border-white/10 bg-black/20 p-5 md:p-6">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <h2 className="text-2xl font-black">Current hero images</h2>
              <p className="mt-2 max-w-3xl text-sm text-white/45">
                Manage the Home page hero grid from one modern table. Lower sort
                order appears first. Inactive images stay saved but do not appear
                on the Home page.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative min-w-[240px]">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by alt, ID, URL..."
                  className="w-full rounded-full border border-white/10 bg-white/10 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-pink-300/60"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-pink-300/60"
              >
                <option value="all" className="text-black">
                  All status
                </option>
                <option value="active" className="text-black">
                  Active only
                </option>
                <option value="inactive" className="text-black">
                  Inactive only
                </option>
              </select>

              <div className="flex rounded-full border border-white/10 bg-black/25 p-1">
                <ViewModeButton
                  active={viewMode === "table"}
                  icon={Table2}
                  label="Table"
                  onClick={() => setViewMode("table")}
                />
                <ViewModeButton
                  active={viewMode === "list"}
                  icon={LayoutList}
                  label="List"
                  onClick={() => setViewMode("list")}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-bold text-white/45">
            <span className="rounded-full bg-white/10 px-3 py-1">
              Showing {filteredImages.length} of {images.length}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1">
              View mode: {viewMode === "table" ? "Modern table" : "List view"}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1">
              S3 path: hero-image-grid/
            </span>
          </div>
        </div>

        {loading ? (
          <p className="p-6 text-white/45">Loading hero images...</p>
        ) : images.length === 0 ? (
          <p className="m-5 rounded-2xl border border-white/10 bg-black/20 p-5 text-white/45">
            No dynamic hero images yet. The Home page will use the static
            fallback images until you upload images here.
          </p>
        ) : filteredImages.length === 0 ? (
          <p className="m-5 rounded-2xl border border-white/10 bg-black/20 p-5 text-white/45">
            No hero images match your search/filter.
          </p>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1160px] text-left">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.22em] text-white/35">
                <tr>
                  <th className="px-5 py-4">Preview</th>
                  <th className="px-5 py-4">Hero image details</th>
                  <th className="px-5 py-4">Sort</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Replace</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredImages.map((image) => {
                  const replacement = replaceFiles[image.id];

                  return (
                    <tr
                      key={image.id}
                      className="bg-black/10 transition hover:bg-white/[0.04]"
                    >
                      <td className="px-5 py-4 align-top">
                        <button
                          type="button"
                          onClick={() => openPreview(image)}
                          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/30"
                        >
                          <img
                            src={replacement?.previewUrl || image.image_url}
                            alt={image.alt || "Hero image"}
                            className="h-24 w-32 object-cover transition duration-500 group-hover:scale-110"
                          />
                          <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
                            <Eye size={20} />
                          </span>
                        </button>
                        {replacement && (
                          <p className="mt-2 rounded-full bg-violet-500/20 px-3 py-1 text-center text-[11px] font-black text-violet-100">
                            New image selected
                          </p>
                        )}
                      </td>

                      <td className="max-w-[420px] px-5 py-4 align-top">
                        <input
                          value={image.alt || ""}
                          onChange={(event) =>
                            updateImageField(image.id, "alt", event.target.value)
                          }
                          placeholder="Alt text"
                          className="input-field"
                        />
                        <p className="mt-2 truncate text-xs text-white/35">
                          ID: {image.id}
                        </p>
                        {image.image_url && (
                          <a
                            href={image.image_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-pink-200 hover:text-pink-100"
                          >
                            Open original <ExternalLink size={13} />
                          </a>
                        )}
                      </td>

                      <td className="px-5 py-4 align-top">
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
                          className="w-28 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-pink-300/60"
                        />
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="space-y-3">
                          <StatusPill status={image.status || "active"} />
                          <select
                            value={image.status || "active"}
                            onChange={(event) =>
                              updateImageField(
                                image.id,
                                "status",
                                event.target.value,
                              )
                            }
                            className="w-36 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-pink-300/60"
                          >
                            <option value="active" className="text-black">
                              Active
                            </option>
                            <option value="inactive" className="text-black">
                              Inactive
                            </option>
                          </select>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black transition hover:bg-white/15">
                          <ImagePlus size={17} /> Replace
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(event) => handleReplaceFile(image.id, event)}
                          />
                        </label>
                      </td>

                      <td className="px-5 py-4 align-top">
                        {renderRowActions(image)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-4 p-5">
            {filteredImages.map((image) => {
              const replacement = replaceFiles[image.id];

              return (
                <div
                  key={image.id}
                  className="grid gap-4 rounded-[1.7rem] border border-white/10 bg-black/25 p-4 lg:grid-cols-[190px_1fr_auto] lg:items-center"
                >
                  <button
                    type="button"
                    onClick={() => openPreview(image)}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/30"
                  >
                    <img
                      src={replacement?.previewUrl || image.image_url}
                      alt={image.alt || "Hero image"}
                      className="h-44 w-full object-cover transition duration-500 group-hover:scale-110 lg:w-[190px]"
                    />
                    <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
                      <Eye size={24} />
                    </span>
                  </button>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status={image.status || "active"} />
                      {replacement && (
                        <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-black text-violet-100">
                          New image selected
                        </span>
                      )}
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/45">
                        Sort #{image.sort_order || 0}
                      </span>
                    </div>

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

                    <div className="flex flex-wrap items-center gap-3 text-xs text-white/35">
                      <span>ID: {image.id}</span>
                      {image.image_url && (
                        <a
                          href={image.image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-pink-200 hover:text-pink-100"
                        >
                          Open original <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 lg:w-[210px]">
                    <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black transition hover:bg-white/15">
                      <ImagePlus size={17} /> Replace image
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(event) => handleReplaceFile(image.id, event)}
                      />
                    </label>
                    {renderRowActions(image)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {previewImage && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-xl">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#090910] shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 p-4 md:p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-pink-200">
                  Hero image preview
                </p>
                <h3 className="mt-1 line-clamp-1 text-xl font-black">
                  {previewImage.alt || "ADRA hero image"}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="rounded-full bg-white/10 p-3 transition hover:bg-white/15"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-5 p-4 md:grid-cols-[1fr_320px] md:p-5">
              <img
                src={previewImage.preview_url}
                alt={previewImage.alt || "Hero image preview"}
                className="max-h-[65vh] w-full rounded-[1.5rem] object-contain"
              />

              <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <StatusPill status={previewImage.status || "active"} />

                {previewImage.hasReplacement && (
                  <p className="rounded-2xl bg-violet-500/15 p-3 text-sm font-bold text-violet-100">
                    This preview shows the newly selected replacement image. Save
                    the row to upload it.
                  </p>
                )}

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/35">
                    Sort order
                  </p>
                  <p className="mt-1 text-lg font-black">
                    {previewImage.sort_order || 0}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/35">
                    Image ID
                  </p>
                  <p className="mt-1 break-all text-sm text-white/65">
                    {previewImage.id}
                  </p>
                </div>

                {previewImage.image_url && (
                  <a
                    href={previewImage.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-black transition hover:bg-pink-100"
                  >
                    Open original image <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
