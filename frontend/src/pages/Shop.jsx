import React, { useState, useMemo } from "react";
import { dummyProducts } from "../data/dummyProducts";
import ShopHeader from "../components/shop/ShopHeader";
import FilterBar from "../components/shop/FilterBar";
import ProductGrid from "../components/shop/ProductGrid";
import Pagination from "../components/shop/Pagination";

const Shop = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSort, setActiveSort] = useState("Featured"); // New sort state

  // Memoize both filtering AND sorting logic
  const displayedProducts = useMemo(() => {
    // 1. Filter by Category
    let result = dummyProducts;
    if (activeCategory !== "All") {
      result = result.filter((product) => product.category === activeCategory);
    }

    // 2. Clone the array so we don't mutate the original imported data
    result = [...result];

    // 3. Sort the array
    if (activeSort === "Price: Low to High") {
      result.sort((a, b) => {
        // Regex strips '₹', spaces, and commas to turn "₹ 1,200.00" into 1200
        const priceA = parseFloat(a.price.replace(/[^\d.]/g, ''));
        const priceB = parseFloat(b.price.replace(/[^\d.]/g, ''));
        return priceA - priceB;
      });
    } else if (activeSort === "Price: High to Low") {
      result.sort((a, b) => {
        const priceA = parseFloat(a.price.replace(/[^\d.]/g, ''));
        const priceB = parseFloat(b.price.replace(/[^\d.]/g, ''));
        return priceB - priceA; // Reversed for high to low
      });
    }
    // If "Featured", it naturally keeps the default array order

    return result;
  }, [activeCategory, activeSort]); // Re-runs if either category or sort changes

  return (
    <main className="w-full min-h-screen bg-[#f8f8f8]">
      <ShopHeader totalProducts={dummyProducts.length} />
      
      <FilterBar 
        activeCategory={activeCategory} 
        setActiveCategory={setActiveCategory}
        activeSort={activeSort}          // Pass down
        setActiveSort={setActiveSort}    // Pass down
      />
      
      <ProductGrid products={displayedProducts} />
      
      {displayedProducts.length > 0 && <Pagination />}
    </main>
  );
};

export default Shop;