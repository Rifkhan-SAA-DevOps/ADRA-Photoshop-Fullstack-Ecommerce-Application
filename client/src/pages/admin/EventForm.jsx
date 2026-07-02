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

const emptyEvent = {
  title: "",
  category: "",
  event_date: "",
  location: "",
  promotional_message: "",
  description: "",
  status: "upcoming",
};

const EVENT_CATEGORIES = [
  "Wedding",
  "Convocation",
  "Birthday",
  "School",
  "Business",
  "Family",
  "Friends",
  "Studio",
  "Other",
];

const EVENT_IMAGE_TARGET_BYTES = 180 * 1024; // Aim around 180 KB
const EVENT_IMAGE_MAX_BYTES = 200 * 1024; // Hard limit: 200 KB per image
const EVENT_TOTAL_UPLOAD_LIMIT = 2 * 1024 * 1024; // 2 MB total safety limit

function normalizeExistingImages(eventItem) {
  const eventImages = Array.isArray(eventItem.images) ? eventItem.images : [];

  const images = eventImages
    .map((image, index) => ({
      id: image.id || `existing_${index}`,
      image_url: image.image_url || image.url || "",
      caption: image.caption || "",
      isNew: false,
    }))
    .filter((image) => image.image_url);

  if (!images.length && eventItem.cover_image) {
    images.push({
      id: "existing_cover_image",
      image_url: eventItem.cover_image,
      caption: "",
      isNew: false,
    });
  }

  return images;
}

function formatDateForInput(value) {
  if (!value) return "";

  try {
    const date = new Date(String(value).replace(" ", "T"));

    if (Number.isNaN(date.getTime())) return "";

    return date.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

function formatDateForApi(value) {
  if (!value) return "";
  return `${value.replace("T", " ")}:00`;
}

export default function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyEvent);
  const [images, setImages] = useState([]);
  const [coverImage, setCoverImage] = useState(null);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isEdit = Boolean(id);

  useEffect(() => {
    if (!id) return;

    api
      .get(`/events/${id}`)
      .then((res) => {
        const item = res.data;

        setForm({
          title: item.title || "",
          category: item.category || "",
          event_date: formatDateForInput(item.event_date),
          location: item.location || "",
          promotional_message: item.promotional_message || "",
          description: item.description || "",
          status: item.status || "upcoming",
        });

        const existingImages = normalizeExistingImages(item);
        setImages(existingImages);

        const selectedCover =
          existingImages.find((image) => image.image_url === item.cover_image) ||
          existingImages[0] ||
          null;

        setCoverImage(selectedCover);
      })
      .catch(() => {
        setMessage("Failed to load event.");
      });
  }, [id]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveEvent(event) {
    event.preventDefault();
    setMessage("");
    setIsSaving(true);

    try {
      const newUploadFiles = getUploadFilesFromImages(images);

      if (newUploadFiles.length > 8) {
        setMessage("Please upload maximum 8 event images at once.");
        setIsSaving(false);
        return;
      }

      const compressedImages = await compressImagesForUpload(images, {
        targetBytes: EVENT_IMAGE_TARGET_BYTES,
        maxBytes: EVENT_IMAGE_MAX_BYTES,
        maxWidth: 1200,
        maxHeight: 1200,
        minLongestSide: 480,
        startQuality: 0.72,
        minQuality: 0.28,
        emergencyMinQuality: 0.18,
        resizeStep: 0.82,
      });

      const oversizedFiles = getUploadFilesFromImages(compressedImages).filter(
        (file) => file.size > EVENT_IMAGE_MAX_BYTES,
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

      if (totalUploadSize > EVENT_TOTAL_UPLOAD_LIMIT) {
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
      formData.append("event_date", formatDateForApi(form.event_date));
      formData.append("location", form.location || "");
      formData.append("promotional_message", form.promotional_message || "");
      formData.append("description", form.description || "");
      formData.append("status", form.status || "upcoming");

      appendImagesToFormData(formData, compressedImages, compressedCoverImage);

      if (isEdit) {
        await api.put(`/events/${id}`, formData);
        setMessage("Event updated successfully.");
      } else {
        await api.post("/events", formData);
        setMessage("Event created successfully.");
      }

      navigate("/admin/events");
    } catch (error) {
      setMessage(error.response?.data?.message || "Save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 p-6 shadow-2xl">
        <h1 className="text-4xl font-black">
          {isEdit ? "Edit Event" : "Add Event"}
        </h1>

        <p className="mt-3 text-white/55">
          Event images are compressed below 200 KB before upload, then saved to
          S3 only after clicking {isEdit ? "Update Event" : "Create Event"}.
        </p>
      </div>

      <form
        onSubmit={saveEvent}
        className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="input-field"
            placeholder="Event title"
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

            {EVENT_CATEGORIES.map((category) => (
              <option key={category} value={category} className="text-black">
                {category}
              </option>
            ))}
          </select>

          <input
            className="input-field"
            type="datetime-local"
            value={form.event_date}
            onChange={(e) => updateField("event_date", e.target.value)}
            required
          />

          <input
            className="input-field"
            placeholder="Location"
            value={form.location}
            onChange={(e) => updateField("location", e.target.value)}
          />

          <select
            className="input-field"
            value={form.status}
            onChange={(e) => updateField("status", e.target.value)}
          >
            <option value="upcoming" className="text-black">
              Upcoming
            </option>
            <option value="completed" className="text-black">
              Completed
            </option>
            <option value="cancelled" className="text-black">
              Cancelled
            </option>
          </select>

          <input
            className="input-field"
            placeholder="Promotional message"
            value={form.promotional_message}
            onChange={(e) => updateField("promotional_message", e.target.value)}
          />

          <textarea
            className="input-field min-h-32 md:col-span-2"
            placeholder="Description"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
          />

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
            {isSaving ? "Saving..." : isEdit ? "Update Event" : "Create Event"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/events")}
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
