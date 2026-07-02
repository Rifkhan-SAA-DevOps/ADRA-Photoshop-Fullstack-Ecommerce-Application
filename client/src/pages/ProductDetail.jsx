import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import api from "../lib/api.js";
import { fallbackProducts } from "../lib/fallback.js";
import { ReviewStars } from "../components/Card.jsx";
import BackButton from "../components/BackButton.jsx";

function validatePhone(phone) {
  const cleanPhone = String(phone || "").replace(/\s+/g, "");
  return /^[0-9+]{9,15}$/.test(cleanPhone);
}

function getProductImageList(productData) {
  const imageMap = new Map();

  function addImage(imageUrl, caption = "") {
    const cleanUrl = String(imageUrl || "").trim();

    if (!cleanUrl || imageMap.has(cleanUrl)) return;

    imageMap.set(cleanUrl, {
      image_url: cleanUrl,
      caption: String(caption || "").trim(),
    });
  }

  addImage(productData?.cover_image, "Cover image");

  if (Array.isArray(productData?.images)) {
    productData.images.forEach((image) => {
      if (typeof image === "string") {
        addImage(image);
        return;
      }

      addImage(image?.image_url || image?.url, image?.caption || image?.alt);
    });
  }

  if (!imageMap.size) {
    addImage(fallbackProducts[0]?.cover_image, "Default product image");
  }

  return [...imageMap.values()];
}

function getImageShape(width, height) {
  if (!width || !height) return "landscape";

  const ratio = width / height;

  if (ratio < 0.78) return "portrait";
  if (ratio > 1.22) return "landscape";
  return "square";
}

function getFrameClass(imageShape) {
  if (imageShape === "portrait") {
    return "mx-auto h-[560px] max-w-[430px] sm:h-[620px]";
  }

  if (imageShape === "square") {
    return "mx-auto h-[460px] max-w-[620px] sm:h-[560px]";
  }

  return "h-[340px] sm:h-[430px] lg:h-[520px]";
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

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageShape, setImageShape] = useState("landscape");
  const [previewImage, setPreviewImage] = useState(null);

  const productImages = useMemo(() => getProductImageList(product), [product]);

  const activeImage =
    productImages[activeImageIndex] || productImages[0] || { image_url: "" };

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

  useEffect(() => {
    setActiveImageIndex(0);
    setImageShape("landscape");
  }, [product.id, product.slug]);

  useEffect(() => {
    if (activeImageIndex >= productImages.length) {
      setActiveImageIndex(0);
    }
  }, [activeImageIndex, productImages.length]);

  useEffect(() => {
    if (productImages.length <= 1) return undefined;

    const interval = window.setInterval(() => {
      setActiveImageIndex((current) => (current + 1) % productImages.length);
    }, 4200);

    return () => window.clearInterval(interval);
  }, [productImages.length]);

  function goToPreviousImage() {
    setActiveImageIndex((current) => {
      return current === 0 ? productImages.length - 1 : current - 1;
    });
  }

  function goToNextImage() {
    setActiveImageIndex((current) => (current + 1) % productImages.length);
  }

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

      {previewImage && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 px-4 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute right-5 top-5 rounded-full border border-white/15 bg-white/10 p-3 text-white transition hover:bg-white/20"
            aria-label="Close image preview"
          >
            <X size={22} />
          </button>

          <img
            src={previewImage.image_url}
            alt={previewImage.caption || product.name}
            className="max-h-[86vh] max-w-[94vw] rounded-[2rem] object-contain shadow-2xl"
          />
        </div>
      )}

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
        <div>
          <div
            className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/30 shadow-2xl ${getFrameClass(
              imageShape,
            )}`}
          >
            <img
              key={activeImage.image_url}
              src={activeImage.image_url}
              alt={activeImage.caption || product.name}
              onLoad={(event) => {
                const imageElement = event.currentTarget;
                setImageShape(
                  getImageShape(
                    imageElement.naturalWidth,
                    imageElement.naturalHeight,
                  ),
                );
              }}
              className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

            <button
              type="button"
              onClick={() => setPreviewImage(activeImage)}
              className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/45 p-3 text-white backdrop-blur-xl transition hover:bg-white hover:text-black"
              aria-label="Open product image preview"
            >
              <Expand size={18} />
            </button>

            {productImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goToPreviousImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 p-3 text-white backdrop-blur-xl transition hover:bg-white hover:text-black"
                  aria-label="Previous product image"
                >
                  <ChevronLeft size={22} />
                </button>

                <button
                  type="button"
                  onClick={goToNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 p-3 text-white backdrop-blur-xl transition hover:bg-white hover:text-black"
                  aria-label="Next product image"
                >
                  <ChevronRight size={22} />
                </button>

                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/45 px-4 py-2 backdrop-blur-xl">
                  {productImages.map((image, index) => (
                    <button
                      key={image.image_url}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      className={`h-2.5 rounded-full transition-all ${
                        index === activeImageIndex
                          ? "w-8 bg-white"
                          : "w-2.5 bg-white/40 hover:bg-white/70"
                      }`}
                      aria-label={`Go to product image ${index + 1}`}
                    />
                  ))}
                </div>

                <p className="absolute bottom-4 right-4 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-xs font-bold text-white/80 backdrop-blur-xl">
                  {activeImageIndex + 1}/{productImages.length}
                </p>
              </>
            )}
          </div>

          {productImages.length > 1 && (
            <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
              {productImages.map((image, index) => (
                <button
                  key={image.image_url}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={`relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl border transition sm:h-24 sm:w-32 ${
                    index === activeImageIndex
                      ? "border-pink-300 ring-2 ring-pink-300/40"
                      : "border-white/10 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={image.image_url}
                    alt={image.caption || `${product.name} ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
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