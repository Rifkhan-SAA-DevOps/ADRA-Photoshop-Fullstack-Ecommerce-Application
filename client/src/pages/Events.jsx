import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api.js";
import { fallbackEvents } from "../lib/fallback.js";
import PageHero from "../components/PageHero.jsx";
import { ArrowRight, Calendar, Clock, Filter, MapPin, X } from "lucide-react";
import default_events from "./../docs/images/default_events.png";

function getDateOnly(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  return date.toISOString().split("T")[0];
}

function isToday(dateValue) {
  const today = getDateOnly(new Date());
  return getDateOnly(dateValue) === today;
}

function isUpcoming(dateValue) {
  const eventDate = new Date(dateValue).getTime();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return eventDate >= todayStart.getTime();
}

function EventGridCard({ event }) {
  const date = new Date(event.event_date);

  const image =
    event.cover_image ||
    event.images?.[0]?.image_url ||
    default_events;

  return (
    <Link
      to={`/events/${event.slug}`}
      className="group flex h-full min-h-[520px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] shadow-2xl transition duration-500 hover:-translate-y-2 hover:border-pink-300/40 hover:bg-white/[0.08]"
    >
      <div className="h-64 overflow-hidden">
        <img
          src={image}
          alt={event.title}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
        />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-pink-500/20 px-3 py-1 text-xs font-bold text-pink-100">
          <Calendar size={13} />
          {date.toLocaleDateString()} •{" "}
          {date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        <h3 className="line-clamp-2 text-2xl font-black">{event.title}</h3>

        <p className="mt-4 flex items-center gap-2 text-sm text-white/55">
          <MapPin size={15} /> {event.location}
        </p>

        <p className="mt-4 line-clamp-3 text-sm leading-7 text-white/60">
          {event.promotional_message || event.description}
        </p>

        <span className="mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-black transition group-hover:bg-pink-200">
          View event <ArrowRight size={15} />
        </span>
      </div>
    </Link>
  );
}

export default function Events() {
  const [events, setEvents] = useState(fallbackEvents);
  const [selectedDate, setSelectedDate] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    api
      .get("/events")
      .then((res) => setEvents(res.data))
      .catch(() => {});
  }, []);

  const sortedEvents = useMemo(() => {
    return [...events]
      .filter((event) => event.event_date)
      .sort(
        (a, b) =>
          new Date(a.event_date).getTime() - new Date(b.event_date).getTime(),
      );
  }, [events]);

  const todayEvents = useMemo(() => {
    return sortedEvents.filter((event) => isToday(event.event_date));
  }, [sortedEvents]);

  const filteredEvents = useMemo(() => {
    let list = sortedEvents;

    if (filterType === "today") {
      list = list.filter((event) => isToday(event.event_date));
    }

    if (filterType === "upcoming") {
      list = list.filter((event) => isUpcoming(event.event_date));
    }

    if (filterType === "past") {
      list = list.filter((event) => !isUpcoming(event.event_date));
    }

    if (selectedDate) {
      list = list.filter(
        (event) => getDateOnly(event.event_date) === selectedDate,
      );
    }

    return list;
  }, [sortedEvents, filterType, selectedDate]);

  const visibleEvents = filteredEvents.slice(0, visibleCount);
  const hasMoreEvents = visibleCount < filteredEvents.length;

  const clearFilters = () => {
    setSelectedDate("");
    setFilterType("all");
    setVisibleCount(6);
  };

  return (
    <>
      <PageHero
        title="Upcoming Events"
        subtitle="Promote special photography packages for university convocation, school functions, parties, and public events."
      />

      <section className="section-padding py-16">
        <div className="container-max">
          {todayEvents.length > 0 && (
            <div className="mb-12 rounded-[2rem] border border-white/10 bg-gradient-to-br from-pink-500/20 via-white/[0.06] to-violet-500/20 p-6 shadow-2xl md:p-8">
              <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="mb-2 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.3em] text-pink-300">
                    <Clock size={16} /> Active today
                  </p>

                  <h2 className="text-3xl font-black">
                    Today’s photography events
                  </h2>

                  <p className="mt-3 text-white/55">
                    Events happening today are highlighted here first.
                  </p>
                </div>

                <div className="rounded-full border border-white/10 bg-black/30 px-5 py-3 text-sm font-bold text-white/70">
                  {new Date().toLocaleDateString()}
                </div>
              </div>

              <div className="grid auto-rows-fr gap-6 md:grid-cols-2">
                {todayEvents.map((event) => (
                  <EventGridCard key={event.id || event.slug} event={event} />
                ))}
              </div>
            </div>
          )}

          <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="mb-5 flex items-center gap-2">
              <Filter size={18} className="text-pink-300" />
              <h3 className="text-xl font-black">Filter events</h3>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-3">
                {[
                  ["all", "All"],
                  ["today", "Today"],
                  ["upcoming", "Upcoming"],
                  ["past", "Past"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setFilterType(value);
                      setVisibleCount(6);
                    }}
                    className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                      filterType === value
                        ? "bg-pink-300 text-black"
                        : "bg-white/10 text-white hover:bg-white/15"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="flex items-center gap-3 rounded-full border border-white/10 bg-black/25 px-4 py-2">
                  <Calendar size={16} className="text-pink-300" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => {
                      setSelectedDate(event.target.value);
                      setVisibleCount(6);
                    }}
                    className="bg-transparent text-sm font-bold text-white outline-none"
                  />
                </label>

                {(selectedDate || filterType !== "all") && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold transition hover:bg-white/15"
                  >
                    <X size={15} /> Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-violet-300">
              More events
            </p>

            <h2 className="text-3xl font-black">Explore all event packages</h2>
          </div>

          {visibleEvents.length > 0 ? (
            <>
              <div className="grid auto-rows-fr gap-6 md:grid-cols-2">
                {visibleEvents.map((event) => (
                  <EventGridCard key={event.id || event.slug} event={event} />
                ))}
              </div>

              {hasMoreEvents && (
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + 6)}
                    className="btn-secondary"
                  >
                    Show more events
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center">
              <p className="text-xl font-black">No events found</p>
              <p className="mt-3 text-white/50">
                Try changing the date or filter option.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
