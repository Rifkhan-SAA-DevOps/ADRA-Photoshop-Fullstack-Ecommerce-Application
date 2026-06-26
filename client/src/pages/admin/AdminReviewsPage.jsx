import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Image,
  Phone,
  RefreshCw,
  Search,
  Star,
  Trash2,
  User,
  X,
} from "lucide-react";
import api from "../../lib/api.js";

const CATEGORIES = ["product", "service", "event", "other"];
const STATUSES = ["pending", "approved"];

function formatDate(value) {
  if (!value) return "No date";

  const date = new Date(String(value).replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return "No date";

  return date.toLocaleString();
}

function normalizeCategory(value) {
  const category = String(value || "").toLowerCase().trim();

  if (["product", "service", "event", "other"].includes(category)) {
    return category;
  }

  return "other";
}

function Stars({ rating = 5 }) {
  return (
    <div className="flex items-center gap-1 text-yellow-300">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={15}
          className={star <= Number(rating || 0) ? "fill-current" : ""}
        />
      ))}
    </div>
  );
}

function getStatusStyle(status) {
  const styles = {
    pending: "border-yellow-300/20 bg-yellow-500/15 text-yellow-200",
    approved: "border-green-300/20 bg-green-500/15 text-green-200",
  };

  return styles[status] || "border-white/10 bg-white/10 text-white/60";
}

function getCategoryStyle(category) {
  const styles = {
    product: "bg-pink-500/15 text-pink-200",
    service: "bg-violet-500/15 text-violet-200",
    event: "bg-blue-500/15 text-blue-200",
    other: "bg-white/10 text-white/60",
  };

  return styles[category] || styles.other;
}

