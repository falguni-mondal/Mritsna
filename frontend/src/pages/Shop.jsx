import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchStoreProducts } from "../store/features/productSlice";

import ShopHeader from "../components/shop/ShopHeader";
import FilterBar from "../components/shop/FilterBar";
import ProductGrid from "../components/shop/ProductGrid";
import Pagination from "../components/shop/Pagination";

const Shop = () => {
  const dispatch = useDispatch();
  
  // Pull live data and metadata from Redux
  const { products, pagination, isLoading } = useSelector((state) => state.product);

  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSort, setActiveSort] = useState("Featured");
  const [currentPage, setCurrentPage] = useState(1);

  // Map the frontend UI sort labels to the backend API parameters
  const getApiSortValue = (uiSort) => {
    switch (uiSort) {
      case "Price: Low to High": return "price_asc";
      case "Price: High to Low": return "price_desc";
      case "Featured":
      default:
        return "newest";
    }
  };

  // Reset to page 1 whenever the user changes a category or sort option
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, activeSort]);

  // The Master Fetch Trigger
  useEffect(() => {
    dispatch(fetchStoreProducts({
      page: currentPage,
      limit: 12, // 12 is perfect for 2, 3, or 4 column grids
      category: activeCategory === "All" ? "" : activeCategory,
      sort: getApiSortValue(activeSort)
    }));
  }, [dispatch, activeCategory, activeSort, currentPage]);

  return (
    <main className="w-full min-h-screen bg-[#f8f8f8]">
      <ShopHeader totalProducts={pagination.totalItems || 0} />
      
      <FilterBar 
        activeCategory={activeCategory} 
        setActiveCategory={setActiveCategory}
        activeSort={activeSort}          
        setActiveSort={setActiveSort}    
      />
      
      <ProductGrid 
        products={products} 
        isLoading={isLoading} 
      />
      
      {/* Only show pagination if there are products or we have multiple pages */}
      {(products.length > 0 || pagination.totalPages > 1) && (
        <Pagination 
          pagination={pagination} 
          onPageChange={setCurrentPage} 
          isLoading={isLoading}
        />
      )}
    </main>
  );
};

export default Shop;