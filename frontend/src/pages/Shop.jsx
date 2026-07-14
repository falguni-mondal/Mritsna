import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
// Import the new category thunk along with the product thunk
import { fetchStoreProducts, fetchUniqueCategories } from "../store/features/productSlice";

import ShopHeader from "../components/shop/ShopHeader";
import FilterBar from "../components/shop/FilterBar";
import ProductGrid from "../components/shop/ProductGrid";
import Pagination from "../components/shop/Pagination";

const Shop = () => {
  const dispatch = useDispatch();
  
  // Extract categories alongside everything else
  const { products, pagination, isLoading, currencySymbol, categories } = useSelector((state) => state.product);

  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSort, setActiveSort] = useState("Featured");
  const [currentPage, setCurrentPage] = useState(1);

  const getApiSortValue = (uiSort) => {
    switch (uiSort) {
      case "Price: Low to High": return "price_asc";
      case "Price: High to Low": return "price_desc";
      case "Featured":
      default:
        return "newest";
    }
  };

  // Fetch unique categories once when the shop loads
  useEffect(() => {
    dispatch(fetchUniqueCategories());
  }, [dispatch]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, activeSort]);

  // Fetch paginated products when filters, sort, or page changes
  useEffect(() => {
    dispatch(fetchStoreProducts({
      page: currentPage,
      limit: 12, 
      category: activeCategory === "All" ? "" : activeCategory,
      sort: getApiSortValue(activeSort)
    }));
  }, [dispatch, activeCategory, activeSort, currentPage]);

  return (
    <main className="w-full min-h-screen bg-[#f8f8f8]">
      {/* Pass the length of the dynamic categories array to the header */}
      <ShopHeader 
        totalProducts={pagination?.totalItems || 0} 
        totalCategories={categories?.length || 0} 
      />
      
      {/* Pass the dynamic categories array to the Filter Bar */}
      <FilterBar 
        categories={categories}
        activeCategory={activeCategory} 
        setActiveCategory={setActiveCategory}
        activeSort={activeSort}          
        setActiveSort={setActiveSort}    
      />
      
      <ProductGrid 
        products={products} 
        isLoading={isLoading} 
        currencySymbol={currencySymbol || '₹'}
      />
      
      {(products.length > 0 || (pagination && pagination.totalPages > 1)) && (
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