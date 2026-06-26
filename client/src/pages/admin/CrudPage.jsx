import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Edit3,
  ImageIcon,
  Layers3,
  Package,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react";
import api from "../../lib/api.js";
import ImageUploader from "../../components/ImageUploader.jsx";

const PRODUCT_CATEGORIES = [
  "Photo frames",
  "Duro frames",
  "Engraving frame",
  "Mugs",
  "Bottle",
  "Plate",
  "Pillow",
  "Pen",
  "ID card",
  "Tshirt",
  "Event flags",
  "Banner",
  "Sticker",
  "Wedding Album",
  "Key tag - Resin",
  "Key tag - Engrave",
  "Key tag - Sublimation keytag",
];

const emptyByType = {
  services: {
    title: "",
    short_description: "",
    description: "",
    price_from: "",
    cover_image: "",
    is_featured: false,
    status: "active",
  },
  products: {
    name: "",
    category: "",
    description: "",
    price: "",
    cover_image: "",
    status: "active",
  },
  events: {
    title: "",
    event_date: "",
    location: "",
    promotional_message: "",
    description: "",
    cover_image: "",
    status: "upcoming",
  },
};

const typeSettings = {
  services: {
    title: "Services",
    singular: "Service",
    icon: WandSparkles,
    color: "from-pink-500/20 to-rose-500/10",
    description: "Create, edit, and manage photography services.",
  },
  products: {
    title: "Products",
    singular: "Product",
    icon: Package,
    color: "from-violet-500/20 to-purple-500/10",
    description:
      "Manage products such as frames, mugs, albums, banners, key tags, and more.",
  },
  events: {
    title: "Events",
    singular: "Event",
    icon: CalendarDays,
    color: "from-blue-500/20 to-cyan-500/10",
    description: "Promote upcoming events, convocations, parties, and packages.",
  },
};

function getTitle(item) {
  return item.title || item.name || "Untitled";
}

function getStoredCategories() {
  try {
    return JSON.parse(localStorage.getItem("admin_product_categories") || "[]");
  } catch {
    return [];
  }
}

function saveStoredCategories(categories) {
  localStorage.setItem("admin_product_categories", JSON.stringify(categories));
}

