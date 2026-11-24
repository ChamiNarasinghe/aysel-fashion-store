
export type ProductColor = {
  name: string;
  hex: string;
  image?: string; // optional: override main image when this colour is selected
};

export type ProductSize = {
  label: "XS" | "S" | "M" | "L" | "XL" | "XXL";
  available: boolean;
};

export type ProductDetails = {
  fabric: string;
  fit: string;
  care: string[];
  shipping: string;
  returns: string;
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  gender: "women" | "men" | "unisex";
  image: string;
  additionalImages?: string[];
  isNew: boolean;
  featured: boolean;
  availability: "in-stock" | "low-stock" | "out-of-stock";
  badge?: string;
  colors: ProductColor[];
  sizes: ProductSize[];
  details: ProductDetails;
  stockCount: number;
  createdAt: string; // ISO date string
};

// ── Shared size sets ────────────────────────────────────────────────────────

const fullSizes: ProductSize[] = [
  { label: "XS", available: true },
  { label: "S",  available: true },
  { label: "M",  available: true },
  { label: "L",  available: true },
  { label: "XL", available: true },
  { label: "XXL",available: true },
];

const limitedSizes: ProductSize[] = [
  { label: "XS", available: false },
  { label: "S",  available: true  },
  { label: "M",  available: true  },
  { label: "L",  available: true  },
  { label: "XL", available: false },
  { label: "XXL",available: false },
];

const lowStockSizes: ProductSize[] = [
  { label: "XS", available: false },
  { label: "S",  available: false },
  { label: "M",  available: true  },
  { label: "L",  available: true  },
  { label: "XL", available: false },
  { label: "XXL",available: false },
];

// ── Shared details ───────────────────────────────────────────────────────────

const defaultShipping =
  "Free standard shipping on orders over LKR 10,000. Express delivery available at checkout. Estimated delivery 3–5 business days.";
const defaultReturns =
  "Free returns within 30 days of delivery. Items must be unworn, unwashed and in original condition with all tags attached.";

