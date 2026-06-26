import twilio from 'twilio';

export function buildAdminMessage(type, data) {
  const lines = [
    `New ${type} request`,
    `Name: ${data.name || data.customer_name || '-'}`,
    `Phone: ${data.phone || '-'}`,
    `Email: ${data.email || '-'}`,
    `Service: ${data.service_type || data.service_needed || '-'}`,
    `Message: ${data.message || '-'}`
  ];
  return lines.join('\n');
}

export async function notifyAdmin(type, data) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  const to = process.env.ADMIN_NOTIFY_PHONE;

  if (!sid || !token || !from || !to) {
    return { sent: false, reason: 'Twilio is not configured. Request saved in dashboard.' };
  }

  const client = twilio(sid, token);
  await client.messages.create({
    from,
    to,
    body: buildAdminMessage(type, data)
  });

  return { sent: true };
}
