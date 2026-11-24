import { products } from "@/data/products";
import ProductCard from "@/components/product-card";
import type { Product } from "@/data/products";

type Props = {
  current: Product;
};

export default function RelatedProducts({ current }: Props) {
  // Prefer same gender + category, then same gender only
  const sameGenderCategory = products.filter(
    (p) => p.id !== current.id && p.gender === current.gender && p.category === current.category
  );

  const sameGender = products.filter(
    (p) => p.id !== current.id && p.gender === current.gender && p.category !== current.category
  );

  const related = [...sameGenderCategory, ...sameGender].slice(0, 4);

  if (related.length === 0) return null;

  return (
    <section className="border-t border-light-beige px-5 py-16 sm:px-10 lg:px-16">
      <div className="mb-10">
        <p className="text-[9px] tracking-[0.25em] text-burgundy">DISCOVER MORE</p>
        <h2 className="mt-3 font-display text-2xl sm:text-3xl">You May Also Like</h2>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
        {related.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
