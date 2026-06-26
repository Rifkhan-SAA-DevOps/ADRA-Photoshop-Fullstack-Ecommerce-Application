import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import api from "../lib/api.js";
import { fallbackServices } from "../lib/fallback.js";
import BackButton from "../components/BackButton.jsx";
import default_services from "./../docs/images/default_services.png";

export default function ServiceDetail() {
  const { slug } = useParams();
  const [service, setService] = useState(
    fallbackServices.find((item) => item.slug === slug) || fallbackServices[0],
  );
  const image =
    service.cover_image || service.images?.[0]?.image_url || default_services;

  useEffect(() => {
    api
      .get(`/services/${slug}`)
      .then((res) => setService(res.data))
      .catch(() => {});
  }, [slug]);

  return (
    <section className="section-padding py-16">
      <BackButton fallback="/services" label="Back to services" />
      <div className="container-max grid gap-10 lg:grid-cols-2 lg:items-start">
        <div className="overflow-hidden rounded-[2rem] border border-white/10">
          <img
            src={image}
            alt={service.title}
            className="h-[520px] w-full object-cover"
          />
        </div>
        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-pink-300">
            Service
          </p>
          <h1 className="text-5xl font-black">{service.title}</h1>
          <p className="mt-5 text-2xl font-bold text-violet-200">
            From LKR {Number(service.price_from || 0).toLocaleString()}
          </p>
          <p className="mt-6 text-lg leading-8 text-white/65">
            {service.description}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              "Professional editing",
              "High-resolution delivery",
              "Friendly direction",
              "Custom packages",
            ].map((item) => (
              <p
                key={item}
                className="flex items-center gap-2 rounded-2xl bg-white/10 p-4 text-sm text-white/70"
              >
                <CheckCircle2 size={18} className="text-pink-300" /> {item}
              </p>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/contact"
              state={{ service: service.title }}
              className="btn-primary"
            >
              Request this service <ArrowRight size={18} />
            </Link>
            <Link to="/products" className="btn-secondary">
              View products
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
