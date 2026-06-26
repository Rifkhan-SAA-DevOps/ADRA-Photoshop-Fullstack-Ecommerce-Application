import { useEffect, useState } from 'react';
import api from '../../lib/api.js';

export default function SettingsPage() {
  const [settings, setSettings] = useState({ studio_name: '', admin_phone: '', whatsapp_number: '', address: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/settings').then((res) => setSettings((current) => ({ ...current, ...res.data }))).catch(() => {});
  }, []);

  async function save(event) {
    event.preventDefault();
    setMessage('');
    try {
      await api.put('/settings', settings);
      setMessage('Settings updated.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not update settings.');
    }
  }

  return (
    <div>
      <h1 className="mb-8 text-4xl font-black">Site Settings</h1>
      <form onSubmit={save} className="max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
        <div className="grid gap-4">
          <input className="input-field" placeholder="Studio name" value={settings.studio_name || ''} onChange={(e) => setSettings({ ...settings, studio_name: e.target.value })} />
          <input className="input-field" placeholder="Admin phone number" value={settings.admin_phone || ''} onChange={(e) => setSettings({ ...settings, admin_phone: e.target.value })} />
          <input className="input-field" placeholder="WhatsApp number" value={settings.whatsapp_number || ''} onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })} />
          <input className="input-field" placeholder="Address" value={settings.address || ''} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
          <button className="btn-primary">Save settings</button>
          {message && <p className="text-sm text-pink-200">{message}</p>}
        </div>
      </form>
    </div>
  );
}
