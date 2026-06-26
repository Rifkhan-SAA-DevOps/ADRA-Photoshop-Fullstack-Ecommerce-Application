export const PRODUCT_CATEGORIES = [
  "Photo frames",
  "Duro frames",
  "Engraving frame",
  "Mugs",
  "Bottle",
  "Plate",
  "Pillow",
  "Pen",
  "ID card",
  "Tshirt",
  "Event flags",
  "Banner",
  "Sticker",
  "Wedding Album",
  "Key tag - Resin",
  "Key tag - Engrave",
  "Key tag - Sublimation keytag",
];

export function getStoredCategories() {
  try {
    return JSON.parse(localStorage.getItem("admin_product_categories") || "[]");
  } catch {
    return [];
  }
}

export function saveStoredCategories(categories) {
  localStorage.setItem("admin_product_categories", JSON.stringify(categories));
}