import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, MapPin, Star } from 'lucide-react';

export function ServiceCard({ service }) {
  return (
    <Link to={`/services/${service.slug}`} className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] transition hover:-translate-y-1 hover:bg-white/[0.09]">
      <div className="h-60 overflow-hidden">
        <img src={service.cover_image} alt={service.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
      </div>
      <div className="p-6">
        <p className="mb-3 text-sm font-semibold text-pink-300">From LKR {Number(service.price_from || 0).toLocaleString()}</p>
        <h3 className="mb-3 text-2xl font-black">{service.title}</h3>
        <p className="mb-5 line-clamp-3 text-sm leading-7 text-white/55">{service.short_description || service.description}</p>
        <span className="inline-flex items-center gap-2 text-sm font-bold text-white">View service <ArrowRight size={16} /></span>
      </div>
    </Link>
  );
}

export function ProductCard({ product }) {
  return (
    <Link to={`/products/${product.slug}`} className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] transition hover:-translate-y-1 hover:bg-white/[0.09]">
      <div className="h-60 overflow-hidden">
        <img src={product.cover_image} alt={product.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
      </div>
      <div className="p-6">
        <p className="mb-3 text-sm font-semibold text-violet-300">{product.category}</p>
        <h3 className="mb-3 text-2xl font-black">{product.name}</h3>
        <p className="mb-5 text-lg font-bold">LKR {Number(product.price || 0).toLocaleString()}</p>
        <span className="inline-flex items-center gap-2 text-sm font-bold text-white">View product <ArrowRight size={16} /></span>
      </div>
    </Link>
  );
}

export function EventCard({ event }) {
  const date = new Date(event.event_date);
  return (
    <Link to={`/events/${event.slug}`} className="group grid overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] transition hover:-translate-y-1 hover:bg-white/[0.09] md:grid-cols-5">
      <div className="h-72 overflow-hidden md:col-span-2 md:h-full">
        <img src={event.cover_image} alt={event.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
      </div>
      <div className="p-7 md:col-span-3">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-pink-500/15 px-4 py-2 text-sm text-pink-200">
          <Calendar size={16} /> {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <h3 className="mb-4 text-2xl font-black">{event.title}</h3>
        <p className="mb-4 flex items-center gap-2 text-sm text-white/55"><MapPin size={16} /> {event.location}</p>
        <p className="mb-5 text-sm leading-7 text-white/60">{event.promotional_message || event.description}</p>
        <span className="inline-flex items-center gap-2 text-sm font-bold text-white">Book for this event <ArrowRight size={16} /></span>
      </div>
    </Link>
  );
}

export function ReviewStars({ rating = 5 }) {
  return (
    <span className="flex gap-1 text-yellow-300">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} size={16} fill={index < rating ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
}
