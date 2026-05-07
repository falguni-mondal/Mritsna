import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ProductCard from "../../utils/lazy_loading/ProductCard";
import ProductSkeleton from "../../utils/lazy_loading/ProductSkeleton";

const ProductGrid = ({ products, isLoading }) => {
  const gridRef = useRef(null);

  useGSAP(() => {
    // Only fire the reveal animation if we have data and are NOT loading
    if (!isLoading && products.length > 0) {
      gsap.killTweensOf(".gsap-reveal-card");

      gsap.fromTo(
        ".gsap-reveal-card",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.05,
          ease: "power2.out"
          // REMOVED: clearProps: "all" - this was causing the vanishing bug!
        }
      );
    }
  }, { scope: gridRef, dependencies: [products, isLoading] });

  // Generate an array of 8 skeletons for the loading state
  const skeletonArray = Array(8).fill(0);

  return (
    <div className="w-full bg-[#f8f8f8] py-16 min-h-[50vh]">
      <div 
        ref={gridRef}
        className="max-w-[1600px] mx-auto px-6 lg:px-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-14"
      >
        {/* CONDITION 1: LOADING STATE */}
        {isLoading ? (
          skeletonArray.map((_, idx) => (
            <ProductSkeleton key={`skeleton-${idx}`} />
          ))
        ) : products.length === 0 ? (
          /* CONDITION 2: NO PRODUCTS FOUND */
          <div className="col-span-full py-20 text-center text-gray-500 font-medium">
            No products found matching your filters.
          </div>
        ) : (
          /* CONDITION 3: RENDER REAL PRODUCTS */
          products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))
        )}
      </div>
    </div>
  );
};

export default ProductGrid;