import React, { useState } from "react";
import { Icon } from "@iconify/react";

const ProductAccordion = ({ product, variant }) => {
  const [openAccordion, setOpenAccordion] = useState("Dimensions");

  // Helper function to determine care instructions dynamically
  const getCareInstructions = (category = "", material = "") => {
    // Convert to lowercase and trim spaces for safe matching
    const cat = category.toLowerCase().trim();
    const mat = material.toLowerCase().trim();

    // 1. Terracotta
    if (mat === "teracotta" || mat === "terracotta") {
      return "Wipe with wet cotton Cloth/Tissue";
    }

    // 2. Stoneware + Cane
    if (mat === "stoneware, cane") {
      return "Wash with Liquid Cleaner";
    }

    // 3, 4, 5, 6. Stoneware conditional logic
    if (mat === "stoneware") {
      if (["vase", "tealight candle", "decor"].includes(cat)) {
        return "Wipe with Liquid Cleaner";
      }
      // Else (Cups, Mugs, Tumblers, etc.)
      return "Microwave and Dish washer safe.";
    }

    return "Handle with care. Wipe clean with a damp cloth.";
  };

  // const details = {
  //   // Safely fallback if 'product' is momentarily undefined
  //   Dimensions: product?.dimensions || "Dimensions unavailable",
  //   ...(variant?.material && { Material: variant.material }),
  //   ...(variant?.finish && { Finish: variant.finish }),

  //   // Call our dynamic function here
  //   Care: getCareInstructions(product?.category, variant?.material),

  //   Shipping: "Free shipping on every order. Ships within 5-7 business days.",
  // };

  const details = {
    ...(variant?.material && { Material: variant.material }),
    ...(variant?.finish && { Finish: variant.finish }),

    // Call our dynamic function here
    Care: getCareInstructions(product?.category, variant?.material),

    Shipping: "Free shipping on every order. Ships within 5-7 business days.",
  };


  return (
    <div className="product-info-item w-full border-t border-black/10 flex flex-col">
      {Object.entries(details).map(([key, value]) => (
        <div
          key={key}
          className="w-full border-b border-black/10 overflow-hidden"
        >
          <button
            onClick={() => setOpenAccordion(openAccordion === key ? "" : key)}
            className="w-full py-5 flex items-center justify-between text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-80 hover:opacity-100 transition-opacity"
          >
            {key}
            <Icon
              icon="ph:plus"
              className={`text-lg transition-transform duration-500 ${openAccordion === key ? "rotate-45" : ""}`}
            />
          </button>
          <div
            className={`text-sm font-light leading-relaxed opacity-70 transition-all duration-500 ease-in-out ${openAccordion === key ? "max-h-40 pb-5 opacity-70" : "max-h-0 opacity-0 pointer-events-none"}`}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductAccordion;
