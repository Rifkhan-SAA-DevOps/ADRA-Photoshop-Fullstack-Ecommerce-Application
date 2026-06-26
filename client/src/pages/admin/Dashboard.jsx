import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  MessageSquareText,
  Package,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  WandSparkles,
} from "lucide-react";
import api from "../../lib/api.js";

export default function Dashboard() {
  const [stats, setStats] = useState({
    services: 0,
    products: 0,
    events: 0,
    newBookings: 0,
    newContacts: 0,
    pendingReviews: 0,
    admins: 0,
    customerRecords: 0,
  });

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  function loadDashboard() {
    setLoading(true);

    api
      .get("/dashboard")
      .then((res) => {
        setStats({
          services: res.data.services || 0,
          products: res.data.products || 0,
          events: res.data.events || 0,
          newBookings: res.data.newBookings || 0,
          newContacts: res.data.newContacts || 0,
          pendingReviews: res.data.pendingReviews || 0,
          admins: res.data.admins || 0,
          customerRecords: res.data.customerRecords || 0,
        });

        setLastUpdated(new Date());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const totalContent = stats.services + stats.products + stats.events;
  const totalAttention =
    stats.newBookings + stats.newContacts + stats.pendingReviews;

  const cards = [
    {
      label: "Services",
      value: stats.services,
      icon: WandSparkles,
      path: "/admin/services",
      color: "from-pink-500/25 to-rose-500/10",
      iconColor: "text-pink-200",
      note: "Manage photography services",
    },
    {
      label: "Products",
      value: stats.products,
      icon: Package,
      path: "/admin/products",
      color: "from-violet-500/25 to-purple-500/10",
      iconColor: "text-violet-200",
      note: "Albums, frames, packages",
    },
    {
      label: "Events",
      value: stats.events,
      icon: CalendarDays,
      path: "/admin/events",
      color: "from-blue-500/25 to-cyan-500/10",
      iconColor: "text-blue-200",
      note: "Convocation and offers",
    },
    {
      label: "Customers",
      value: stats.customerRecords,
      icon: Users,
      path: "/admin/customers",
      color: "from-emerald-500/25 to-green-500/10",
      iconColor: "text-emerald-200",
      note: "Customer records",
    },
    {
      label: "Admin users",
      value: stats.admins,
      icon: ShieldCheck,
      path: "/admin/users",
      color: "from-amber-500/25 to-orange-500/10",
      iconColor: "text-amber-200",
      note: "Team access",
    },
    {
      label: "New bookings",
      value: stats.newBookings,
      icon: Clock,
      path: "/admin/bookings",
      color: "from-cyan-500/25 to-sky-500/10",
      iconColor: "text-cyan-200",
      note: "Need confirmation",
      attention: stats.newBookings > 0,
    },
    {
      label: "New contacts",
      value: stats.newContacts,
      icon: MessageSquareText,
      path: "/admin/contacts",
      color: "from-fuchsia-500/25 to-pink-500/10",
      iconColor: "text-fuchsia-200",
      note: "Customer requests",
      attention: stats.newContacts > 0,
    },
    {
      label: "Pending reviews",
      value: stats.pendingReviews,
      icon: Star,
      path: "/admin/reviews",
      color: "from-yellow-500/25 to-orange-500/10",
      iconColor: "text-yellow-200",
      note: "Approve or reject",
      attention: stats.pendingReviews > 0,
    },
  ];

  const quickActions = [
    {
      title: "Add service",
      path: "/admin/services",
      text: "Create new service package",
      icon: WandSparkles,
    },
    {
      title: "Add product",
      path: "/admin/products",
      text: "Upload albums or frames",
      icon: Package,
    },
    {
      title: "Add event",
      path: "/admin/events",
      text: "Promote upcoming event",
      icon: CalendarDays,
    },
    {
      title: "Check reviews",
      path: "/admin/reviews",
      text: "Approve customer reviews",
      icon: Star,
    },
  ];

  const activityItems = useMemo(() => {
    return [
      {
        title: `${stats.newBookings} new booking request${
          stats.newBookings === 1 ? "" : "s"
        }`,
        text:
          stats.newBookings > 0
            ? "Review and confirm customer bookings."
            : "No new booking requests at the moment.",
        path: "/admin/bookings",
        active: stats.newBookings > 0,
      },
      {
        title: `${stats.newContacts} new contact message${
          stats.newContacts === 1 ? "" : "s"
        }`,
        text:
          stats.newContacts > 0
            ? "Customers are waiting for your response."
            : "No new customer contact messages.",
        path: "/admin/contacts",
        active: stats.newContacts > 0,
      },
      {
        title: `${stats.pendingReviews} pending review${
          stats.pendingReviews === 1 ? "" : "s"
        }`,
        text:
          stats.pendingReviews > 0
            ? "Approve good reviews to show them on the website."
            : "All reviews are already handled.",
        path: "/admin/reviews",
        active: stats.pendingReviews > 0,
      },
    ];
  }, [stats]);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-pink-500/20 via-white/[0.06] to-violet-500/20 p-6 shadow-2xl md:p-8">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-pink-400/20 blur-3xl" />
        <div className="absolute -bottom-20 left-1/2 h-52 w-52 rounded-full bg-violet-400/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-pink-100">
              <Sparkles size={16} /> Admin control center
            </p>

            <h1 className="text-4xl font-black md:text-5xl">
              Dashboard Overview
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">
              Manage services, products, events, customers, bookings, contacts,
              and reviews from one modern admin dashboard.
            </p>

            {lastUpdated && (
              <p className="mt-3 text-xs font-bold uppercase tracking-widest text-white/35">
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-black text-black transition hover:bg-pink-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw
              size={18}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-white/50">
            <Activity size={17} className="text-pink-300" /> Total content
          </p>
          <p className="text-4xl font-black">{totalContent}</p>
          <p className="mt-2 text-sm text-white/45">
            Services + products + events
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-white/50">
            <Clock size={17} className="text-yellow-300" /> Needs attention
          </p>
          <p className="text-4xl font-black">{totalAttention}</p>
          <p className="mt-2 text-sm text-white/45">
            Bookings, contacts, and reviews
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-white/50">
            <CheckCircle2 size={17} className="text-emerald-300" /> Status
          </p>
          <p className="text-3xl font-black">
            {totalAttention > 0 ? "Action needed" : "All clear"}
          </p>
          <p className="mt-2 text-sm text-white/45">
            {totalAttention > 0
              ? "Some items need admin review."
              : "No urgent items right now."}
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.label}
              to={card.path}
              className={`group relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br ${card.color} p-6 shadow-2xl transition duration-500 hover:-translate-y-1 hover:border-white/25`}
            >
              {card.attention && (
                <span className="absolute right-5 top-5 h-3 w-3 rounded-full bg-pink-400 shadow-[0_0_18px_rgba(244,114,182,0.9)]" />
              )}

              <div className="mb-8 flex items-start justify-between">
                <span className="grid h-13 w-13 place-items-center rounded-2xl border border-white/10 bg-black/25 p-3 backdrop-blur-xl">
                  <Icon size={25} className={card.iconColor} />
                </span>

                <ArrowRight
                  size={18}
                  className="text-white/35 transition group-hover:translate-x-1 group-hover:text-white"
                />
              </div>

              <p className="text-sm font-bold text-white/55">{card.label}</p>

              <div className="mt-3 flex items-end justify-between gap-4">
                <p className="text-4xl font-black">{card.value}</p>
              </div>

              <p className="mt-3 text-sm text-white/45">{card.note}</p>

              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-white/70 transition-all duration-700"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(12, Number(card.value || 0) * 12),
                    )}%`,
                  }}
                />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-pink-300">
                Admin tasks
              </p>
              <h2 className="mt-2 text-2xl font-black">Recent attention</h2>
            </div>
          </div>

          <div className="space-y-4">
            {activityItems.map((item) => (
              <Link
                key={item.title}
                to={item.path}
                className={`group flex items-center justify-between gap-4 rounded-[1.5rem] border p-4 transition ${
                  item.active
                    ? "border-pink-300/30 bg-pink-400/10"
                    : "border-white/10 bg-black/20 hover:bg-white/10"
                }`}
              >
                <div>
                  <p className="font-black">{item.title}</p>
                  <p className="mt-1 text-sm text-white/50">{item.text}</p>
                </div>

                <ArrowRight
                  size={18}
                  className="text-white/35 transition group-hover:translate-x-1 group-hover:text-white"
                />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-300">
              Shortcuts
            </p>
            <h2 className="mt-2 text-2xl font-black">Quick actions</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.title}
                  to={action.path}
                  className="group flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 transition hover:-translate-y-1 hover:bg-white/10"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
                    <Icon size={20} className="text-pink-200" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block font-black">{action.title}</span>
                    <span className="mt-1 block text-sm text-white/45">
                      {action.text}
                    </span>
                  </span>

                  <ArrowRight
                    size={17}
                    className="text-white/35 transition group-hover:translate-x-1 group-hover:text-white"
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}