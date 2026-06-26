import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../lib/api.js";
import { fallbackProducts } from "../lib/fallback.js";
import { ReviewStars } from "../components/Card.jsx";
import BackButton from "../components/BackButton.jsx";

function validatePhone(phone) {
  const cleanPhone = String(phone || "").replace(/\s+/g, "");
  return /^[0-9+]{9,15}$/.test(cleanPhone);
}

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(
    fallbackProducts.find((item) => item.slug === slug) || fallbackProducts[0],
  );

  const [orderForm, setOrderForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    count: 1,
    address: "",
    message: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [message, setMessage] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const image =
    product.cover_image ||
    product.images?.[0]?.image_url ||
    fallbackProducts[0]?.cover_image ||
    "";

  const totalPrice = useMemo(() => {
    const price = Number(product.price || 0);
    const count = Number(orderForm.count || 1);
    return price * count;
  }, [product.price, orderForm.count]);

  useEffect(() => {
    api
      .get(`/products/${slug}`)
      .then((res) => setProduct(res.data))
      .catch(() => {});
  }, [slug]);

  function updateOrderField(field, value) {
    setOrderForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFormErrors((current) => ({
      ...current,
      [field]: "",
    }));

    setMessage("");
  }

  function validateOrderForm() {
    const errors = {};
    const cleanName = String(orderForm.customer_name || "").trim();
    const cleanPhone = String(orderForm.phone || "").trim();
    const cleanEmail = String(orderForm.email || "").trim();
    const count = Number(orderForm.count || 0);

    if (!cleanName) {
      errors.customer_name = "Please enter your name.";
    }

    if (!cleanPhone) {
      errors.phone = "Please enter your phone number.";
    } else if (!validatePhone(cleanPhone)) {
      errors.phone = "Please enter a valid phone number.";
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!Number.isFinite(count) || count < 1) {
      errors.count = "Please enter a valid quantity.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submitOrder(event) {
    event.preventDefault();
    setMessage("");

    const isValid = validateOrderForm();

    if (!isValid) {
      setMessage("Please correct the highlighted fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customer_name: orderForm.customer_name.trim(),
        phone: orderForm.phone.trim(),
        email: orderForm.email.trim(),
        count: Number(orderForm.count || 1),
        address: orderForm.address.trim(),
        message: orderForm.message.trim(),
      };

      await api.post(`/products/${product.id || slug}/order`, payload);

      setShowSuccessAlert(true);

      setOrderForm({
        customer_name: "",
        phone: "",
        email: "",
        count: 1,
        address: "",
        message: "",
      });

      setFormErrors({});
      setMessage("");
    } catch (error) {
      const backendErrors = error.response?.data?.errors || {};

      setFormErrors(backendErrors);

      setMessage(
        error.response?.data?.message ||
          "Please check your details and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="section-padding py-16">
      <BackButton fallback="/products" label="Back to products" />

      {showSuccessAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-green-300/20 bg-[#12091f] p-7 text-center shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-green-400" />

            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-4xl">
              ✅
            </div>

            <h2 className="text-3xl font-black text-white">
              Order request sent!
            </h2>

            <p className="mt-4 text-sm leading-7 text-white/65">
              Your order request has been sent to the admin successfully. We
              will contact you soon to confirm your order.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
              <p className="text-sm text-white/55">Product</p>
              <p className="font-bold text-white">{product.name}</p>

              <p className="mt-3 text-sm text-white/55">Estimated total</p>
              <p className="font-bold text-pink-200">
                LKR {Number(totalPrice || 0).toLocaleString()}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/products")}
                className="btn-primary flex-1"
              >
                Back to products
              </button>

              <button
                type="button"
                onClick={() => setShowSuccessAlert(false)}
                className="btn-secondary flex-1"
              >
                Stay here
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container-max grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-[2rem] border border-white/10">
          <img
            src={image}
            alt={product.name}
            className="h-[520px] w-full object-cover"
          />
        </div>

        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-violet-300">
            {product.category}
          </p>

          <h1 className="text-5xl font-black">{product.name}</h1>

          <p className="mt-5 text-2xl font-bold text-pink-200">
            LKR {Number(product.price || 0).toLocaleString()}
          </p>

          <p className="mt-6 text-lg leading-8 text-white/65">
            {product.description}
          </p>
        </div>
      </div>

      <div className="container-max mt-14 grid gap-8 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-7">
          <h2 className="mb-5 text-2xl font-black">Customer reviews</h2>

          <div className="space-y-4">
            {(product.reviews || []).length ? (
              product.reviews.map((review) => (
                <div key={review.id} className="rounded-3xl bg-white/10 p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <strong>{review.customer_name}</strong>
                    <ReviewStars rating={review.rating} />
                  </div>

                  <p className="text-sm text-white/60">{review.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-white/55">No approved reviews yet.</p>
            )}
          </div>
        </div>

        <form
          onSubmit={submitOrder}
          className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-7"
        >
          <h2 className="mb-2 text-2xl font-black">Order this product</h2>

          <p className="mb-5 text-sm text-white/55">
            Fill your details and quantity. Your order request will be sent to
            the admin.
          </p>

          <div className="grid gap-4">
            <div>
              <input
                className={`input-field ${
                  formErrors.customer_name ? "border-red-400/70" : ""
                }`}
                placeholder="Customer name"
                value={orderForm.customer_name}
                onChange={(e) =>
                  updateOrderField("customer_name", e.target.value)
                }
                required
              />

              {formErrors.customer_name && (
                <p className="mt-2 text-xs font-semibold text-red-300">
                  {formErrors.customer_name}
                </p>
              )}
            </div>

            <div>
              <input
                className={`input-field ${
                  formErrors.phone ? "border-red-400/70" : ""
                }`}
                placeholder="Phone number"
                value={orderForm.phone}
                onChange={(e) => updateOrderField("phone", e.target.value)}
                required
              />

              {formErrors.phone && (
                <p className="mt-2 text-xs font-semibold text-red-300">
                  {formErrors.phone}
                </p>
              )}
            </div>

            <div>
              <input
                className={`input-field ${
                  formErrors.email ? "border-red-400/70" : ""
                }`}
                placeholder="Email address optional"
                type="email"
                value={orderForm.email}
                onChange={(e) => updateOrderField("email", e.target.value)}
              />

              {formErrors.email && (
                <p className="mt-2 text-xs font-semibold text-red-300">
                  {formErrors.email}
                </p>
              )}
            </div>

            <div>
              <input
                className={`input-field ${
                  formErrors.count ? "border-red-400/70" : ""
                }`}
                placeholder="Count"
                type="number"
                min="1"
                value={orderForm.count}
                onChange={(e) => updateOrderField("count", e.target.value)}
                required
              />

              {formErrors.count && (
                <p className="mt-2 text-xs font-semibold text-red-300">
                  {formErrors.count}
                </p>
              )}
            </div>

            <div>
              <textarea
                className={`input-field min-h-24 ${
                  formErrors.address ? "border-red-400/70" : ""
                }`}
                placeholder="Delivery address optional"
                value={orderForm.address}
                onChange={(e) => updateOrderField("address", e.target.value)}
              />

              {formErrors.address && (
                <p className="mt-2 text-xs font-semibold text-red-300">
                  {formErrors.address}
                </p>
              )}
            </div>

            <div>
              <textarea
                className={`input-field min-h-28 ${
                  formErrors.message ? "border-red-400/70" : ""
                }`}
                placeholder="Additional message optional"
                value={orderForm.message}
                onChange={(e) => updateOrderField("message", e.target.value)}
              />

              {formErrors.message && (
                <p className="mt-2 text-xs font-semibold text-red-300">
                  {formErrors.message}
                </p>
              )}
            </div>

            {formErrors.product && (
              <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm font-semibold text-red-200">
                {formErrors.product}
              </p>
            )}

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-sm text-white/50">Estimated total</p>

              <p className="mt-1 text-2xl font-black text-pink-200">
                LKR {Number(totalPrice || 0).toLocaleString()}
              </p>
            </div>

            <button className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Sending order..." : "Submit order"}
            </button>

            {message && <p className="text-sm text-pink-200">{message}</p>}
          </div>
        </form>
      </div>
    </section>
  );
}