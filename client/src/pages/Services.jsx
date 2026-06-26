import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import { fallbackServices } from '../lib/fallback.js';
import PageHero from '../components/PageHero.jsx';
import { ServiceCard } from '../components/Card.jsx';

export default function Services() {
  const [services, setServices] = useState(fallbackServices);

  useEffect(() => {
    api.get('/services').then((res) => setServices(res.data)).catch(() => {});
  }, []);

  return (
    <>
      <PageHero title="Services" subtitle="Manage and display wedding, studio, convocation, birthday, event, album, frame, and retouching services." />
      <section className="section-padding py-16">
        <div className="container-max grid gap-6 md:grid-cols-3">
          {services.map((service) => <ServiceCard key={service.id} service={service} />)}
        </div>
      </section>
    </>
  );
}
