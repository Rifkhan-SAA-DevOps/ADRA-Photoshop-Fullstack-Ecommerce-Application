import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Filter, Plus, Search } from "lucide-react";
import api from "../../lib/api.js";
import AdminResourceTable from "./AdminResourceTable.jsx";

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

export default function ManageEvents() {
  const [items, setItems] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  async function loadItems() {
    const res = await api.get("/events?admin=true");
    setItems(Array.isArray(res.data) ? res.data : []);
  }

  useEffect(() => {
    loadItems().catch(() => {});
  }, []);

  const categories = useMemo(() => {
    return [
      ...new Set([
        ...EVENT_CATEGORIES,
        ...items.map((item) => item.category).filter(Boolean),
      ]),
    ];
  }, [items]);

  const filteredItems = useMemo(() => {
    let list = [...items];

    if (searchText.trim()) {
      const keyword = searchText.toLowerCase();
      list = list.filter(
        (item) =>
          item.title?.toLowerCase().includes(keyword) ||
          item.category?.toLowerCase().includes(keyword) ||
          item.location?.toLowerCase().includes(keyword) ||
          item.promotional_message?.toLowerCase().includes(keyword) ||
          item.description?.toLowerCase().includes(keyword),
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((item) => item.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      list = list.filter((item) => item.category === categoryFilter);
    }

    return list;
  }, [items, searchText, statusFilter, categoryFilter]);

  async function deleteItem(id) {
    if (!confirm("Delete this event?")) return;
    await api.delete(`/events/${id}`);
    await loadItems();
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 p-6 shadow-2xl md:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-blue-100">
              <CalendarDays size={16} /> Event management
            </p>
            <h1 className="text-4xl font-black">Manage Events</h1>
            <p className="mt-3 text-white/55">
              Manage event packages, convocation shoots, locations, dates,
              cover images, and event galleries.
            </p>
          </div>

          <Link to="/admin/events/new" className="btn-primary">
            <Plus size={18} /> Add Event
          </Link>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="mb-5 flex items-center gap-2">
          <Filter size={18} className="text-pink-300" />
          <h2 className="text-xl font-black">Filter events</h2>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_0.8fr_0.8fr]">
          <label className="flex items-center gap-3 rounded-full border border-white/10 bg-black/25 px-4 py-3">
            <Search size={16} className="text-pink-300" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search event, location, category..."
              className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/35"
            />
          </label>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-full border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white outline-none"
          >
            <option value="all" className="bg-black">
              All categories
            </option>
            {categories.map((category) => (
              <option key={category} value={category} className="bg-black">
                {category}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white outline-none"
          >
            <option value="all" className="bg-black">
              All status
            </option>
            <option value="upcoming" className="bg-black">
              Upcoming
            </option>
            <option value="completed" className="bg-black">
              Completed
            </option>
            <option value="cancelled" className="bg-black">
              Cancelled
            </option>
          </select>
        </div>
      </div>

      <AdminResourceTable
        items={filteredItems}
        type="events"
        showCategory
        getTitle={(item) => item.title}
        getSubtitle={(item) => item.promotional_message || item.description || "-"}
        getMeta={(item) =>
          item.event_date ? new Date(String(item.event_date).replace(" ", "T")).toLocaleDateString() : "-"
        }
        onDelete={deleteItem}
      />
    </div>
  );
}
