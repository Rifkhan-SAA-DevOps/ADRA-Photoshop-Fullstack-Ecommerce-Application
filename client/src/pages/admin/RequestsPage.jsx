import { useEffect, useState } from 'react';
import api from '../../lib/api.js';

export default function RequestsPage({ type }) {
  const [items, setItems] = useState([]);
  const isBookings = type === 'bookings';

  async function loadItems() {
    const res = await api.get(isBookings ? '/bookings' : '/contact');
    setItems(res.data);
  }

  useEffect(() => {
    loadItems().catch(() => {});
  }, [type]);

  async function updateStatus(id, status) {
    await api.patch(isBookings ? `/bookings/${id}` : `/contact/${id}`, { status });
    await loadItems();
  }

  async function remove(id) {
    if (!confirm('Delete this request?')) return;
    await api.delete(isBookings ? `/bookings/${id}` : `/contact/${id}`);
    await loadItems();
  }

  return (
    <div>
      <h1 className="mb-8 text-4xl font-black">{isBookings ? 'Event Bookings' : 'Contact Requests'}</h1>
      <div className="overflow-x-auto rounded-[2rem] border border-white/10 bg-white/[0.04]">
        <table className="admin-table w-full min-w-[900px]">
          <thead>
            <tr>
              <th>Name</th><th>Phone</th><th>Email</th><th>Service/Event</th><th>Message</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td className="font-semibold">{item.customer_name || item.name}</td>
                <td>{item.phone}</td>
                <td>{item.email}</td>
                <td>{item.event_title || item.service_needed || item.service_type}</td>
                <td className="max-w-xs text-white/60">{item.message}</td>
                <td>{item.status}</td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    {['new', 'contacted', 'confirmed', 'completed', 'cancelled'].map((status) => (
                      <button key={status} className="rounded-xl bg-white/10 px-3 py-2 text-xs" onClick={() => updateStatus(item.id, status)}>{status}</button>
                    ))}
                    <button className="rounded-xl bg-red-500/20 px-3 py-2 text-xs text-red-200" onClick={() => remove(item.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
