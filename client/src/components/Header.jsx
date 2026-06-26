import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Camera, Menu, X, ShieldCheck } from "lucide-react";

const navClass = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-white/10 text-white shadow-sm"
      : "text-white/70 hover:bg-white/10 hover:text-white"
  }`;

const mobileLinkClass = ({ isActive }) =>
  `rounded-2xl px-4 py-3 text-sm font-semibold transition ${
    isActive
      ? "bg-white/10 text-white"
      : "text-white/70 hover:bg-white/10 hover:text-white"
  }`;

export default function Header() {
  const [open, setOpen] = useState(false);

  const desktopLinks = (
    <>
      <NavLink to="/" className={navClass}>
        Home
      </NavLink>

      <NavLink to="/services" className={navClass}>
        Services
      </NavLink>

      <NavLink to="/products" className={navClass}>
        Products
      </NavLink>

      <NavLink to="/events" className={navClass}>
        Events
      </NavLink>

      <NavLink to="/gallery" className={navClass}>
        Gallery
      </NavLink>

      <NavLink to="/contact" className={navClass}>
        Contact
      </NavLink>
    </>
  );

  return (
    <header className="sticky top-0 z-50 overflow-hidden border-b border-white/10 bg-black/75 backdrop-blur-2xl">
      <style>
        {`
          @keyframes adraHeaderLight {
            0% {
              transform: translateX(-120%);
            }
            100% {
              transform: translateX(280%);
            }
          }

          .adra-header-light {
            animation: adraHeaderLight 4s ease-in-out infinite alternate;
          }

          @keyframes adraNavClockwise {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }

          .adra-nav-shell {
            position: relative;
            isolation: isolate;
          }

          .adra-nav-light {
            position: absolute;
            inset: -120px;
            z-index: 0;
            background: conic-gradient(
              from 0deg,
              transparent 0deg,
              transparent 70deg,
              rgba(244, 114, 182, 0.95) 95deg,
              rgba(168, 85, 247, 0.95) 120deg,
              transparent 155deg,
              transparent 360deg
            );
            animation: adraNavClockwise 4s linear infinite;
          }

          .adra-nav-shell::after {
            content: "";
            position: absolute;
            inset: 1px;
            z-index: 1;
            border-radius: 9999px;
            background: rgba(0, 0, 0, 0.78);
          }
        `}
      </style>

      <div className="container-max section-padding flex h-20 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <span className="flex h-12 w-28 items-center justify-center overflow-hidden rounded border border-white/10 bg-transparent shadow-glow">
            <img
              src="/header_logo.jpeg"
              alt="ADRA Photography Logo"
              className="h-full w-full scale-110 object-cover"
            />
          </span>
        </Link>

        {/* Desktop Nav with Clockwise Moving Light */}
        <div className="adra-nav-shell relative hidden overflow-hidden rounded-full p-[1px] lg:block">
          <span className="adra-nav-light" />

          <nav className="relative z-10 flex items-center gap-1 rounded-full border border-white/10 bg-black/80 p-1.5 shadow-inner backdrop-blur-xl">
            {desktopLinks}
          </nav>
        </div>

        {/* Desktop Admin */}
        <div className="hidden items-center lg:flex">
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-2 rounded-full border border-pink-400/30 bg-pink-500/10 px-5 py-2.5 text-sm font-semibold text-pink-100 transition hover:border-pink-300/60 hover:bg-pink-500/20 hover:text-white"
          >
            <ShieldCheck size={16} />
            Admin Login
          </Link>
        </div>

        {/* Mobile Button */}
        <button
          type="button"
          aria-label="Toggle menu"
          className="rounded-2xl border border-white/10 bg-white/5 p-2.5 text-white transition hover:bg-white/10 lg:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Moving Light Bottom Line */}
      <div className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-full overflow-hidden bg-white/5">
        <span className="adra-header-light absolute left-0 top-0 h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-pink-400 to-transparent shadow-[0_0_18px_rgba(244,114,182,0.95)]" />
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="section-padding border-t border-white/10 bg-black/95 py-5 lg:hidden">
          <nav className="flex flex-col gap-2">
            <NavLink
              to="/"
              className={mobileLinkClass}
              onClick={() => setOpen(false)}
            >
              Home
            </NavLink>

            <NavLink
              to="/services"
              className={mobileLinkClass}
              onClick={() => setOpen(false)}
            >
              Services
            </NavLink>

            <NavLink
              to="/products"
              className={mobileLinkClass}
              onClick={() => setOpen(false)}
            >
              Products
            </NavLink>

            <NavLink
              to="/events"
              className={mobileLinkClass}
              onClick={() => setOpen(false)}
            >
              Events
            </NavLink>

            <NavLink
              to="/gallery"
              className={mobileLinkClass}
              onClick={() => setOpen(false)}
            >
              Gallery
            </NavLink>

            <NavLink
              to="/contact"
              className={mobileLinkClass}
              onClick={() => setOpen(false)}
            >
              Contact
            </NavLink>

            <Link
              to="/admin/login"
              onClick={() => setOpen(false)}
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-2xl border border-pink-400/30 bg-pink-500/10 px-5 py-3 text-sm font-bold text-pink-100 transition hover:bg-pink-500/20 hover:text-white"
            >
              <ShieldCheck size={17} />
              Admin Login
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
