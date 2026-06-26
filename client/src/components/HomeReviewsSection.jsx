import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Star,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../lib/api.js";

const CATEGORIES = ["all", "product", "service", "event", "other"];
const PAGE_SIZE = 10;

function Stars({ rating = 5 }) {
  return (
    <div className="flex items-center gap-1 text-yellow-300">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={star <= Number(rating || 0) ? "fill-current" : ""}
        />
      ))}
    </div>
  );
}

function shortText(text = "", max = 90) {
  const clean = String(text || "").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max)}...`;
}

export default function HomeReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedReview, setSelectedReview] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    category: "product",
    rating: 5,
    comment: "",
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [formErrors, setFormErrors] = useState({});
  const [message, setMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadReviews() {
    const url =
      categoryFilter === "all"
        ? "/reviews/public?limit=100"
        : `/reviews/public?limit=100&category=${categoryFilter}`;

    const res = await api.get(url);
    setReviews(Array.isArray(res.data) ? res.data : []);
  }

  useEffect(() => {
    setCurrentPage(1);
    loadReviews().catch(() => {});
  }, [categoryFilter]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [imagePreviews]);

  const totalPages = Math.max(1, Math.ceil(reviews.length / PAGE_SIZE));

  const visibleReviews = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return reviews.slice(start, start + PAGE_SIZE);
  }, [reviews, currentPage]);

  const selectedImages = selectedReview?.images || [];
  const selectedImage = selectedImages[carouselIndex];

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFormErrors((current) => ({
      ...current,
      [field]: "",
    }));

    setMessage("");
  }

  function handleImages(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const previews = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
    }));

    setImageFiles((current) => [...current, ...files]);
    setImagePreviews((current) => [...current, ...previews]);

    event.target.value = "";
  }

  function removeImage(index) {
    const preview = imagePreviews[index];

    if (preview?.url) URL.revokeObjectURL(preview.url);

    setImageFiles((current) => current.filter((_, i) => i !== index));
    setImagePreviews((current) => current.filter((_, i) => i !== index));
  }

  function openReview(review) {
    setSelectedReview(review);
    setCarouselIndex(0);
  }

  function closeReview() {
    setSelectedReview(null);
    setCarouselIndex(0);
  }

  function nextImage() {
    if (!selectedImages.length) return;

    setCarouselIndex((current) =>
      current + 1 >= selectedImages.length ? 0 : current + 1,
    );
  }

  function previousImage() {
    if (!selectedImages.length) return;

    setCarouselIndex((current) =>
      current - 1 < 0 ? selectedImages.length - 1 : current - 1,
    );
  }

  function validateForm() {
    const errors = {};

    if (!form.customer_name.trim()) {
      errors.customer_name = "Please enter your name.";
    }

    if (!form.phone.trim()) {
      errors.phone = "Please enter your phone number.";
    } else if (!/^[0-9+]{9,15}$/.test(form.phone.replace(/\s+/g, ""))) {
      errors.phone = "Please enter a valid phone number.";
    }

    if (!form.category) {
      errors.category = "Please select a category.";
    }

    if (!form.rating || Number(form.rating) < 1 || Number(form.rating) > 5) {
      errors.rating = "Please select a valid star rating.";
    }

    if (!form.comment.trim()) {
      errors.comment = "Please write your review.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function submitReview(event) {
    event.preventDefault();
    setMessage("");

    if (!validateForm()) {
      setMessage("Please correct the highlighted fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("customer_name", form.customer_name.trim());
      formData.append("phone", form.phone.trim());
      formData.append("category", form.category);
      formData.append("rating", form.rating);
      formData.append("comment", form.comment.trim());

      imageFiles.forEach((file) => {
        formData.append("review_images", file);
      });

      await api.post("/reviews", formData);

      setShowSuccess(true);

      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));

      setForm({
        customer_name: "",
        phone: "",
        category: "product",
        rating: 5,
        comment: "",
      });

      setImageFiles([]);
      setImagePreviews([]);
      setFormErrors({});
      setMessage("");
    } catch (error) {
      setFormErrors(error.response?.data?.errors || {});
      setMessage(
        error.response?.data?.message ||
          "Review could not be sent. Please check backend terminal.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="section-padding relative overflow-hidden py-14 sm:py-16 lg:py-20">
      <div className="absolute left-0 top-24 h-72 w-72 rounded-full bg-pink-500/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-green-300/20 bg-[#12091f] p-6 text-center shadow-2xl sm:p-7">
            <div className="absolute inset-x-0 top-0 h-1 bg-green-400" />

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-200 sm:h-20 sm:w-20">
              <CheckCircle2 size={40} />
            </div>

            <h2 className="text-2xl font-black text-white sm:text-3xl">
              Review sent!
            </h2>

            <p className="mt-4 text-sm leading-7 text-white/65">
              Thank you. Your review has been sent to admin and will appear
              after approval.
            </p>

            <button
              type="button"
              onClick={() => setShowSuccess(false)}
              className="btn-primary mt-6 w-full"
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#12091f] p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-pink-200 sm:text-sm">
                  {selectedReview.category || "other"} review
                </p>

                <h2 className="mt-1 text-2xl font-black sm:text-3xl">
                  {selectedReview.customer_name}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeReview}
                className="rounded-full bg-white/10 p-2 text-white/70"
              >
                <X size={18} />
              </button>
            </div>

            {selectedImages.length > 0 && (
              <div className="mb-5 overflow-hidden rounded-[1.5rem] border border-white/10 sm:rounded-[2rem]">
                <div className="relative h-[230px] sm:h-[320px] md:h-[380px]">
                  <img
                    src={selectedImage?.image_url}
                    alt={selectedReview.customer_name}
                    className="h-full w-full object-cover"
                  />

                  {selectedImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={previousImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white"
                      >
                        <ChevronLeft size={20} />
                      </button>

                      <button
                        type="button"
                        onClick={nextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                </div>

                {selectedImages.length > 1 && (
                  <div className="flex justify-center gap-2 bg-black/30 p-3">
                    {selectedImages.map((image, index) => (
                      <button
                        key={image.id || image.image_url}
                        type="button"
                        onClick={() => setCarouselIndex(index)}
                        className={`h-2.5 w-2.5 rounded-full ${
                          index === carouselIndex
                            ? "bg-pink-300"
                            : "bg-white/25"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-4">
              <Stars rating={selectedReview.rating} />

              <p className="text-base leading-8 text-white/70 sm:text-lg">
                {selectedReview.comment}
              </p>

              <div className="flex flex-wrap gap-3">
                <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase text-white/60">
                  {selectedReview.category || "other"}
                </span>

                {selectedReview.resource_path && (
                  <Link
                    to={selectedReview.resource_path}
                    className="rounded-full bg-pink-500/20 px-4 py-2 text-xs font-black text-pink-100"
                  >
                    {selectedReview.resource_title || "View related item"}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container-max relative">
        <div className="mb-8 text-center sm:mb-10 lg:text-left">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-pink-100">
            <Star size={16} className="fill-current text-yellow-300" />
            Customer Reviews
          </p>

          <h2 className="text-3xl font-black sm:text-4xl md:text-5xl">
            Customer feedback shelf
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/55 sm:text-base lg:mx-0">
            Approved reviews are listed here. Click a review to view full
            details and images.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
          <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl sm:rounded-[2rem] sm:p-5">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-xl font-black sm:text-2xl">
                Approved reviews
              </h3>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input-field w-full sm:w-52"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category} className="text-black">
                    {category === "all" ? "All categories" : category}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden overflow-hidden rounded-[1.5rem] border border-white/10 md:block">
              <table className="w-full">
                <thead className="bg-[#170b25]">
                  <tr className="text-left text-xs font-black uppercase tracking-widest text-white/40">
                    <th className="w-[22%] px-4 py-4">Name</th>
                    <th className="w-[18%] px-4 py-4">Star</th>
                    <th className="w-[25%] px-4 py-4">Product / Related</th>
                    <th className="w-[35%] px-4 py-4">Review</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {visibleReviews.length ? (
                    visibleReviews.map((review) => (
                      <tr
                        key={review.id}
                        onClick={() => openReview(review)}
                        className="cursor-pointer transition hover:bg-white/[0.06]"
                      >
                        <td className="px-4 py-4 align-top">
                          <p className="font-black text-white">
                            {review.customer_name}
                          </p>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <Stars rating={review.rating} />
                        </td>

                        <td className="px-4 py-4 align-top">
                          <p className="text-sm font-bold text-pink-200">
                            {review.resource_title || "General"}
                          </p>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <p className="text-sm leading-6 text-white/60">
                            {shortText(review.comment, 95)}
                          </p>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-4 py-10 text-center text-white/55"
                      >
                        No approved reviews found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:hidden">
              {visibleReviews.length ? (
                visibleReviews.map((review) => (
                  <button
                    key={review.id}
                    type="button"
                    onClick={() => openReview(review)}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:bg-white/10"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">
                          {review.customer_name}
                        </p>
                        <p className="mt-1 text-xs font-bold text-pink-200">
                          {review.resource_title || "General"}
                        </p>
                      </div>

                      <Stars rating={review.rating} />
                    </div>

                    <p className="text-sm leading-6 text-white/60">
                      {shortText(review.comment, 115)}
                    </p>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-center text-white/55">
                  No approved reviews found.
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row">
              <p className="text-sm text-white/45">
                Page{" "}
                <span className="font-bold text-white">{currentPage}</span> of{" "}
                <span className="font-bold text-white">{totalPages}</span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white/70 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Prev
                </button>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white/70 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <form
            onSubmit={submitReview}
            className="rounded-[1.7rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl sm:rounded-[2rem] sm:p-6"
          >
            <h3 className="text-xl font-black sm:text-2xl">Write a review</h3>

            <p className="mt-2 text-sm leading-6 text-white/50">
              Share your experience. You can upload multiple images. Your
              review will appear only after admin approval.
            </p>

            <div className="mt-5 grid gap-4">
              <div>
                <input
                  className={`input-field ${
                    formErrors.customer_name ? "border-red-400/70" : ""
                  }`}
                  placeholder="Customer name"
                  value={form.customer_name}
                  onChange={(e) =>
                    updateField("customer_name", e.target.value)
                  }
                />

                {formErrors.customer_name && (
                  <p className="mt-2 text-xs font-semibold text-red-300">
                    {formErrors.customer_name}
                  </p>
                )}
              </div>

              <div>
                <input
                  className={`input-field ${
                    formErrors.phone ? "border-red-400/70" : ""
                  }`}
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />

                {formErrors.phone && (
                  <p className="mt-2 text-xs font-semibold text-red-300">
                    {formErrors.phone}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <select
                    className={`input-field ${
                      formErrors.category ? "border-red-400/70" : ""
                    }`}
                    value={form.category}
                    onChange={(e) => updateField("category", e.target.value)}
                  >
                    {CATEGORIES.filter((category) => category !== "all").map(
                      (category) => (
                        <option
                          key={category}
                          value={category}
                          className="text-black"
                        >
                          {category}
                        </option>
                      ),
                    )}
                  </select>

                  {formErrors.category && (
                    <p className="mt-2 text-xs font-semibold text-red-300">
                      {formErrors.category}
                    </p>
                  )}
                </div>

                <div>
                  <select
                    className={`input-field ${
                      formErrors.rating ? "border-red-400/70" : ""
                    }`}
                    value={form.rating}
                    onChange={(e) => updateField("rating", e.target.value)}
                  >
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option
                        key={rating}
                        value={rating}
                        className="text-black"
                      >
                        {rating} Stars
                      </option>
                    ))}
                  </select>

                  {formErrors.rating && (
                    <p className="mt-2 text-xs font-semibold text-red-300">
                      {formErrors.rating}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <textarea
                  className={`input-field min-h-28 ${
                    formErrors.comment ? "border-red-400/70" : ""
                  }`}
                  placeholder="Write review"
                  value={form.comment}
                  onChange={(e) => updateField("comment", e.target.value)}
                />

                {formErrors.comment && (
                  <p className="mt-2 text-xs font-semibold text-red-300">
                    {formErrors.comment}
                  </p>
                )}
              </div>

              <label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-white/20 bg-white/5 p-4 text-sm font-black text-white/60 transition hover:bg-white/10">
                <ImagePlus size={20} />
                Upload review images
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleImages}
                />
              </label>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={preview.id}
                      className="relative overflow-hidden rounded-2xl border border-white/10"
                    >
                      <img
                        src={preview.url}
                        alt="Review preview"
                        className="h-20 w-full object-cover sm:h-24"
                      />

                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Sending review..." : "Submit review"}
              </button>

              {message && <p className="text-sm text-pink-200">{message}</p>}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}