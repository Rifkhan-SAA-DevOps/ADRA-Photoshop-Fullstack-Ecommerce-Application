import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  PackageSearch,
  Search,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import api from "../lib/api.js";
import { fallbackProducts } from "../lib/fallback.js";
import PageHero from "../components/PageHero.jsx";
import default_products from "./../docs/images/default_products.png";

const PER_PAGE = 8;

function getProductPrice(product) {
  return Number(product.price || product.price_from || 0);
}

function getOfferPrice(product) {
  return Number(
    product.offer_price ||
      product.discount_price ||
      product.sale_price ||
      product.special_price ||
      0,
  );
}

function isOfferProduct(product) {
  const price = getProductPrice(product);
  const offerPrice = getOfferPrice(product);
  const oldPrice = Number(product.old_price || product.regular_price || 0);

  return (
    product.is_offer === true ||
    product.on_offer === true ||
    product.is_featured === true ||
    product.status === "offer" ||
    product.tag === "offer" ||
    offerPrice > 0 ||
    (oldPrice > 0 && price > 0 && oldPrice > price)
  );
}

function ProductGridCard({ product }) {
  const price = getProductPrice(product);
  const offerPrice = getOfferPrice(product);
  const oldPrice = Number(product.old_price || product.regular_price || 0);
  const hasOffer = isOfferProduct(product);

  const image =
    product.cover_image || product.images?.[0]?.image_url || default_products;

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group flex h-full min-h-[500px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] shadow-2xl transition duration-500 hover:-translate-y-2 hover:border-violet-300/40 hover:bg-white/[0.08]"
    >
      <div className="relative h-64 overflow-hidden">
        <img
          src={image}
          alt={product.name}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
        />

        {hasOffer && (
          <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-pink-500 px-4 py-2 text-xs font-black text-white shadow-xl">
            <Tag size={13} /> Offer
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="mb-3 w-fit rounded-full bg-violet-500/20 px-3 py-1 text-xs font-bold text-violet-100">
          {product.category || "Product"}
        </p>

        <h3 className="line-clamp-2 text-2xl font-black">{product.name}</h3>

        <p className="mt-4 line-clamp-3 text-sm leading-7 text-white/60">
          {product.description || product.short_description}
        </p>

        <div className="mt-5">
          {offerPrice > 0 ? (
            <div className="flex flex-wrap items-end gap-3">
              <p className="text-2xl font-black text-pink-200">
                LKR {offerPrice.toLocaleString()}
              </p>

              <p className="text-sm font-bold text-white/40 line-through">
                LKR {price.toLocaleString()}
              </p>
            </div>
          ) : oldPrice > price && price > 0 ? (
            <div className="flex flex-wrap items-end gap-3">
              <p className="text-2xl font-black text-pink-200">
                LKR {price.toLocaleString()}
              </p>

              <p className="text-sm font-bold text-white/40 line-through">
                LKR {oldPrice.toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="text-2xl font-black">LKR {price.toLocaleString()}</p>
          )}
        </div>

        <span className="mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-black transition group-hover:bg-violet-200">
          View product <ArrowRight size={15} />
        </span>
      </div>
    </Link>
  );
}

function OfferProductCard({ product }) {
  const price = getProductPrice(product);
  const offerPrice = getOfferPrice(product);
  const image =
    product.cover_image || product.images?.[0]?.image_url || default_products;

  return (
    <Link
      data-offer-card="true"
      to={`/products/${product.slug}`}
      className="group/card relative min-w-[280px] snap-start overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl transition duration-500 hover:-translate-y-2 hover:border-pink-300/40 hover:bg-white/[0.1] sm:min-w-[340px]"
    >
      <div className="h-64 overflow-hidden">
        <img
          src={image}
          alt={product.name}
          className="h-full w-full object-cover transition duration-700 group-hover/card:scale-110"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />

      <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-pink-500 px-4 py-2 text-xs font-black text-white shadow-xl">
        <Sparkles size={13} /> Offer
      </div>

      <div className="absolute inset-x-0 bottom-0 p-6">
        <p className="mb-2 rounded-full bg-violet-500/20 px-3 py-1 text-xs font-bold text-violet-100">
          {product.category || "Product"}
        </p>

        <h3 className="mb-3 line-clamp-2 text-2xl font-black">
          {product.name}
        </h3>

        <div className="mb-5">
          {offerPrice > 0 ? (
            <div className="flex flex-wrap items-end gap-3">
              <p className="text-xl font-black text-pink-200">
                LKR {offerPrice.toLocaleString()}
              </p>

              <p className="text-sm font-bold text-white/45 line-through">
                LKR {price.toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="text-xl font-black text-pink-200">
              LKR {price.toLocaleString()}
            </p>
          )}
        </div>

        <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-black transition group-hover/card:bg-pink-200">
          View offer <ArrowRight size={15} />
        </span>
      </div>
    </Link>
  );
}

function CurrentOffersSection({ products }) {
  const offerRailRef = useRef(null);

  const offerProducts = useMemo(() => {
    return products.filter((product) => isOfferProduct(product));
  }, [products]);

  const offerRailItems =
    offerProducts.length > 1
      ? [...offerProducts, ...offerProducts]
      : offerProducts;

  useEffect(() => {
    const rail = offerRailRef.current;

    if (!rail || offerProducts.length < 2) return undefined;

    const getStepSize = () => {
      const firstCard = rail.querySelector('[data-offer-card="true"]');

      if (!firstCard) return 364;

      const cardWidth = firstCard.getBoundingClientRect().width;
      const gap = 24;

      return cardWidth + gap;
    };

    const startFromMiddle = window.setTimeout(() => {
      rail.scrollLeft = rail.scrollWidth / 2;
    }, 150);

    const timer = window.setInterval(() => {
      const stepSize = getStepSize();
      const middlePosition = rail.scrollWidth / 2;

      if (rail.scrollLeft <= stepSize) {
        rail.scrollLeft = middlePosition;
      }

      rail.scrollTo({
        left: rail.scrollLeft - stepSize,
        behavior: "smooth",
      });
    }, 2800);

    return () => {
      window.clearTimeout(startFromMiddle);
      window.clearInterval(timer);
    };
  }, [offerProducts.length]);

  if (!offerProducts.length) return null;

  return (
    <div className="mb-12">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.3em] text-pink-300">
            <Sparkles size={16} /> Current offers
          </p>

          <h2 className="text-3xl font-black">Special product deals</h2>

          <p className="mt-3 max-w-2xl text-white/55">
            Offer products move left to right, one card at a time, with a short
            pause.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-4">
        <div
          ref={offerRailRef}
          className="no-scrollbar flex snap-x gap-6 overflow-x-auto scroll-smooth pb-2"
        >
          {offerRailItems.map((product, index) => (
            <OfferProductCard
              key={`${product.id || product.slug}-${index}`}
              product={product}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState(fallbackProducts);
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    api
      .get("/products")
      .then((res) => {
        setProducts(res.data);
        setPage(1);
      })
      .catch(() => {});
  }, []);

  const categories = useMemo(() => {
    const list = products.map((product) => product.category).filter(Boolean);

    return ["all", ...new Set(list)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (selectedCategory !== "all") {
      list = list.filter((product) => product.category === selectedCategory);
    }

    if (selectedPrice === "low") {
      list = list.filter((product) => getProductPrice(product) < 5000);
    }

    if (selectedPrice === "middle") {
      list = list.filter((product) => {
        const price = getProductPrice(product);
        return price >= 5000 && price <= 20000;
      });
    }

    if (selectedPrice === "high") {
      list = list.filter((product) => getProductPrice(product) > 20000);
    }

    if (selectedPrice === "offer") {
      list = list.filter((product) => isOfferProduct(product));
    }

    if (searchText.trim()) {
      const keyword = searchText.toLowerCase();

      list = list.filter((product) => {
        return (
          product.name?.toLowerCase().includes(keyword) ||
          product.category?.toLowerCase().includes(keyword) ||
          product.description?.toLowerCase().includes(keyword) ||
          product.short_description?.toLowerCase().includes(keyword)
        );
      });
    }

    return list;
  }, [products, selectedCategory, selectedPrice, searchText]);

  const totalPages = Math.ceil(filteredProducts.length / PER_PAGE);
  const shouldPaginate = filteredProducts.length > PER_PAGE;

  const visibleProducts = useMemo(() => {
    if (!shouldPaginate) return filteredProducts;

    const start = (page - 1) * PER_PAGE;
    return filteredProducts.slice(start, start + PER_PAGE);
  }, [filteredProducts, page, shouldPaginate]);

  function changePage(nextPage) {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);
    setPage(safePage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetFilters() {
    setSelectedCategory("all");
    setSelectedPrice("all");
    setSearchText("");
    setPage(1);
  }

  const hasActiveFilter =
    selectedCategory !== "all" || selectedPrice !== "all" || searchText.trim();

  return (
    <>
      <PageHero
        title="Products"
        subtitle="Sell photo albums, frames, printed portraits, and digital editing packages with customer reviews."
      />

      <section className="section-padding py-16">
        <div className="container-max">
          <CurrentOffersSection products={products} />

          <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="mb-5 flex items-center gap-2">
              <Filter size={18} className="text-pink-300" />
              <h3 className="text-xl font-black">Filter products</h3>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr_0.8fr_auto] lg:items-center">
              <label className="flex items-center gap-3 rounded-full border border-white/10 bg-black/25 px-4 py-3">
                <Search size={16} className="text-pink-300" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(event) => {
                    setSearchText(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search product..."
                  className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/35"
                />
              </label>

              <select
                value={selectedCategory}
                onChange={(event) => {
                  setSelectedCategory(event.target.value);
                  setPage(1);
                }}
                className="rounded-full border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white outline-none"
              >
                {categories.map((category) => (
                  <option key={category} value={category} className="bg-black">
                    {category === "all" ? "All categories" : category}
                  </option>
                ))}
              </select>

              <select
                value={selectedPrice}
                onChange={(event) => {
                  setSelectedPrice(event.target.value);
                  setPage(1);
                }}
                className="rounded-full border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white outline-none"
              >
                <option value="all" className="bg-black">
                  All prices
                </option>
                <option value="low" className="bg-black">
                  Below LKR 5,000
                </option>
                <option value="middle" className="bg-black">
                  LKR 5,000 - 20,000
                </option>
                <option value="high" className="bg-black">
                  Above LKR 20,000
                </option>
                <option value="offer" className="bg-black">
                  Offers only
                </option>
              </select>

              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-3 text-sm font-bold transition hover:bg-white/15"
                >
                  <X size={15} /> Clear
                </button>
              )}
            </div>
          </div>

          {visibleProducts.length > 0 ? (
            <>
              <div className="grid auto-rows-fr gap-6 md:grid-cols-2">
                {visibleProducts.map((product) => (
                  <ProductGridCard
                    key={product.id || product.slug}
                    product={product}
                  />
                ))}
              </div>

              {shouldPaginate && (
                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                  <button
                    className="btn-secondary"
                    onClick={() => changePage(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft size={18} /> Previous
                  </button>

                  {Array.from({ length: totalPages }).map((_, index) => {
                    const number = index + 1;

                    return (
                      <button
                        key={number}
                        onClick={() => changePage(number)}
                        className={`grid h-12 w-12 place-items-center rounded-full border text-sm font-black transition ${
                          page === number
                            ? "border-pink-300 bg-white text-black"
                            : "border-white/10 bg-white/10 text-white/70 hover:bg-white/15"
                        }`}
                      >
                        {number}
                      </button>
                    );
                  })}

                  <button
                    className="btn-secondary"
                    onClick={() => changePage(page + 1)}
                    disabled={page === totalPages}
                  >
                    Next <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center">
              <p className="text-xl font-black">No products found</p>
              <p className="mt-3 text-white/50">
                Try changing the search, category, or price filter.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
