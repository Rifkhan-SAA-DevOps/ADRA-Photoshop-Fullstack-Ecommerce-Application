import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Filter, Plus, Search, WandSparkles } from "lucide-react";
import api from "../../lib/api.js";
import AdminResourceTable from "./AdminResourceTable.jsx";

export default function ManageServices() {
  const [items, setItems] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function loadItems() {
    const res = await api.get("/services?admin=true");
    setItems(res.data || []);
  }

  useEffect(() => {
    loadItems().catch(() => {});
  }, []);

  const filteredItems = useMemo(() => {
    let list = [...items];

    if (searchText.trim()) {
      const keyword = searchText.toLowerCase();
      list = list.filter(
        (item) =>
          item.title?.toLowerCase().includes(keyword) ||
          item.description?.toLowerCase().includes(keyword),
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((item) => item.status === statusFilter);
    }

    return list;
  }, [items, searchText, statusFilter]);

  async function deleteItem(id) {
    if (!confirm("Delete this service?")) return;
    await api.delete(`/services/${id}`);
    await loadItems();
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-pink-500/20 to-rose-500/10 p-6 shadow-2xl md:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-pink-100">
              <WandSparkles size={16} /> Service management
            </p>
            <h1 className="text-4xl font-black">Manage Services</h1>
          </div>

          <Link to="/admin/services/new" className="btn-primary">
            <Plus size={18} /> Add Service
          </Link>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="mb-5 flex items-center gap-2">
          <Filter size={18} className="text-pink-300" />
          <h2 className="text-xl font-black">Filter services</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-full border border-white/10 bg-black/25 px-4 py-3">
            <Search size={16} className="text-pink-300" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search service..."
              className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/35"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white outline-none"
          >
            <option value="all" className="bg-black">All status</option>
            <option value="active" className="bg-black">Active</option>
            <option value="inactive" className="bg-black">Inactive</option>
          </select>
        </div>
      </div>

      <AdminResourceTable
        items={filteredItems}
        type="services"
        getTitle={(item) => item.title}
        getSubtitle={(item) => item.short_description || item.description || "-"}
        getMeta={(item) => `LKR ${Number(item.price_from || 0).toLocaleString()}`}
        onDelete={deleteItem}
      />
    </div>
  );
}