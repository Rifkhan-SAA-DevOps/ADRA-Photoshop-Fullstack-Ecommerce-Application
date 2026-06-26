import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Edit3 } from "lucide-react";
import api from "../../lib/api.js";

export default function ProductView() {
  const { id } = useParams();
  const [item, setItem] = useState(null);

  useEffect(() => {
    api.get("/products?admin=true").then((res) => {
      setItem(res.data.find((product) => String(product.id) === String(id)));
    });
  }, [id]);

  if (!item) return <p className="text-white/60">Loading product...</p>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <Link to="/admin/products" className="btn-secondary">
          <ArrowLeft size={18} /> Back
        </Link>
        <Link to={`/admin/products/${id}/edit`} className="btn-primary">
          <Edit3 size={18} /> Edit Product
        </Link>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05]">
        {item.cover_image && (
          <img src={item.cover_image} alt={item.name} className="h-[420px] w-full object-cover" />
        )}

        <div className="p-8">
          <p className="mb-3 rounded-full bg-violet-500/20 px-4 py-2 text-sm font-bold text-violet-100 w-fit">
            {item.category}
          </p>
          <h1 className="text-4xl font-black">{item.name}</h1>
          <p className="mt-4 text-2xl font-black text-pink-200">
            LKR {Number(item.price || 0).toLocaleString()}
          </p>
          <p className="mt-6 leading-8 text-white/65">{item.description}</p>
          <p className="mt-6 text-sm text-white/45">Status: {item.status}</p>
        </div>
      </div>
    </div>
  );
}