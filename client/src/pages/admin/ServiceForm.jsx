import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, X } from "lucide-react";

import api from "../../lib/api.js";
import MultiImageInput from "../../components/MultiImageInput.jsx";
import { appendImagesToFormData } from "../../lib/buildResourceFormData.js";
import {
  compressImagesForUpload,
  formatFileSize,
  getTotalUploadSize,
  getUploadFilesFromImages,
} from "../../lib/imageCompression.js";

const emptyService = {
  title: "",
  category: "",
  short_description: "",
  description: "",
  price_from: "",
  is_featured: false,
  status: "active",
};

const SERVICE_CATEGORIES = [
  "Photography",
  "Videography",
  "Photo Editing",
  "Photo Framing",
  "Album Design",
  "Convocation",
  "Wedding",
  "Birthday",
  "Family",
  "Studio",
  "Website Creating",
  "Software Work",
  "Other",
];

const SERVICE_IMAGE_TARGET_BYTES = 180 * 1024; // Aim around 180 KB
const SERVICE_IMAGE_MAX_BYTES = 200 * 1024; // Hard limit: 200 KB per image
const SERVICE_TOTAL_UPLOAD_LIMIT = 2 * 1024 * 1024; // 2 MB total safety limit

function normalizeExistingImages(serviceItem) {
  const serviceImages = Array.isArray(serviceItem.images)
    ? serviceItem.images
    : [];

  const images = serviceImages
    .map((image, index) => ({
      id: image.id || `existing_${index}`,
      image_url: image.image_url || image.url || "",
      caption: image.caption || "",
      isNew: false,
    }))
    .filter((image) => image.image_url);

  if (!images.length && serviceItem.cover_image) {
    images.push({
      id: "existing_cover_image",
      image_url: serviceItem.cover_image,
      caption: "",
      isNew: false,
    });
  }

  return images;
}

export default function ServiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyService);
  const [images, setImages] = useState([]);
  const [coverImage, setCoverImage] = useState(null);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isEdit = Boolean(id);

  useEffect(() => {
    if (!id) return;

    api
      .get(`/services/${id}`)
      .then((res) => {
        const item = res.data;

        setForm({
          title: item.title || "",
          category: item.category || "",
          short_description: item.short_description || "",
          description: item.description || "",
          price_from: item.price_from || "",
          is_featured: Boolean(item.is_featured),
          status: item.status || "active",
        });

        const existingImages = normalizeExistingImages(item);
        setImages(existingImages);

        const selectedCover =
          existingImages.find(
            (image) => image.image_url === item.cover_image,
          ) ||
          existingImages[0] ||
          null;

        setCoverImage(selectedCover);
      })
      .catch(() => {
        setMessage("Failed to load service.");
      });
  }, [id]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveService(event) {
    event.preventDefault();
    setMessage("");
    setIsSaving(true);

    try {
      const newUploadFiles = getUploadFilesFromImages(images);

      if (newUploadFiles.length > 8) {
        setMessage("Please upload maximum 8 service images at once.");
        setIsSaving(false);
        return;
      }

      const compressedImages = await compressImagesForUpload(images, {
        targetBytes: SERVICE_IMAGE_TARGET_BYTES,
        maxBytes: SERVICE_IMAGE_MAX_BYTES,
        maxWidth: 1200,
        maxHeight: 1200,
        minLongestSide: 480,
        startQuality: 0.72,
        minQuality: 0.28,
        emergencyMinQuality: 0.18,
        resizeStep: 0.82,
      });

      const oversizedFiles = getUploadFilesFromImages(compressedImages).filter(
        (file) => file.size > SERVICE_IMAGE_MAX_BYTES,
      );

      if (oversizedFiles.length) {
        setMessage(
          `Some images could not be compressed below 200 KB: ${oversizedFiles
            .map((file) => `${file.name} (${formatFileSize(file.size)})`)
            .join(", ")}. Please choose smaller images.`,
        );
        setIsSaving(false);
        return;
      }

      const totalUploadSize = getTotalUploadSize(compressedImages);

      if (totalUploadSize > SERVICE_TOTAL_UPLOAD_LIMIT) {
        setMessage(
          `Images are still too large after compression. Current total size: ${formatFileSize(
            totalUploadSize,
          )}. Please upload fewer images.`,
        );
        setIsSaving(false);
        return;
      }

      const compressedCoverImage = coverImage
        ? compressedImages.find((image) => image.id === coverImage.id) ||
          coverImage
        : null;

      const formData = new FormData();

      formData.append("title", form.title);
      formData.append("category", form.category || "");
      formData.append("short_description", form.short_description || "");
      formData.append("description", form.description || "");
      formData.append("price_from", form.price_from || 0);
      formData.append("is_featured", String(Boolean(form.is_featured)));
      formData.append("status", form.status || "active");

      appendImagesToFormData(formData, compressedImages, compressedCoverImage);

      if (isEdit) {
        await api.put(`/services/${id}`, formData);
        setMessage("Service updated successfully.");
      } else {
        await api.post("/services", formData);
        setMessage("Service created successfully.");
      }

      navigate("/admin/services");
    } catch (error) {
      setMessage(error.response?.data?.message || "Save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-pink-500/20 to-rose-500/10 p-6 shadow-2xl">
        <h1 className="text-4xl font-black">
          {isEdit ? "Edit Service" : "Add Service"}
        </h1>

        <p className="mt-3 text-white/55">
          Service images are compressed below 200 KB before upload, then saved
          to S3 only after clicking {isEdit ? "Update Service" : "Create Service"}.
        </p>
      </div>

      <form
        onSubmit={saveService}
        className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="input-field"
            placeholder="Service title"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            required
          />

          <select
            className="input-field"
            value={form.category}
            onChange={(e) => updateField("category", e.target.value)}
          >
            <option value="" className="text-black">
              Select category
            </option>

            {SERVICE_CATEGORIES.map((category) => (
              <option key={category} value={category} className="text-black">
                {category}
              </option>
            ))}
          </select>

          <input
            className="input-field"
            placeholder="Price from"
            type="number"
            value={form.price_from}
            onChange={(e) => updateField("price_from", e.target.value)}
          />

          <select
            className="input-field"
            value={form.status}
            onChange={(e) => updateField("status", e.target.value)}
          >
            <option value="active" className="text-black">
              Active
            </option>
            <option value="inactive" className="text-black">
              Inactive
            </option>
          </select>

          <input
            className="input-field md:col-span-2"
            placeholder="Short description"
            value={form.short_description}
            onChange={(e) => updateField("short_description", e.target.value)}
          />

          <textarea
            className="input-field min-h-32 md:col-span-2"
            placeholder="Full description"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
          />

          <label className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/70">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => updateField("is_featured", e.target.checked)}
            />
            Featured service
          </label>

          <div className="md:col-span-2">
            <MultiImageInput
              value={images}
              onChange={setImages}
              coverImage={coverImage}
              onCoverChange={setCoverImage}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button className="btn-primary" disabled={isSaving}>
            <Save size={18} />
            {isSaving
              ? "Saving..."
              : isEdit
                ? "Update Service"
                : "Create Service"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/services")}
            className="btn-secondary"
            disabled={isSaving}
          >
            <X size={18} /> Cancel
          </button>
        </div>

        {message && <p className="mt-4 text-sm text-pink-200">{message}</p>}
      </form>
    </div>
  );
}
