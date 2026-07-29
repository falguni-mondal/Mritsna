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
  
  const shopTopRef = useRef(null);

  const { products, pagination, isLoading, currencySymbol, categories } = useSelector((state) => state.product);

  const activeCategory = searchParams.get("category") || "All";
  // Updated default fallback label
  const activeSort = searchParams.get("sort") || "Terracotta";
  const currentPage = parseInt(searchParams.get("page")) || 1;

  // Updated mappings for the shorter UI names
  const getApiSortValue = (uiSort) => {
    switch (uiSort) {
      case "Terracotta": return "material_terracotta";
      case "Stoneware": return "material_stoneware";
      case "Price: Low to High": return "price_asc";
      case "Price: High to Low": return "price_desc";
      case "Newest": return "newest";
      default: return "material_terracotta";
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

  const handlePageChange = (newPage) => {
    searchParams.set("page", newPage);
    setSearchParams(searchParams);
    
    setTimeout(() => {
      if (shopTopRef.current) {
        shopTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50); 
  };

  return (
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