export default function CrudPage({ type }) {
  const settings = typeSettings[type];
  const Icon = settings.icon;

  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyByType[type]);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [customCategories, setCustomCategories] = useState(getStoredCategories);
  const [newCategory, setNewCategory] = useState("");

  async function loadItems() {
    setLoading(true);

    try {
      const res = await api.get(`/${type}?admin=true`);
      setItems(res.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setForm(emptyByType[type]);
    setEditingId(null);
    setMessage("");
    setSearchText("");
    setStatusFilter("all");
    setCategoryFilter("all");

    loadItems().catch(() => {});
  }, [type]);

  const productCategories = useMemo(() => {
    const categoriesFromItems = items
      .map((item) => item.category)
      .filter(Boolean);

    return [
      ...new Set([
        ...PRODUCT_CATEGORIES,
        ...customCategories,
        ...categoriesFromItems,
      ]),
    ];
  }, [items, customCategories]);

  const filteredItems = useMemo(() => {
    let list = [...items];

    if (searchText.trim()) {
      const keyword = searchText.toLowerCase();

      list = list.filter((item) => {
        return (
          item.title?.toLowerCase().includes(keyword) ||
          item.name?.toLowerCase().includes(keyword) ||
          item.category?.toLowerCase().includes(keyword) ||
          item.status?.toLowerCase().includes(keyword) ||
          item.location?.toLowerCase().includes(keyword) ||
          item.description?.toLowerCase().includes(keyword)
        );
      });
    }

    if (statusFilter !== "all") {
      list = list.filter((item) => item.status === statusFilter);
    }

    if (type === "products" && categoryFilter !== "all") {
      list = list.filter((item) => item.category === categoryFilter);
    }

    return list;
  }, [items, searchText, statusFilter, categoryFilter, type]);

  const activeCount = items.filter((item) =>
    ["active", "upcoming", "offer"].includes(item.status),
  ).length;

  const inactiveCount = items.length - activeCount;

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function addNewCategory() {
    const category = newCategory.trim();

    if (!category) return;

    const updatedCategories = [...new Set([...customCategories, category])];

    setCustomCategories(updatedCategories);
    saveStoredCategories(updatedCategories);

    updateField("category", category);
    setCategoryFilter(category);
    setNewCategory("");
    setMessage(`Category "${category}" added.`);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyByType[type]);
    setMessage("");
  }

  function editItem(item) {
    setEditingId(item.id);
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (type === "services") {
      setForm({
        title: item.title || "",
        short_description: item.short_description || "",
        description: item.description || "",
        price_from: item.price_from || "",
        cover_image: item.cover_image || "",
        is_featured: Boolean(item.is_featured),
        status: item.status || "active",
      });
    }

    if (type === "products") {
      setForm({
        name: item.name || "",
        category: item.category || "",
        description: item.description || "",
        price: item.price || "",
        cover_image: item.cover_image || "",
        status: item.status || "active",
      });
    }

    if (type === "events") {
      const eventDate = item.event_date
        ? new Date(item.event_date).toISOString().slice(0, 16)
        : "";

      setForm({
        title: item.title || "",
        event_date: eventDate,
        location: item.location || "",
        promotional_message: item.promotional_message || "",
        description: item.description || "",
        cover_image: item.cover_image || "",
        status: item.status || "upcoming",
      });
    }
  }

  async function saveItem(event) {
    event.preventDefault();
    setMessage("");

    const payload = { ...form };

    if (type === "events" && payload.event_date) {
      payload.event_date = payload.event_date.replace("T", " ") + ":00";
    }

    try {
      if (editingId) {
        await api.put(`/${type}/${editingId}`, payload);
        setMessage(`${settings.singular} updated successfully.`);
      } else {
        await api.post(`/${type}`, payload);
        setMessage(`${settings.singular} created successfully.`);
      }

      resetForm();
      await loadItems();
    } catch (error) {
      setMessage(error.response?.data?.message || "Save failed.");
    }
  }

  async function deleteItem(id) {
    if (!confirm(`Delete this ${settings.singular.toLowerCase()}?`)) return;

    try {
      await api.delete(`/${type}/${id}`);
      setMessage(`${settings.singular} deleted.`);
      await loadItems();
    } catch (error) {
      setMessage(error.response?.data?.message || "Delete failed.");
    }
  }

  return (
    <div className="space-y-8">
      <div
        className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br ${settings.color} p-6 shadow-2xl md:p-8`}
      >
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-pink-400/20 blur-3xl" />
        <div className="absolute -bottom-20 left-1/2 h-52 w-52 rounded-full bg-violet-400/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-pink-100">
              <Icon size={16} /> Admin management
            </p>

            <h1 className="text-4xl font-black md:text-5xl">
              Manage {settings.title}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">
              {settings.description}
            </p>
          </div>

          <button
            type="button"
            onClick={loadItems}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-black text-black transition hover:bg-pink-200"
          >
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
          <p className="text-sm text-white/50">Total {settings.title}</p>
          <p className="mt-3 text-4xl font-black">{items.length}</p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
          <p className="text-sm text-white/50">Active / Available</p>
          <p className="mt-3 text-4xl font-black">{activeCount}</p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
          <p className="text-sm text-white/50">Inactive / Completed</p>
          <p className="mt-3 text-4xl font-black">{inactiveCount}</p>
        </div>
      </div>

      <form
        onSubmit={saveItem}
        className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl"
      >
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-pink-300">
              {editingId ? "Edit item" : "Create item"}
            </p>

            <h2 className="text-3xl font-black">
              {editingId ? "Edit" : "Add"} {settings.singular}
            </h2>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold transition hover:bg-white/15"
            >
              <X size={16} /> Cancel edit
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {type === "services" && (
            <>
              <input
                className="input-field"
                placeholder="Service title"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                required
              />

              <input
                className="input-field"
                placeholder="Price from"
                type="number"
                value={form.price_from}
                onChange={(e) => updateField("price_from", e.target.value)}
              />

              <input
                className="input-field md:col-span-2"
                placeholder="Short description"
                value={form.short_description}
                onChange={(e) =>
                  updateField("short_description", e.target.value)
                }
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
                  onChange={(e) =>
                    updateField("is_featured", e.target.checked)
                  }
                />
                Featured service
              </label>

              <select
                className="input-field"
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
              >
                <option className="text-black" value="active">
                  Active
                </option>
                <option className="text-black" value="inactive">
                  Inactive
                </option>
              </select>
            </>
          )}

          {type === "products" && (
            <>
              <input
                className="input-field"
                placeholder="Product name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
              />

              <select
                className="input-field"
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                required
              >
                <option className="text-black" value="">
                  Select product category
                </option>

                {productCategories.map((category) => (
                  <option
                    key={category}
                    className="text-black"
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>

              <input
                className="input-field"
                placeholder="Add new category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />

              <button
                type="button"
                onClick={addNewCategory}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black transition hover:bg-white/15"
              >
                <Plus size={17} /> Add category
              </button>

              <input
                className="input-field"
                placeholder="Price"
                type="number"
                value={form.price}
                onChange={(e) => updateField("price", e.target.value)}
              />

              <select
                className="input-field"
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
              >
                <option className="text-black" value="active">
                  Active
                </option>
                <option className="text-black" value="offer">
                  Offer
                </option>
                <option className="text-black" value="inactive">
                  Inactive
                </option>
              </select>

              <textarea
                className="input-field min-h-32 md:col-span-2"
                placeholder="Description"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </>
          )}

          {type === "events" && (
            <>
              <input
                className="input-field"
                placeholder="Event title"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                required
              />

              <input
                className="input-field"
                type="datetime-local"
                value={form.event_date}
                onChange={(e) => updateField("event_date", e.target.value)}
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
                <option className="text-black" value="upcoming">
                  Upcoming
                </option>
                <option className="text-black" value="completed">
                  Completed
                </option>
                <option className="text-black" value="cancelled">
                  Cancelled
                </option>
              </select>

              <input
                className="input-field md:col-span-2"
                placeholder="Promotional message"
                value={form.promotional_message}
                onChange={(e) =>
                  updateField("promotional_message", e.target.value)
                }
              />

              <textarea
                className="input-field min-h-32 md:col-span-2"
                placeholder="Description"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </>
          )}

          <input
            className="input-field md:col-span-2"
            placeholder="Cover image URL"
            value={form.cover_image}
            onChange={(e) => updateField("cover_image", e.target.value)}
          />

          <div className="md:col-span-2">
            <ImageUploader onUploaded={(url) => updateField("cover_image", url)} />

            {form.cover_image ? (
              <div className="mt-4 overflow-hidden rounded-[2rem] border border-white/10 bg-black/20 p-3">
                <img
                  src={form.cover_image}
                  alt="Preview"
                  className="h-56 w-full rounded-[1.5rem] object-cover"
                />
              </div>
            ) : (
              <div className="mt-4 grid h-40 place-items-center rounded-[2rem] border border-dashed border-white/15 bg-white/[0.03] text-sm text-white/40">
                <ImageIcon size={26} />
                Image preview will appear here
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="btn-primary">
            <Save size={18} />
            {editingId ? "Update" : "Create"}
          </button>

          {editingId && (
            <button type="button" className="btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>

        {message && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-pink-500/15 px-4 py-2 text-sm font-bold text-pink-100">
            <CheckCircle2 size={16} /> {message}
          </p>
        )}
      </form>

      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-300">
              Existing records
            </p>
            <h2 className="mt-2 text-2xl font-black">
              {filteredItems.length} {settings.title}
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-3 lg:min-w-[700px]">
            <label className="flex items-center gap-3 rounded-full border border-white/10 bg-black/25 px-4 py-3">
              <Search size={16} className="text-pink-300" />
              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/35"
              />
            </label>

            {type === "products" && (
              <select
                className="rounded-full border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white outline-none"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option className="bg-black" value="all">
                  All categories
                </option>

                {productCategories.map((category) => (
                  <option key={category} className="bg-black" value={category}>
                    {category}
                  </option>
                ))}
              </select>
            )}

            <select
              className="rounded-full border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white outline-none"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option className="bg-black" value="all">
                All status
              </option>

              {type === "events" ? (
                <>
                  <option className="bg-black" value="upcoming">
                    Upcoming
                  </option>
                  <option className="bg-black" value="completed">
                    Completed
                  </option>
                  <option className="bg-black" value="cancelled">
                    Cancelled
                  </option>
                </>
              ) : (
                <>
                  <option className="bg-black" value="active">
                    Active
                  </option>
                  {type === "products" && (
                    <option className="bg-black" value="offer">
                      Offer
                    </option>
                  )}
                  <option className="bg-black" value="inactive">
                    Inactive
                  </option>
                </>
              )}
            </select>
          </div>
        </div>

        {type === "products" && (
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                categoryFilter === "all"
                  ? "bg-pink-300 text-black"
                  : "bg-white/10 text-white hover:bg-white/15"
              }`}
            >
              All
            </button>

            {productCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setCategoryFilter(category)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  categoryFilter === category
                    ? "bg-pink-300 text-black"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        <div className="overflow-x-auto rounded-[1.5rem] border border-white/10">
          <table className="admin-table w-full min-w-[860px]">
            <thead>
              <tr>
                <th>Image</th>
                <th>Title / Name</th>
                {type === "products" && <th>Category</th>}
                <th>Status</th>
                <th>Price / Date</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.cover_image ? (
                      <img
                        src={item.cover_image}
                        alt=""
                        className="h-16 w-24 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="grid h-16 w-24 place-items-center rounded-2xl bg-white/10 text-white/35">
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </td>

                  <td>
                    <div>
                      <p className="font-semibold">{getTitle(item)}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-white/40">
                        {item.short_description ||
                          item.promotional_message ||
                          item.description ||
                          "-"}
                      </p>
                    </div>
                  </td>

                  {type === "products" && (
                    <td>
                      <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-bold text-violet-100">
                        {item.category || "-"}
                      </span>
                    </td>
                  )}

                  <td>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold capitalize text-white/75">
                      {item.status || "-"}
                    </span>
                  </td>

                  <td>
                    {type === "services" &&
                      `LKR ${Number(item.price_from || 0).toLocaleString()}`}

                    {type === "products" &&
                      `LKR ${Number(item.price || 0).toLocaleString()}`}

                    {type === "events" &&
                      (item.event_date
                        ? new Date(item.event_date).toLocaleDateString()
                        : "-")}
                  </td>

                  <td>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString()
                      : "-"}
                  </td>

                  <td>
                    <div className="flex gap-2">
                      <button
                        className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm transition hover:bg-white/15"
                        onClick={() => editItem(item)}
                      >
                        <Edit3 size={14} /> Edit
                      </button>

                      <button
                        className="inline-flex items-center gap-2 rounded-xl bg-red-500/20 px-3 py-2 text-sm text-red-200 transition hover:bg-red-500/30"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!filteredItems.length && (
                <tr>
                  <td
                    colSpan={type === "products" ? 7 : 6}
                    className="py-10 text-center text-white/45"
                  >
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {type === "products" && (
          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
            <p className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.25em] text-pink-300">
              <Layers3 size={16} /> Product category note
            </p>
            <p className="text-sm leading-7 text-white/55">
              Current categories are available in the dropdown. To add future
              categories, type a new category name and click “Add category”.
              That category will immediately appear in product form and category
              filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}