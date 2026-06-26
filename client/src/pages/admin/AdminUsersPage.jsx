import { useEffect, useState } from "react";
import { ShieldPlus, Users, ShieldCheck } from "lucide-react";
import api from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "",
};

export default function AdminUsersPage() {
  const { admin } = useAuth();

  const isSuperAdmin = admin?.role === "super_admin";
  const canManageAdmins =
    admin?.role === "super_admin" || admin?.role === "admin";

  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  function normalizeAdmins(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.admins)) return data.admins;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }

  function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString();
  }

  function validateForm() {
    const name = form.name.trim();
    const email = form.email.trim();
    const password = form.password.trim();
    const role = form.role;

    if (!name) {
      return "Name is required.";
    }

    if (name.length < 2) {
      return "Name must be at least 2 characters.";
    }

    if (!email) {
      return "Email is required.";
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return "Please enter a valid email address.";
    }

    if (!password) {
      return "Password is required.";
    }

    if (password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    // Only super admin must select role.
    // Normal admin creates only normal admin accounts automatically.
    if (isSuperAdmin) {
      if (!role) {
        return "Please select admin role.";
      }

      if (!["admin", "super_admin"].includes(role)) {
        return "Invalid admin role selected.";
      }
    }

    return "";
  }

  async function loadAdmins() {
    setLoading(true);
    setMessage("");

    try {
      const res = await api.get("/admins");
      let adminList = normalizeAdmins(res.data);

      // Frontend safety:
      // normal admin must not see super_admin users.
      if (!isSuperAdmin) {
        adminList = adminList.filter((item) => item.role !== "super_admin");
      }

      setAdmins(adminList);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not load admin users.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin?.id, admin?.role]);

  async function createAdmin(event) {
    event.preventDefault();

    if (!canManageAdmins) {
      setMessage("You do not have permission to create admin users.");
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setMessage(validationError);
      return;
    }

    setMessage("");

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: isSuperAdmin ? form.role : "admin",
      };

      await api.post("/admins", payload);

      setForm(emptyForm);
      setMessage("Admin user created successfully.");
      await loadAdmins();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not create admin user.",
      );
    }
  }

  async function changeRole(id, role) {
    if (!isSuperAdmin) {
      setMessage("Only super admin can change admin roles.");
      return;
    }

    if (!role) {
      setMessage("Please select a valid role.");
      return;
    }

    if (!["admin", "super_admin"].includes(role)) {
      setMessage("Invalid role selected.");
      return;
    }

    try {
      await api.put(`/admins/${id}`, { role });

      setMessage("Admin role updated successfully.");
      await loadAdmins();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not update admin role.",
      );
    }
  }

  async function remove(id) {
    if (!canManageAdmins) {
      setMessage("You do not have permission to delete admin users.");
      return;
    }

    if (id === admin?.id) {
      setMessage("You cannot delete your own account.");
      return;
    }

    if (!confirm("Delete this admin user?")) return;

    try {
      await api.delete(`/admins/${id}`);
      setMessage("Admin user deleted successfully.");
      await loadAdmins();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not delete admin user.",
      );
    }
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-pink-400/20 bg-pink-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-pink-200">
            <ShieldCheck size={14} />
            Admin Access
          </span>

          <h1 className="text-3xl font-black text-white sm:text-4xl">
            Admin User Management
          </h1>

          <p className="mt-2 text-sm text-white/50">
            {isSuperAdmin
              ? "Super admin can manage all admin accounts."
              : "Admin can manage normal admin accounts only. Super admin accounts are hidden."}
          </p>
        </div>
      </div>

      {canManageAdmins && (
        <form
          onSubmit={createAdmin}
          className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl sm:p-6"
          noValidate
           autoComplete="off"
        >
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-pink-500/15">
              <ShieldPlus className="text-pink-300" size={22} />
            </span>

            <div>
              <h2 className="text-2xl font-black text-white">Add New Admin</h2>
              <p className="text-sm text-white/50">
                {isSuperAdmin
                  ? "Create admin or super admin accounts."
                  : "Create normal admin accounts only."}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="input-field"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              className="input-field"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <input
              className="input-field"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            {isSuperAdmin ? (
              <select
                className={`input-field bg-zinc-950 ${
                  form.role ? "text-white" : "text-white/40"
                }`}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option className="bg-zinc-950 text-white/50" value="">
                  Select role
                </option>

                <option className="bg-zinc-950 text-white" value="admin">
                  Admin
                </option>

                <option className="bg-zinc-950 text-white" value="super_admin">
                  Super Admin
                </option>
              </select>
            ) : (
              <div className="input-field flex items-center justify-between">
                <span className="text-white/45">Role</span>
                <span className="rounded-full border border-pink-400/20 bg-pink-500/10 px-3 py-1 text-xs font-bold uppercase text-pink-200">
                  Admin
                </span>
              </div>
            )}
          </div>

          <button className="btn-primary mt-5">Create Admin User</button>
        </form>
      )}

      {message && (
        <div className="mb-5 rounded-2xl border border-pink-400/20 bg-pink-500/10 px-5 py-4 text-sm font-medium text-pink-100">
          {message}
        </div>
      )}

      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="font-black text-white">
              {isSuperAdmin ? "All Admin Users" : "Admin Users"}
            </h2>
            <p className="text-xs text-white/45">
              {isSuperAdmin
                ? "All admin and super admin accounts."
                : "Only normal admin accounts are shown."}
            </p>
          </div>

          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/60">
            {admins.length} user{admins.length === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-white/50">
            Loading admin users...
          </div>
        ) : admins.length === 0 ? (
          <div className="p-8 text-center text-sm text-white/50">
            No admin users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table w-full min-w-[760px]">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {admins.map((item) => {
                  const isCurrentUser = item.id === admin?.id;
                  const isTargetSuperAdmin = item.role === "super_admin";

                  const canDeleteThisUser =
                    canManageAdmins &&
                    !isCurrentUser &&
                    (isSuperAdmin || !isTargetSuperAdmin);

                  return (
                    <tr key={item.id}>
                      <td className="font-semibold">
                        <Users
                          className="mr-2 inline text-pink-300"
                          size={16}
                        />
                        {item.name || "-"}

                        {isCurrentUser && (
                          <span className="ml-2 rounded-full bg-pink-500/15 px-2 py-1 text-[11px] font-bold text-pink-200">
                            You
                          </span>
                        )}
                      </td>

                      <td>{item.email || "-"}</td>

                      <td>
                        {isSuperAdmin && !isCurrentUser ? (
                          <select
                            className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white"
                            value={item.role || "admin"}
                            onChange={(e) =>
                              changeRole(item.id, e.target.value)
                            }
                          >
                            <option
                              className="bg-zinc-950 text-white"
                              value="admin"
                            >
                              Admin
                            </option>

                            <option
                              className="bg-zinc-950 text-white"
                              value="super_admin"
                            >
                              Super Admin
                            </option>
                          </select>
                        ) : (
                          <span
                            className={`rounded-full border px-3 py-2 text-xs font-bold uppercase ${
                              item.role === "super_admin"
                                ? "border-violet-400/30 bg-violet-500/10 text-violet-200"
                                : "border-pink-400/20 bg-pink-500/10 text-pink-200"
                            }`}
                          >
                            {item.role === "super_admin"
                              ? "Super Admin"
                              : "Admin"}
                          </span>
                        )}
                      </td>

                      <td>{formatDate(item.created_at)}</td>

                      <td>
                        {canDeleteThisUser ? (
                          <button
                            className="rounded-xl bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/30"
                            onClick={() => remove(item.id)}
                          >
                            Delete
                          </button>
                        ) : (
                          <span className="text-sm text-white/35">
                            {isCurrentUser ? "Current user" : "No permission"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}