function safeImages(images) {
  return Array.isArray(images) ? images : [];
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [events, setEvents] = useState([]);

  const [drafts, setDrafts] = useState({});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  const [viewReview, setViewReview] = useState(null);
  const [editReview, setEditReview] = useState(null);
  const [modalError, setModalError] = useState("");

  async function loadResources() {
    const [productRes, serviceRes, eventRes] = await Promise.all([
      api.get("/products?admin=true"),
      api.get("/services?admin=true"),
      api.get("/events?admin=true"),
    ]);

    setProducts(Array.isArray(productRes.data) ? productRes.data : []);
    setServices(Array.isArray(serviceRes.data) ? serviceRes.data : []);
    setEvents(Array.isArray(eventRes.data) ? eventRes.data : []);
  }

  async function loadReviews() {
    setLoading(true);

    try {
      const res = await api.get("/reviews/admin");
      const list = Array.isArray(res.data) ? res.data : [];

      const sorted = [...list].sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
      );

      setReviews(sorted);

      const nextDrafts = {};

      sorted.forEach((review) => {
        nextDrafts[review.id] = {
          customer_name: review.customer_name || "",
          phone: review.phone || "",
          category: normalizeCategory(review.category || review.resource_type),
          rating: Number(review.rating || 5),
          comment: review.comment || "",
          images: safeImages(review.images),
          resource_id: review.resource_id || "",
          status:
            review.status === "approved" || review.is_approved === true
              ? "approved"
              : "pending",
        };
      });

      setDrafts(nextDrafts);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    Promise.all([loadResources(), loadReviews()]).catch(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, categoryFilter, dateFrom, dateTo, pageSize]);

  function getOptions(category) {
    if (category === "product") {
      return products.map((item) => ({
        id: item.id,
        label: item.name || "Untitled product",
      }));
    }

    if (category === "service") {
      return services.map((item) => ({
        id: item.id,
        label: item.title || "Untitled service",
      }));
    }

    if (category === "event") {
      return events.map((item) => ({
        id: item.id,
        label: item.title || "Untitled event",
      }));
    }

    return [];
  }

  function updateDraft(reviewId, field, value) {
    setDrafts((current) => {
      const oldDraft = current[reviewId] || {};

      const nextDraft = {
        ...oldDraft,
        [field]: value,
      };

      if (field === "category") {
        nextDraft.resource_id = "";
      }

      if (field === "rating") {
        nextDraft.rating = Number(value);
      }

      return {
        ...current,
        [reviewId]: nextDraft,
      };
    });

    setModalError("");
  }

  function removeDraftImage(reviewId, imageIndex) {
    setDrafts((current) => {
      const oldDraft = current[reviewId] || {};
      const currentImages = safeImages(oldDraft.images);

      return {
        ...current,
        [reviewId]: {
          ...oldDraft,
          images: currentImages.filter((_, index) => index !== imageIndex),
        },
      };
    });

    setModalError("");
  }

  const filteredReviews = useMemo(() => {
    const query = search.toLowerCase().trim();

    return reviews.filter((review) => {
      const draft = drafts[review.id] || {};
      const category = normalizeCategory(draft.category || review.category);
      const status = draft.status || review.status || "pending";

      const matchesStatus =
        statusFilter === "all" || status === statusFilter;

      const matchesCategory =
        categoryFilter === "all" || category === categoryFilter;

      const createdDate = review.created_at
        ? new Date(String(review.created_at).replace(" ", "T"))
        : null;

      let matchesDate = true;

      if (dateFrom && createdDate) {
        const fromDate = new Date(`${dateFrom}T00:00:00`);
        matchesDate = matchesDate && createdDate >= fromDate;
      }

      if (dateTo && createdDate) {
        const toDate = new Date(`${dateTo}T23:59:59`);
        matchesDate = matchesDate && createdDate <= toDate;
      }

      const text = [
        review.customer_name,
        review.phone,
        review.comment,
        review.category,
        review.resource_title,
        draft.customer_name,
        draft.phone,
        draft.comment,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || text.includes(query);

      return matchesStatus && matchesCategory && matchesDate && matchesSearch;
    });
  }, [
    reviews,
    drafts,
    search,
    statusFilter,
    categoryFilter,
    dateFrom,
    dateTo,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / pageSize));

  const pageReviews = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReviews.slice(start, start + pageSize);
  }, [filteredReviews, currentPage, pageSize]);

  async function saveReview(reviewId, forceStatus = null) {
    const draft = drafts[reviewId];

    if (!draft) return;

    setBusyId(reviewId);
    setModalError("");

    try {
      const status = forceStatus || draft.status || "pending";

      await api.patch(`/reviews/${reviewId}`, {
        customer_name: draft.customer_name,
        phone: draft.phone,
        category: draft.category,
        rating: draft.rating,
        comment: draft.comment,
        images: draft.images,
        resource_id: draft.resource_id,
        status,
      });

      await loadReviews();

      setEditReview(null);
    } catch (error) {
      setModalError(
        error.response?.data?.message ||
          "Review could not be updated. Please check all fields.",
      );
    } finally {
      setBusyId("");
    }
  }

  async function deleteReview(reviewId) {
    if (!confirm("Delete this review?")) return;

    setBusyId(reviewId);

    try {
      await api.delete(`/reviews/${reviewId}`);
      await loadReviews();
      setViewReview(null);
      setEditReview(null);
    } finally {
      setBusyId("");
    }
  }

  function openEdit(review) {
    setEditReview(review);
    setModalError("");
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-yellow-500/20 via-white/[0.05] to-pink-500/10 p-6 shadow-2xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-yellow-100">
              <Star size={16} className="fill-current" />
              Customer Reviews
            </p>

            <h1 className="text-4xl font-black">Review Approvals</h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">
              View, edit, assign, approve, and manage customer reviews with
              uploaded images.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadReviews()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-black transition hover:bg-white/15"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_180px_180px_160px_160px_150px]">
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
          <Search size={18} className="text-white/40" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, phone, review, related item..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-white/35"
          />
        </label>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input-field"
        >
          <option value="all" className="text-black">
            All categories
          </option>

          {CATEGORIES.map((category) => (
            <option key={category} value={category} className="text-black">
              {category}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field"
        >
          <option value="all" className="text-black">
            All statuses
          </option>

          {STATUSES.map((status) => (
            <option key={status} value={status} className="text-black">
              {status}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="input-field"
        />

        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="input-field"
        />

        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="input-field"
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size} className="text-black">
              {size} / page
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white/70 transition hover:bg-white/15"
        >
          Clear filters
        </button>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1300px]">
            <thead className="bg-white/[0.07]">
              <tr className="text-left text-xs font-black uppercase tracking-widest text-white/45">
                <th className="px-5 py-4">Images</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Phone</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Rating</th>
                <th className="px-5 py-4">Review</th>
                <th className="px-5 py-4">Related Item</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td
                    colSpan="10"
                    className="px-5 py-10 text-center text-white/55"
                  >
                    Loading reviews...
                  </td>
                </tr>
              ) : pageReviews.length === 0 ? (
                <tr>
                  <td
                    colSpan="10"
                    className="px-5 py-10 text-center text-white/55"
                  >
                    No reviews found.
                  </td>
                </tr>
              ) : (
                pageReviews.map((review) => {
                  const draft = drafts[review.id] || {};
                  const images = safeImages(draft.images || review.images);
                  const category = normalizeCategory(
                    draft.category || review.category,
                  );
                  const status = draft.status || review.status || "pending";

                  return (
                    <tr
                      key={review.id}
                      className="transition hover:bg-white/[0.04]"
                    >
                      <td className="px-5 py-4 align-top">
                        <div className="flex -space-x-3">
                          {images.length ? (
                            images.slice(0, 3).map((image) => (
                              <img
                                key={image.image_url}
                                src={image.image_url}
                                alt={review.customer_name}
                                className="h-12 w-12 rounded-2xl border border-black object-cover"
                              />
                            ))
                          ) : (
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-white/35">
                              <Image size={20} />
                            </div>
                          )}

                          {images.length > 3 && (
                            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-black bg-white/10 text-xs font-black">
                              +{images.length - 3}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <p className="flex items-center gap-2 font-bold text-white">
                          <User size={15} className="text-pink-300" />
                          {draft.customer_name || "No name"}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <p className="flex items-center gap-2 text-sm text-white/65">
                          <Phone size={14} className="text-violet-300" />
                          {draft.phone || "No phone"}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black uppercase ${getCategoryStyle(
                            category,
                          )}`}
                        >
                          {category}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <Stars rating={draft.rating} />
                      </td>

                      <td className="px-5 py-4 align-top">
                        <p className="line-clamp-3 max-w-[280px] text-sm leading-6 text-white/60">
                          {draft.comment || "No review"}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <p className="max-w-[220px] text-sm font-bold text-white/70">
                          {review.resource_title || "Not assigned"}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase ${getStatusStyle(
                            status,
                          )}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-top text-sm text-white/50">
                        {formatDate(review.created_at)}
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setViewReview(review)}
                            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-white/70 transition hover:bg-white/15"
                          >
                            <Eye size={14} />
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() => openEdit(review)}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-500/20 px-3 py-2 text-xs font-black text-blue-200 transition hover:bg-blue-500/30"
                          >
                            <Edit3 size={14} />
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={busyId === review.id}
                            onClick={() => deleteReview(review.id)}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-500/20 px-3 py-2 text-xs font-black text-red-200 transition hover:bg-red-500/30"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 px-5 py-4 sm:flex-row">
          <p className="text-sm text-white/45">
            Showing{" "}
            <span className="font-bold text-white">
              {filteredReviews.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-bold text-white">
              {Math.min(currentPage * pageSize, filteredReviews.length)}
            </span>{" "}
            of{" "}
            <span className="font-bold text-white">
              {filteredReviews.length}
            </span>{" "}
            reviews
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Prev
            </button>

            <span className="rounded-xl bg-black/30 px-4 py-2 text-sm font-bold text-white/70">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {viewReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#12091f] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black">Review Details</h2>

              <button
                type="button"
                onClick={() => setViewReview(null)}
                className="rounded-full bg-white/10 p-2 text-white/70"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-5">
              <div>
                <p className="text-sm text-white/40">Customer</p>
                <p className="mt-1 text-xl font-black">
                  {viewReview.customer_name}
                </p>
              </div>

              <div>
                <p className="text-sm text-white/40">Phone</p>
                <p className="mt-1 text-white/70">{viewReview.phone}</p>
              </div>

              <div>
                <p className="text-sm text-white/40">Rating</p>
                <div className="mt-2">
                  <Stars rating={viewReview.rating} />
                </div>
              </div>

              <div>
                <p className="text-sm text-white/40">Review</p>
                <p className="mt-2 leading-7 text-white/70">
                  {viewReview.comment}
                </p>
              </div>

              <div>
                <p className="text-sm text-white/40">Images</p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {safeImages(viewReview.images).length ? (
                    safeImages(viewReview.images).map((image) => (
                      <img
                        key={image.image_url}
                        src={image.image_url}
                        alt="Review"
                        className="h-44 w-full rounded-2xl object-cover"
                      />
                    ))
                  ) : (
                    <p className="text-sm text-white/40">No images uploaded.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#12091f] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black">Edit Review</h2>

              <button
                type="button"
                onClick={() => setEditReview(null)}
                className="rounded-full bg-white/10 p-2 text-white/70"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="mb-5 rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm font-semibold text-red-200">
                {modalError}
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-white/70">
                  Customer name
                </label>
                <input
                  className="input-field"
                  value={drafts[editReview.id]?.customer_name || ""}
                  onChange={(e) =>
                    updateDraft(editReview.id, "customer_name", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-white/70">
                  Phone number
                </label>
                <input
                  className="input-field"
                  value={drafts[editReview.id]?.phone || ""}
                  onChange={(e) =>
                    updateDraft(editReview.id, "phone", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-white/70">
                  Category
                </label>
                <select
                  className="input-field"
                  value={drafts[editReview.id]?.category || "other"}
                  onChange={(e) =>
                    updateDraft(editReview.id, "category", e.target.value)
                  }
                >
                  {CATEGORIES.map((category) => (
                    <option
                      key={category}
                      value={category}
                      className="text-black"
                    >
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-white/70">
                  Rating
                </label>
                <select
                  className="input-field"
                  value={drafts[editReview.id]?.rating || 5}
                  onChange={(e) =>
                    updateDraft(editReview.id, "rating", e.target.value)
                  }
                >
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating} className="text-black">
                      {rating} Stars
                    </option>
                  ))}
                </select>
              </div>

              {["product", "service", "event"].includes(
                drafts[editReview.id]?.category,
              ) && (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-white/70">
                    Related item
                  </label>
                  <select
                    className="input-field"
                    value={drafts[editReview.id]?.resource_id || ""}
                    onChange={(e) =>
                      updateDraft(editReview.id, "resource_id", e.target.value)
                    }
                  >
                    <option value="" className="text-black">
                      Select related item
                    </option>

                    {getOptions(drafts[editReview.id]?.category).map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                        className="text-black"
                      >
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-bold text-white/70">
                  Status
                </label>
                <select
                  className="input-field"
                  value={drafts[editReview.id]?.status || "pending"}
                  onChange={(e) =>
                    updateDraft(editReview.id, "status", e.target.value)
                  }
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status} className="text-black">
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-white/70">
                  Review
                </label>
                <textarea
                  className="input-field min-h-32"
                  value={drafts[editReview.id]?.comment || ""}
                  onChange={(e) =>
                    updateDraft(editReview.id, "comment", e.target.value)
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-white/70">
                  Images
                </label>

                <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {safeImages(drafts[editReview.id]?.images).length ? (
                    safeImages(drafts[editReview.id]?.images).map(
                      (image, index) => (
                        <div
                          key={image.image_url}
                          className="relative overflow-hidden rounded-2xl border border-white/10"
                        >
                          <img
                            src={image.image_url}
                            alt="Review"
                            className="h-28 w-full object-cover"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeDraftImage(editReview.id, index)
                            }
                            className="absolute right-2 top-2 rounded-full bg-red-500 p-2 text-white"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ),
                    )
                  ) : (
                    <p className="text-sm text-white/40">
                      No images remaining.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditReview(null)}
                className="rounded-xl bg-white/10 px-5 py-3 text-sm font-black text-white/70"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={busyId === editReview.id}
                onClick={() => saveReview(editReview.id)}
                className="btn-secondary"
              >
                Save changes
              </button>

              <button
                type="button"
                disabled={busyId === editReview.id}
                onClick={() => saveReview(editReview.id, "approved")}
                className="btn-primary"
              >
                <CheckCircle2 size={18} />
                Approve & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}