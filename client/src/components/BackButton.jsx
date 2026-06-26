import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Sparkles } from 'lucide-react';

export default function BackButton({ fallback = '/', label = 'Back' }) {
  const navigate = useNavigate();

  function goBack() {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  }

  return (
    <div className="container-max mb-8 flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        onClick={goBack}
        className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-sm font-bold text-white/80 shadow-2xl backdrop-blur-xl transition hover:-translate-x-1 hover:border-pink-300/40 hover:bg-white/15 hover:text-white"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-pink-500 to-violet-500 transition group-hover:rotate-[-10deg]">
          <ArrowLeft size={18} />
        </span>
        {label}
      </button>

      <Link
        to={fallback}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-3 text-sm font-semibold text-white/55 transition hover:bg-white/10 hover:text-white"
      >
        <Home size={16} /> Home <Sparkles size={14} className="text-pink-300" />
      </Link>
    </div>
  );
}
