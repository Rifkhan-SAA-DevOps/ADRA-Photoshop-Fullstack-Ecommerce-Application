import { useEffect, useMemo, useState } from 'react';
import { Mail, Phone, Search, UserRoundCheck } from 'lucide-react';
import api from '../../lib/api.js';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  async function loadCustomers() {
    const res = await api.get('/customers');
    setCustomers(res.data);
  }

  useEffect(() => {
    loadCustomers().catch(() => setMessage('Customer data could not be loaded.'));
  }, []);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return customers;
    return customers.filter((item) => [item.name, item.email, item.phone, item.source, item.related_item, item.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [customers, search]);

  return (
    <div>
      <h1 className="mb-8 text-4xl font-black">Customer Management</h1>
      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input className="input-field pl-11" placeholder="Search customers by name, phone, email, source, product, event, or status" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-bold text-pink-200">
          {filtered.length} customer records
        </div>
      </div>

      {message && <p className="mb-4 rounded-2xl bg-red-500/10 p-4 text-red-100">{message}</p>}

      <div className="grid gap-4 xl:grid-cols-2">
        {filtered.map((item, index) => (
          <div key={`${item.source}-${item.id}-${index}`} className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-pink-500/15 px-3 py-1 text-xs font-bold text-pink-100"><UserRoundCheck size={14} /> {item.source}</p>
                <h2 className="text-2xl font-black">{item.name || 'Unnamed customer'}</h2>
                <p className="mt-1 text-sm text-white/45">{item.related_item || 'General request'}</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/60">{item.status || 'new'}</span>
            </div>
            <div className="grid gap-3 text-sm text-white/60 sm:grid-cols-2">
              <p className="flex items-center gap-2"><Phone size={16} className="text-violet-300" /> {item.phone || 'No phone'}</p>
              <p className="flex items-center gap-2"><Mail size={16} className="text-pink-300" /> {item.email || 'No email'}</p>
            </div>
            {item.message && <p className="mt-4 rounded-2xl bg-black/20 p-4 text-sm leading-7 text-white/60">{item.message}</p>}
            <p className="mt-4 text-xs text-white/35">Last activity: {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
