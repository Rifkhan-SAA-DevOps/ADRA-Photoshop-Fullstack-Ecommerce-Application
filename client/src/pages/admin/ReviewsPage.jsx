import { useEffect, useState } from 'react';
import api from '../../lib/api.js';
import { ReviewStars } from '../../components/Card.jsx';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);

  async function loadReviews() {
    const res = await api.get('/reviews');
    setReviews(res.data);
  }

  useEffect(() => {
    loadReviews().catch(() => {});
  }, []);

  async function approve(id, is_approved) {
    await api.patch(`/reviews/${id}`, { is_approved });
    await loadReviews();
  }

  async function remove(id) {
    if (!confirm('Delete this review?')) return;
    await api.delete(`/reviews/${id}`);
    await loadReviews();
  }

  return (
    <div>
      <h1 className="mb-8 text-4xl font-black">Product Reviews</h1>
      <div className="grid gap-4">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black">{review.customer_name}</h3>
                <p className="text-sm text-white/50">{review.product_name}</p>
              </div>
              <ReviewStars rating={review.rating} />
            </div>
            <p className="text-white/65">{review.comment}</p>
            <p className="mt-3 text-sm text-white/45">Status: {review.is_approved ? 'Approved' : 'Pending'}</p>
            <div className="mt-4 flex gap-2">
              <button className="rounded-xl bg-green-500/20 px-4 py-2 text-sm text-green-200" onClick={() => approve(review.id, true)}>Approve</button>
              <button className="rounded-xl bg-yellow-500/20 px-4 py-2 text-sm text-yellow-200" onClick={() => approve(review.id, false)}>Unapprove</button>
              <button className="rounded-xl bg-red-500/20 px-4 py-2 text-sm text-red-200" onClick={() => remove(review.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
