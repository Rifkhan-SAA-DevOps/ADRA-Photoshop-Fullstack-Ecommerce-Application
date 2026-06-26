import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Camera, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Star } from "lucide-react";
const links = [
  ['Dashboard', '/admin'],
  ['Services', '/admin/services'],
  ['Products', '/admin/products'],
  ['Events', '/admin/events'],
  ['Customers', '/admin/customers'],
  ['Admin Users', '/admin/users'],
  ['Event Bookings', '/admin/bookings'],
  ['Product Orders', '/admin/orders'],
  ['Contacts', '/admin/contacts'],
  ['Reviews', '/admin/reviews'],
  ['Profile', '/admin/profile'],
  ['Settings', '/admin/settings']
];

function SidebarContent({ admin, onLogout, onNavigate }) {
  return (
    <>
      <div className="mb-8 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-pink-500 to-violet-500">
          <Camera size={22} />
        </span>
        <div>
          <h1 className="font-black">Admin Panel</h1>
          <p className="text-xs text-white/50">{admin?.name}</p>
        </div>
      </div>
      <nav className="grid gap-2">
        {links.map(([label, href]) => (
          <NavLink
            end={href === '/admin'}
            key={href}
            to={href}
            onClick={onNavigate}
            className={({ isActive }) => `rounded-2xl px-4 py-3 text-sm font-semibold transition ${isActive ? 'bg-white text-black' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <button onClick={onLogout} className="mt-8 flex w-full items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white/70 hover:bg-white/10">
        <LogOut size={16} /> Logout
      </button>
    </>
  );
}

export default function AdminLayout() {
  const { logout, admin } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  return (
    <div className="min-h-screen bg-[#07070d] text-white lg:flex">
      <aside className="hidden border-r border-white/10 bg-black/50 p-5 lg:block lg:min-h-screen lg:w-72 lg:shrink-0">
        <SidebarContent admin={admin} onLogout={handleLogout} />
      </aside>

      <div className="sticky top-0 z-40 border-b border-white/10 bg-black/80 p-4 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-pink-500 to-violet-500">
              <Camera size={22} />
            </span>
            <div>
              <h1 className="font-black">Admin Panel</h1>
              <p className="text-xs text-white/50">{admin?.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/10 text-white"
            aria-label="Toggle admin menu"
          >
            {mobileOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="mt-4 max-h-[72vh] overflow-y-auto rounded-[2rem] border border-white/10 bg-[#0b0b13] p-4 shadow-2xl">
            <SidebarContent admin={admin} onLogout={handleLogout} onNavigate={() => setMobileOpen(false)} />
          </div>
        )}
      </div>

      <main className="min-w-0 flex-1 p-5 lg:p-8">
        <div className="mb-8 flex flex-wrap items-center gap-3 text-white/50">
          <LayoutDashboard size={18} /> Manage your photography business content
        </div>
        <Outlet />
      </main>
    </div>
  );
}
