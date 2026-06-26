import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Send,
  Trash2,
  User,
} from "lucide-react";
import api from "../../lib/api.js";

const CONTACT_STATUSES = ["new", "contacted", "completed", "cancelled"];

function formatDate(value) {
  if (!value) return "No date";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "No date";
  return date.toLocaleString();
}

function getStatusStyle(status) {
  const styles = {
    new: "bg-blue-500/15 text-blue-200 border-blue-300/20",
    contacted: "bg-yellow-500/15 text-yellow-200 border-yellow-300/20",
    completed: "bg-green-500/15 text-green-200 border-green-300/20",
    cancelled: "bg-red-500/15 text-red-200 border-red-300/20",
  };

  return styles[status] || "bg-white/10 text-white/60 border-white/10";
}

export default function ContactRequestsPage() {
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  async function loadItems() {
    setLoading(true);

    try {
      const res = await api.get("/contact");

      const sorted = [...(Array.isArray(res.data) ? res.data : [])].sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
      );

      setItems(sorted);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems().catch(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, pageSize]);

  const filteredItems = useMemo(() => {
    const query = search.toLowerCase().trim();

    return items.filter((item) => {
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      const text = [
        item.name,
        item.customer_name,
        item.phone,
        item.email,
        item.service_type,
        item.service_needed,
        item.subject,
        item.message,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || text.includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [items, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const stats = useMemo(() => {
    const result = { all: items.length };

    CONTACT_STATUSES.forEach((status) => {
      result[status] = items.filter((item) => item.status === status).length;
    });

    return result;
  }, [items]);

  async function updateStatus(id, status) {
    setBusyId(id);

    try {
      await api.patch(`/contact/${id}`, { status });
      await loadItems();
    } finally {
      setBusyId("");
    }
  }

  async function remove(id) {
    if (!confirm("Delete this contact request?")) return;

    setBusyId(id);

    try {
      await api.delete(`/contact/${id}`);
      await loadItems();
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-500/20 via-white/[0.05] to-cyan-500/10 p-6 shadow-2xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-blue-100">
              <Send size={16} />
              Customer Messages
            </p>

            <h1 className="text-4xl font-black">Contact Requests</h1>

            <p className="mt-3 text-sm leading-7 text-white/55">
              View and manage customer enquiries and service requests.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadItems()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-black transition hover:bg-white/15"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {["all", ...CONTACT_STATUSES].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-2xl border p-4 text-left transition ${
                statusFilter === status
                  ? "border-blue-300/40 bg-blue-500/15"
                  : "border-white/10 bg-black/20 hover:bg-white/10"
              }`}
            >
              <p className="text-2xl font-black">{stats[status] || 0}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-white/45">
                {status}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_220px_160px]">
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
          <Search size={18} className="text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, email, service, message..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-white/35"
          />
        </label>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field"
        >
          <option value="all" className="text-black">
            All statuses
          </option>

          {CONTACT_STATUSES.map((status) => (
            <option key={status} value={status} className="text-black">
              {status}
            </option>
          ))}
        </select>

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

      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead className="bg-white/[0.07]">
              <tr className="text-left text-xs font-black uppercase tracking-widest text-white/45">
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Phone / Email</th>
                <th className="px-5 py-4">Service</th>
                <th className="px-5 py-4">Message</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-white/55">
                    Loading contact requests...
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-white/55">
                    No contact requests found.
                  </td>
                </tr>
              ) : (
                pageItems.map((item) => {
                  const name =
                    item.name || item.customer_name || "No name";

                  const service =
                    item.service_type ||
                    item.service_needed ||
                    item.subject ||
                    "General enquiry";

                  return (
                    <tr
                      key={item.id}
                      className="transition hover:bg-white/[0.04]"
                    >
                      <td className="px-5 py-4 align-top">
                        <p className="flex items-center gap-2 font-bold text-white">
                          <User size={15} className="text-pink-300" />
                          {name}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <p className="flex items-center gap-2 text-sm text-white/70">
                          <Phone size={14} className="text-violet-300" />
                          {item.phone || "No phone"}
                        </p>

                        <p className="mt-2 flex items-center gap-2 text-sm text-white/50">
                          <Mail size={14} className="text-blue-300" />
                          {item.email || "No email"}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <p className="max-w-[220px] font-bold text-white">
                          {service}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <p className="max-w-[300px] line-clamp-3 text-sm leading-6 text-white/55">
                          {item.message || "No message"}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top text-sm text-white/55">
                        <span className="inline-flex items-center gap-2">
                          <Clock size={14} />
                          {formatDate(item.created_at)}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase ${getStatusStyle(
                            item.status,
                          )}`}
                        >
                          {item.status || "new"}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="flex justify-end gap-2">
                          <select
                            value={item.status || "new"}
                            disabled={busyId === item.id}
                            onChange={(e) =>
                              updateStatus(item.id, e.target.value)
                            }
                            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-bold outline-none"
                          >
                            {CONTACT_STATUSES.map((status) => (
                              <option key={status} value={status} className="text-black">
                                {status}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={() => remove(item.id)}
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
              {filteredItems.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-bold text-white">
              {Math.min(currentPage * pageSize, filteredItems.length)}
            </span>{" "}
            of{" "}
            <span className="font-bold text-white">
              {filteredItems.length}
            </span>{" "}
            requests
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
    </div>
  );
}