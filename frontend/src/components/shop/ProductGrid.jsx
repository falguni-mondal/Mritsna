import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ProductCard from "./ProductCard";

const ProductGrid = ({ products }) => {
  const gridRef = useRef(null);

  useGSAP(() => {
    // Kills any running animations if the user clicks filters rapidly
    gsap.killTweensOf(".product-card");

    // Fast, subtle stagger up for grid items
    gsap.fromTo(
      ".product-card",
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.05,
        ease: "power2.out",
        clearProps: "all" // Cleans up inline styles after animation
      }
    );
  }, { scope: gridRef, dependencies: [products] }); // Re-runs when filtered products change

  return (
    <div className="w-full bg-[#f8f8f8] py-16">
      <div 
        ref={gridRef}
        className="max-w-[1600px] mx-auto px-6 lg:px-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-14"
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;