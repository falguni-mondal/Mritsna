import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom"; 
import { fetchStoreProducts, fetchUniqueCategories } from "../store/features/productSlice";

import ShopHeader from "../components/shop/ShopHeader";
import FilterBar from "../components/shop/FilterBar";
import ProductGrid from "../components/shop/ProductGrid";
import Pagination from "../components/shop/Pagination";

const Shop = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Create a reference to the top of the component
  const shopTopRef = useRef(null);

  const { products, pagination, isLoading, currencySymbol, categories } = useSelector((state) => state.product);

  const activeCategory = searchParams.get("category") || "All";
  const activeSort = searchParams.get("sort") || "Featured";
  const currentPage = parseInt(searchParams.get("page")) || 1;

  const getApiSortValue = (uiSort) => {
    switch (uiSort) {
      case "Price: Low to High": return "price_asc";
      case "Price: High to Low": return "price_desc";
      case "Featured":
      default:
        return "newest";
    }
  };

  useEffect(() => {
    dispatch(fetchUniqueCategories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchStoreProducts({
      page: currentPage,
      limit: 12, 
      category: activeCategory === "All" ? "" : activeCategory,
      sort: getApiSortValue(activeSort)
    }));
  }, [dispatch, activeCategory, activeSort, currentPage]);

  // --- Bulletproof Scroll Handler ---
  const handlePageChange = (newPage) => {
    searchParams.set("page", newPage);
    setSearchParams(searchParams);
    
    // Using a micro-timeout guarantees React has updated the DOM from the searchParams 
    // change before the browser attempts to calculate the scroll position.
    setTimeout(() => {
      // 1. Target the specific element to scroll into view (bypasses window scroll container issues)
      if (shopTopRef.current) {
        shopTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // 2. Fallback window scroll just in case
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50); 
  };

  return (
    // Attach the ref directly to the main wrapper
    <main ref={shopTopRef} className="w-full min-h-screen bg-[#f8f8f8]">
      <ShopHeader 
        totalProducts={pagination?.totalItems || 0} 
        totalCategories={categories?.length || 0} 
      />
      
      <FilterBar 
        categories={categories}
        activeCategory={activeCategory} 
        activeSort={activeSort}          
        setActiveCategory={() => {}} 
        setActiveSort={() => {}}     
      />
      
      <ProductGrid 
        products={products} 
        isLoading={isLoading} 
        currencySymbol={currencySymbol || '₹'}
      />
      
      {(products.length > 0 || (pagination && pagination.totalPages > 1)) && (
        <Pagination 
          pagination={pagination} 
          onPageChange={handlePageChange} 
          isLoading={isLoading}
        />
      )}
    </main>
  );
};

export default Shop;