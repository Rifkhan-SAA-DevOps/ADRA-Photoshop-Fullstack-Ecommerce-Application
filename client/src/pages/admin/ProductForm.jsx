import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Save, X } from "lucide-react";

import api from "../../lib/api.js";
import MultiImageInput from "../../components/MultiImageInput.jsx";
import { appendImagesToFormData } from "../../lib/buildResourceFormData.js";
import {
  PRODUCT_CATEGORIES,
  getStoredCategories,
  saveStoredCategories,
} from "./productCategories.jsx";

const emptyProduct = {
  name: "",
  category: "",
  description: "",
  price: "",
  status: "active",
};

function normalizeExistingImages(product) {
  const productImages = Array.isArray(product.images) ? product.images : [];

  const images = productImages
    .map((image, index) => ({
      id: image.id || `existing_${index}`,
      image_url: image.image_url || image.url || "",
      caption: image.caption || "",
      isNew: false,
    }))
    .filter((image) => image.image_url);

  if (!images.length && product.cover_image) {
    images.push({
      id: "existing_cover_image",
      image_url: product.cover_image,
      caption: "",
      isNew: false,
    });
  }

  return images;
}

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyProduct);
  const [images, setImages] = useState([]);
  const [coverImage, setCoverImage] = useState(null);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [customCategories, setCustomCategories] = useState(getStoredCategories);
  const [newCategory, setNewCategory] = useState("");

  const isEdit = Boolean(id);

  const categories = useMemo(() => {
    return [...new Set([...PRODUCT_CATEGORIES, ...customCategories])];
  }, [customCategories]);

  useEffect(() => {
    if (!id) return;

    api
      .get(`/products/${id}`)
      .then((res) => {
        const product = res.data;

        setForm({
          name: product.name || "",
          category: product.category || "",
          description: product.description || "",
          price: product.price || "",
          status: product.status || "active",
        });

        const existingImages = normalizeExistingImages(product);
        setImages(existingImages);

        const selectedCover =
          existingImages.find(
            (image) => image.image_url === product.cover_image,
          ) ||
          existingImages[0] ||
          null;

        setCoverImage(selectedCover);
      })
      .catch(() => {
        setMessage("Failed to load product.");
      });
  }, [id]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function addNewCategory() {
    const category = newCategory.trim();
    if (!category) return;

    const updated = [...new Set([...customCategories, category])];
    setCustomCategories(updated);
    saveStoredCategories(updated);
    updateField("category", category);
    setNewCategory("");
  }

  async function saveProduct(event) {
    event.preventDefault();
    setMessage("");
    setIsSaving(true);

    try {
      const formData = new FormData();

      formData.append("name", form.name);
      formData.append("category", form.category || "");
      formData.append("description", form.description || "");
      formData.append("price", form.price || 0);
      formData.append("status", form.status || "active");

      appendImagesToFormData(formData, images, coverImage);

      if (isEdit) {
        await api.put(`/products/${id}`, formData);
        setMessage("Product updated successfully.");
      } else {
        await api.post("/products", formData);
        setMessage("Product created successfully.");
      }

      navigate("/admin/products");
    } catch (error) {
      setMessage(error.response?.data?.message || "Save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-500/20 to-pink-500/10 p-6 shadow-2xl">
        <h1 className="text-4xl font-black">
          {isEdit ? "Edit Product" : "Add Product"}
        </h1>

        <p className="mt-3 text-white/55">
          Add product details, category, price, status, and product images.
          Images upload to S3 only after clicking{" "}
          {isEdit ? "Update Product" : "Create Product"}.
        </p>
      </div>

      <form
        onSubmit={saveProduct}
        className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="input-field"
            placeholder="Product name"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            required
          />

          <select
            className="input-field"
            value={form.category}
            onChange={(e) => updateField("category", e.target.value)}
            required
          >
            <option value="" className="text-black">
              Select category
            </option>

            {categories.map((category) => (
              <option key={category} value={category} className="text-black">
                {category}
              </option>
            ))}
          </select>

          <input
            className="input-field"
            placeholder="Add future new category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />

          <button
            type="button"
            onClick={addNewCategory}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black transition hover:bg-white/15"
          >
            <Plus size={17} /> Add Category
          </button>

          <input
            className="input-field"
            placeholder="Price"
            type="number"
            value={form.price}
            onChange={(e) => updateField("price", e.target.value)}
          />

          <select
            className="input-field"
            value={form.status}
            onChange={(e) => updateField("status", e.target.value)}
          >
            <option value="active" className="text-black">
              Active
            </option>
            <option value="offer" className="text-black">
              Offer
            </option>
            <option value="inactive" className="text-black">
              Inactive
            </option>
          </select>

          <textarea
            className="input-field min-h-32 md:col-span-2"
            placeholder="Product description"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
          />

          <div className="md:col-span-2">
          <MultiImageInput
  value={images}
  onChange={setImages}
  coverImage={coverImage}
  onCoverChange={setCoverImage}
/>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="btn-primary" disabled={isSaving}>
            <Save size={18} />
            {isSaving
              ? "Saving..."
              : isEdit
                ? "Update Product"
                : "Create Product"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="btn-secondary"
            disabled={isSaving}
          >
            <X size={18} /> Cancel
          </button>
        </div>

        {message && <p className="mt-4 text-sm text-pink-200">{message}</p>}
      </form>
    </div>
  );
}
