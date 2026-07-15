import React, { useState } from "react";
import { Icon } from "@iconify/react";

const CollectionBundle = () => {
  const [isAddingSet, setIsAddingSet] = useState(false);

  const handleShopSet = () => {
    setIsAddingSet(true);
    setTimeout(() => {
      setIsAddingSet(false);
    }, 1500);
  };

  return (
    <section className="w-full bg-[#1a1a1a] text-white py-24 lg:py-32 px-6 lg:px-12">
      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-16">
        
        <div className="w-full lg:w-1/2">
          <h2 className="head-font text-5xl lg:text-7xl mb-8">Acquire the <br className="hidden lg:block"/> Complete Look</h2>
          <ul className="flex flex-col gap-4 text-sm font-medium text-white/60">
            <li className="flex items-center gap-4"><Icon icon="ph:check-light" className="text-xl text-white/40" /> 1x Obsidian Platter</li>
            <li className="flex items-center gap-4"><Icon icon="ph:check-light" className="text-xl text-white/40" /> 2x Tall Cylinder Vase</li>
            <li className="flex items-center gap-4"><Icon icon="ph:check-light" className="text-xl text-white/40" /> 4x Textured Dinner Plate</li>
            <li className="flex items-center gap-4"><Icon icon="ph:plus-light" className="text-xl text-white/40" /> 3 additional curated pieces</li>
          </ul>
        </div>

        <div className="w-full lg:w-auto flex flex-col items-start lg:items-end border-t border-white/20 lg:border-none pt-12 lg:pt-0">
          <span className="text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50 mb-2">Curated Bundle Price</span>
          <span className="head-font text-4xl lg:text-5xl mb-10">₹22,900</span>
          
          <button 
            onClick={handleShopSet}
            disabled={isAddingSet}
            className="w-full lg:w-[300px] h-14 bg-white text-[#1a1a1a] flex items-center justify-center gap-3 text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:bg-white/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isAddingSet ? (
              <><Icon icon="ph:spinner-gap-light" className="animate-spin text-lg" /> Curating...</>
            ) : (
              "Add Collection to Cart"
            )}
          </button>
        </div>
        
      </div>
    </section>
  );
};

export default CollectionBundle;