export const products: Product[] = [
  // ── WOMEN ──────────────────────────────────────────────────────────────────
  {
    id: 1,
    createdAt: "2025-03-15",
    name: "The Essential Blazer",
    slug: "the-essential-blazer",
    description:
      "A structured blazer crafted from premium wool blend. Timeless silhouette for every occasion.",
    price: 12900,
    category: "Outerwear",
    gender: "women",
    image: "/images/product-01.jpg",
    additionalImages: ["/images/product-02.jpg", "/images/featured-collection.jpg"],
    isNew: true,
    featured: true,
    availability: "in-stock",
    badge: "NEW",
    stockCount: 12,
    colors: [
      { name: "Charcoal",    hex: "#3D3D3D", image: "/images/product-01.jpg" },
      { name: "Ivory",       hex: "#FAF8F2", image: "/images/product-02.jpg" },
      { name: "Deep Camel",  hex: "#C19A6B" },
    ],
    sizes: fullSizes,
    details: {
      fabric: "72% Wool, 24% Polyester, 4% Elastane. Fully lined in 100% viscose.",
      fit: "Structured, tailored fit. Model is 178 cm and wears size S. We recommend sizing up for a relaxed fit.",
      care: [
        "Dry clean only",
        "Do not tumble dry",
        "Store on a padded hanger",
        "Steam to remove creases",
      ],
      shipping: defaultShipping,
      returns: defaultReturns,
    },
  },
  {
    id: 2,
    createdAt: "2025-03-20",
    name: "Soft Knit Sweater",
    slug: "soft-knit-sweater",
    description:
      "Luxuriously soft knit sweater in a relaxed fit. Perfect for layering through the seasons.",
    price: 8500,
    category: "Tops",
    gender: "women",
    image: "/images/product-02.jpg",
    additionalImages: ["/images/product-04.jpg"],
    isNew: true,
    featured: false,
    availability: "in-stock",
    badge: "NEW",
    stockCount: 20,
    colors: [
      { name: "Oatmeal",     hex: "#D4C5A9", image: "/images/product-02.jpg" },
      { name: "Dusty Rose",  hex: "#C9A0A0" },
      { name: "Sage",        hex: "#8A9E85" },
      { name: "Midnight",    hex: "#1C1C2E" },
    ],
    sizes: fullSizes,
    details: {
      fabric: "100% Extra-fine Merino Wool. Ribbed cuffs and hem.",
      fit: "Relaxed, oversized fit. Model is 175 cm and wears size XS. True to size.",
      care: [
        "Hand wash cold or machine wash on wool cycle",
        "Lay flat to dry",
        "Do not tumble dry",
        "Cool iron if needed",
      ],
      shipping: defaultShipping,
      returns: defaultReturns,
    },
  },
  {
    id: 3,
    createdAt: "2025-01-10",
    name: "Classic Tailored Trousers",
    slug: "classic-tailored-trousers",
    description:
      "Impeccably tailored trousers with a clean, modern cut. A wardrobe essential.",
    price: 9900,
    category: "Trousers",
    gender: "women",
    image: "/images/product-03.jpg",
    additionalImages: ["/images/product-01.jpg"],
    isNew: false,
    featured: true,
    availability: "in-stock",
    stockCount: 15,
    colors: [
      { name: "Black",       hex: "#171515", image: "/images/product-03.jpg" },
      { name: "Stone",       hex: "#C8B89A" },
      { name: "Navy",        hex: "#1B2A4A" },
    ],
    sizes: fullSizes,
    details: {
      fabric: "68% Polyester, 28% Viscose, 4% Elastane. Partially lined.",
      fit: "High-rise, straight leg. Model is 178 cm and wears size S. True to size.",
      care: [
        "Machine wash at 30°C",
        "Do not bleach",
        "Tumble dry low",
        "Iron on medium heat",
      ],
      shipping: defaultShipping,
      returns: defaultReturns,
    },
  },
  {
    id: 4,
    createdAt: "2025-01-22",
    name: "Everyday Linen Shirt",
    slug: "everyday-linen-shirt",
    description:
      "Breathable linen shirt with a relaxed drape. Effortlessly elegant for warm days.",
    price: 7200,
    category: "Shirts",
    gender: "women",
    image: "/images/product-04.jpg",
    additionalImages: ["/images/category-women.jpg"],
    isNew: false,
    featured: false,
    availability: "in-stock",
    stockCount: 18,
    colors: [
      { name: "White",       hex: "#FFFFFF", image: "/images/product-04.jpg" },
      { name: "Sand",        hex: "#D4B896" },
      { name: "Sky Blue",    hex: "#A8C5DA" },
    ],
    sizes: fullSizes,
    details: {
      fabric: "100% European Linen. Garment washed for softness.",
      fit: "Relaxed, slightly oversized fit. Model is 175 cm and wears size XS.",
      care: [
        "Machine wash at 40°C",
        "Tumble dry low",
        "Iron while slightly damp for best results",
        "Do not dry clean",
      ],
      shipping: defaultShipping,
      returns: defaultReturns,
    },
  },
  {
    id: 5,
    createdAt: "2025-04-01",
    name: "Silk Wrap Dress",
    slug: "silk-wrap-dress",
    description:
      "A fluid wrap dress in a luxurious silk blend. Flattering for every silhouette.",
    price: 15800,
    category: "Dresses",
    gender: "women",
    image: "/images/category-women.jpg",
    additionalImages: ["/images/hero-campaign.jpg", "/images/product-04.jpg"],
    isNew: true,
    featured: true,
    availability: "in-stock",
    badge: "NEW",
    stockCount: 8,
    colors: [
      { name: "Champagne",   hex: "#F7E7CE", image: "/images/category-women.jpg" },
      { name: "Burgundy",    hex: "#5B0E14" },
      { name: "Forest",      hex: "#2D4A3E" },
    ],
    sizes: fullSizes,
    details: {
      fabric: "70% Silk, 30% Viscose. Fully lined in 100% silk.",
      fit: "Wrap silhouette, adjustable tie waist. Model is 178 cm and wears size S.",
      care: [
        "Dry clean recommended",
        "Hand wash cold as alternative",
        "Do not wring or twist",
        "Hang to dry away from direct sunlight",
      ],
      shipping: defaultShipping,
      returns: defaultReturns,
    },
  },
  {
    id: 6,
    createdAt: "2024-12-05",
    name: "Relaxed Linen Trousers",
    slug: "relaxed-linen-trousers",
    description:
      "Wide-leg linen trousers with a high waist. Comfortable and refined.",
    price: 8900,
    category: "Trousers",
    gender: "women",
    image: "/images/featured-collection.jpg",
    additionalImages: ["/images/product-03.jpg"],
    isNew: false,
    featured: false,
    availability: "low-stock",
    stockCount: 3,
    colors: [
      { name: "Natural",     hex: "#E8DCC8", image: "/images/featured-collection.jpg" },
      { name: "Terracotta",  hex: "#C4714A" },
    ],
    sizes: lowStockSizes,
    details: {
      fabric: "100% Linen. Elasticated waistband with drawstring.",
      fit: "High-rise, wide-leg. Model is 175 cm and wears size S. Size down for a more fitted waist.",
      care: [
        "Machine wash at 30°C",
        "Tumble dry low",
        "Iron on medium heat while damp",
        "Do not bleach",
      ],
      shipping: defaultShipping,
      returns: defaultReturns,
    },
  },
  {
    id: 7,
    createdAt: "2025-03-28",
    name: "Structured Midi Dress",
    slug: "structured-midi-dress",
    description:
      "A structured midi dress with clean lines and a contemporary silhouette.",
    price: 13500,
    category: "Dresses",
    gender: "women",
    image: "/images/hero-campaign.jpg",
    additionalImages: ["/images/category-women.jpg", "/images/product-01.jpg"],
    isNew: true,
    featured: false,
    availability: "in-stock",
    badge: "NEW",
    stockCount: 10,
    colors: [
      { name: "Onyx",        hex: "#1A1A1A", image: "/images/hero-campaign.jpg" },
      { name: "Ecru",        hex: "#F0EAD6" },
      { name: "Cobalt",      hex: "#1F3A8A" },
    ],
    sizes: fullSizes,
    details: {
      fabric: "55% Cotton, 40% Polyester, 5% Elastane. Unlined.",
      fit: "Fitted bodice, A-line midi skirt. Model is 178 cm and wears size S. True to size.",
      care: [
        "Machine wash at 30°C",
        "Do not bleach",
        "Tumble dry low",
        "Iron on medium heat",
      ],
      shipping: defaultShipping,
      returns: defaultReturns,
    },
  },
  {
    id: 8,
    createdAt: "2024-11-18",
    name: "Fine Knit Cardigan",
    slug: "fine-knit-cardigan",
    description:
      "A lightweight fine-knit cardigan. Versatile layering piece for any season.",
    price: 9200,
    category: "Tops",
    gender: "women",
    image: "/images/product-02.jpg",
    additionalImages: ["/images/product-04.jpg"],
    isNew: false,
    featured: false,
    availability: "in-stock",
    stockCount: 14,
    colors: [
      { name: "Cream",       hex: "#FFFDD0", image: "/images/product-02.jpg" },
      { name: "Blush",       hex: "#F4C2C2" },
      { name: "Camel",       hex: "#C19A6B" },
      { name: "Charcoal",    hex: "#3D3D3D" },
    ],
    sizes: fullSizes,
    details: {
      fabric: "80% Cotton, 20% Nylon. Fine-gauge knit construction.",
      fit: "Relaxed fit with button front. Model is 175 cm and wears size XS.",
      care: [
        "Hand wash cold",
        "Lay flat to dry",
        "Do not tumble dry",
        "Do not iron directly on knit",
      ],
      shipping: defaultShipping,
      returns: defaultReturns,
    },
  },

  // ── MEN ────────────────────────────────────────────────────────────────────
  {
    id: 9,
    createdAt: "2025-03-10",
    name: "Oxford Button-Down Shirt",
    slug: "oxford-button-down-shirt",
    description:
      "A classic Oxford shirt in premium cotton. Crisp, clean and endlessly versatile.",
    price: 8900,
    category: "Shirts",
    gender: "men",
    image: "/images/category-men.jpg",
    additionalImages: ["/images/product-04.jpg"],
    isNew: true,
    featured: true,
    availability: "in-stock",
    badge: "NEW",
    stockCount: 20,
    colors: [
      { name: "White",       hex: "#FFFFFF", image: "/images/category-men.jpg" },
      { name: "Light Blue",  hex: "#A8C5DA" },
      { name: "Pink",        hex: "#F4C2C2" },
    ],
    sizes: fullSizes,
    details: {
      fabric: "100% Oxford-weave Cotton. Button-down collar, chest pocket.",
      fit: "Regular fit. Model is 185 cm and wears size M. True to size.",
      care: [
        "Machine wash at 40°C",
        "Tumble dry low",
        "Iron on medium-high heat",
        "Do not dry clean",
      ],
      shipping: defaultShipping,
      returns: defaultReturns,
    },
  },
  {
    id: 10,
    createdAt: "2025-02-14",
    name: "Slim Chino Trousers",
    slug: "slim-chino-trousers",
    description:
      "Slim-fit chino trousers in a refined cotton twill. Smart casual perfection.",
    price: 9500,
    category: "Trousers",
    gender: "men",
    image: "/images/product-03.jpg",
    additionalImages: ["/images/product-01.jpg"],
    isNew: false,
    featured: true,
    availability: "in-stock",
    stockCount: 16,
    colors: [
      { name: "Khaki",       hex: "#C3B091", image: "/images/product-03.jpg" },
      { name: "Navy",        hex: "#1B2A4A" },
      { name: "Olive",       hex: "#6B7C45" },
      { name: "Stone",       hex: "#C8B89A" },
    ],
    sizes: fullSizes,
    details: {
      fabric: "98% Cotton, 2% Elastane. Cotton twill weave.",
      fit: "Slim fit, mid-rise. Model is 185 cm and wears size M. True to size.",
      care: [
        "Machine wash at 40°C",
        "Tumble dry low",
        "Iron on medium heat",
        "Do not bleach",
      ],
      shipping: defaultShipping,
      returns: defaultReturns,
    },
  },
  {
    id: 11,
    createdAt: "2025-04-05",
    name: "Merino Wool T-Shirt",
    slug: "merino-wool-tshirt",
    description:
      "A premium merino wool T-shirt with a clean, minimal aesthetic.",
    price: 6800,
    category: "T-shirts",
    gender: "men",
    image: "/images/product-04.jpg",
    additionalImages: ["/images/product-02.jpg"],
    isNew: true,
    featured: false,
    availability: "in-stock",
    badge: "NEW",
    stockCount: 22,
    colors: [
      { name: "White",       hex: "#FFFFFF", image: "/images/product-04.jpg" },
      { name: "Black",       hex: "#171515" },
      { name: "Slate Grey",  hex: "#708090" },
      { name: "Navy",        hex: "#1B2A4A" },
    ],
    sizes: fullSizes,
    details: {
      fabric: "100% 18.5-micron Merino Wool. Naturally temperature-regulating.",
      fit: "Regular fit, crew neck. Model is 185 cm and wears size M. True to size.",
      care: [
        "Machine wash on wool cycle at 30°C",
        "Lay flat to dry",
        "Do not tumble dry",
        "Cool iron if needed",
      ],
      shipping: defaultShipping,
      returns: defaultReturns,
    },
  },
  {
    id: 12,
    createdAt: "2024-10-30",
    name: "Tailored Wool Blazer",
    slug: "tailored-wool-blazer",
    description:
      "A sharp tailored blazer in Italian wool. Elevate any outfit effortlessly.",
    price: 18500,
    category: "Outerwear",
    gender: "men",
    image: "/images/product-01.jpg",
    additionalImages: ["/images/category-men.jpg", "/images/featured-collection.jpg"],
    isNew: false,
    featured: true,
    availability: "in-stock",
    stockCount: 9,
    colors: [
      { name: "Charcoal",    hex: "#3D3D3D", image: "/images/product-01.jpg" },
      { name: "Navy",        hex: "#1B2A4A" },
      { name: "Camel",       hex: "#C19A6B" },
    ],
    sizes: limitedSizes,
    details: {
      fabric: "100% Italian Wool. Fully lined in 100% viscose. Horn buttons.",
      fit: "Slim fit, two-button. Model is 185 cm and wears size M. True to size.",
      care: [
        "Dry clean only",
        "Store on a wide-shoulder hanger",
        "Steam to remove creases",
        "Brush with a soft garment brush after wearing",
      ],
      shipping: defaultShipping,
      returns: defaultReturns,
    },
  },
  {
    id: 13,
    createdAt: "2025-04-10",
    name: "Linen Casual Shirt",
    slug: "linen-casual-shirt",
    description:
      "A relaxed linen shirt for warm-weather dressing. Effortless and refined.",
    price: 7600,
    category: "Shirts",
    gender: "men",
    image: "/images/featured-collection.jpg",
    additionalImages: ["/images/product-04.jpg"],
    isNew: true,
    featured: false,
    availability: "in-stock",
    badge: "NEW",
    stockCount: 17,
    colors: [
      { name: "Natural",     hex: "#E8DCC8", image: "/images/featured-collection.jpg" },
      { name: "Sky Blue",    hex: "#A8C5DA" },
      { name: "Sage",        hex: "#8A9E85" },
      { name: "White",       hex: "#FFFFFF" },
    ],
    sizes: fullSizes,
    details: {
      fabric: "100% European Linen. Garment washed for softness.",
      fit: "Relaxed fit. Model is 185 cm and wears size M. Size down for a more fitted look.",
      care: [
        "Machine wash at 40°C",
        "Tumble dry low",
        "Iron while slightly damp",
        "Do not dry clean",
      ],
      shipping: defaultShipping,
      returns: defaultReturns,
    },
  },
  {
    id: 14,
    createdAt: "2024-09-01",
    name: "Classic Crew Neck Tee",
    slug: "classic-crew-neck-tee",
    description:
      "A perfectly weighted crew neck T-shirt in Pima cotton. The everyday essential.",
    price: 5200,
    category: "T-shirts",
    gender: "men",
    image: "/images/product-02.jpg",
    additionalImages: ["/images/product-04.jpg"],
    isNew: false,
    featured: false,
    availability: "in-stock",
    stockCount: 30,
    colors: [
      { name: "White",       hex: "#FFFFFF", image: "/images/product-02.jpg" },
      { name: "Black",       hex: "#171515" },
      { name: "Grey Marl",   hex: "#9E9E9E" },
      { name: "Navy",        hex: "#1B2A4A" },
      { name: "Burgundy",    hex: "#5B0E14" },
    ],
    sizes: fullSizes,
    details: {
      fabric: "100% Pima Cotton. 180gsm jersey. Pre-shrunk.",
      fit: "Regular fit, crew neck. Model is 185 cm and wears size M. True to size.",
      care: [
        "Machine wash at 40°C",
        "Tumble dry low",
        "Iron on medium heat",
        "Do not bleach",
      ],
      shipping: defaultShipping,
      returns: defaultReturns,
    },
  },
  {
    id: 15,
    createdAt: "2025-03-25",
    name: "Wool Overcoat",
    slug: "wool-overcoat",
    description:
      "A full-length wool overcoat with a clean, architectural silhouette.",
    price: 24900,
    category: "Outerwear",
    gender: "men",
    image: "/images/hero-campaign.jpg",
    additionalImages: ["/images/product-01.jpg", "/images/category-men.jpg"],
    isNew: true,
    featured: true,
    availability: "low-stock",
    badge: "NEW",
    stockCount: 4,
    colors: [
      { name: "Camel",       hex: "#C19A6B", image: "/images/hero-campaign.jpg" },
      { name: "Charcoal",    hex: "#3D3D3D", image: "/images/product-01.jpg" },
    ],
    sizes: lowStockSizes,
    details: {
      fabric: "80% Wool, 20% Cashmere. Fully lined in 100% viscose.",
      fit: "Relaxed, oversized fit. Model is 185 cm and wears size M. Size down for a more tailored look.",
      care: [
        "Dry clean only",
        "Store on a wide-shoulder hanger",
        "Steam to remove creases",
        "Brush with a soft garment brush after wearing",
      ],
      shipping: defaultShipping,
      returns: defaultReturns,
    },
  },
  {
    id: 16,
    createdAt: "2025-02-01",
    name: "Straight Leg Denim",
    slug: "straight-leg-denim",
    description:
      "Premium straight-leg denim in a dark indigo wash. Refined casual dressing.",
    price: 11200,
    category: "Trousers",
    gender: "men",
    image: "/images/product-01.jpg",
    additionalImages: ["/images/product-03.jpg"],
    isNew: false,
    featured: false,
    availability: "in-stock",
    stockCount: 13,
    colors: [
      { name: "Dark Indigo", hex: "#1B2A4A", image: "/images/product-01.jpg" },
      { name: "Mid Wash",    hex: "#4A6FA5" },
      { name: "Black",       hex: "#171515" },
    ],
    sizes: fullSizes,
    details: {
      fabric: "99% Cotton, 1% Elastane. 12oz selvedge-inspired denim.",
      fit: "Straight leg, mid-rise. Model is 185 cm and wears size M. True to size.",
      care: [
        "Machine wash at 30°C inside out",
        "Do not tumble dry — hang to dry",
        "Do not bleach",
        "Iron on reverse side only",
      ],
      shipping: defaultShipping,
      returns: defaultReturns,
    },
  },
];

export const newArrivals = products.filter((p) => p.isNew).slice(0, 4);

export const formatPrice = (price: number) =>
  `LKR ${price.toLocaleString("en-LK")}`;
