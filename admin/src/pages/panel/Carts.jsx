import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCartStats, fetchActiveCarts } from "../../store/slices/cartSlice";
import CartMetrics from "../../components/cart/CartMetrics";
import CartTable from "../../components/cart/CartTable";
import CartDrawer from "../../components/cart/CartDrawer";

const Carts = () => {
  const dispatch = useDispatch();
  
  const { stats, cartsList, pagination, isLoading } = useSelector((state) => state.adminCart);

  const [currentFilter, setCurrentFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCartId, setSelectedCartId] = useState(null);

  // Fetch Stats on mount
  useEffect(() => {
    dispatch(fetchCartStats());
  }, [dispatch]);

  // Fetch Table Data whenever page or filter changes
  useEffect(() => {
    dispatch(fetchActiveCarts({ page: currentPage, limit: 15, filter: currentFilter }));
  }, [dispatch, currentPage, currentFilter]);

  const handleFilterChange = (filter) => {
    setCurrentFilter(filter);
    setCurrentPage(1); // Reset to page 1 on filter change
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleRowClick = (cartId) => {
    setSelectedCartId(cartId);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    // Slight delay to allow slide-out animation to finish before clearing data
    setTimeout(() => setSelectedCartId(null), 300);
  };

  return (
    <div className="w-full min-h-screen bg-[#f8f8f8] p-6 lg:p-10 text-[#1a1a1a]">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-2xl lg:text-3xl font-light tracking-widest uppercase mb-2">
            Active Carts
          </h1>
          <p className="text-sm opacity-50">
            Monitor real-time pipeline value and recover abandoned sessions.
          </p>
        </header>

        {/* Metrics Grid */}
        <CartMetrics stats={stats} isLoading={isLoading} />

        {/* Data Table */}
        <div className="mt-10 bg-white border border-black/5 p-6 shadow-sm">
          <CartTable 
            carts={cartsList}
            pagination={pagination}
            isLoading={isLoading}
            currentFilter={currentFilter}
            onFilterChange={handleFilterChange}
            onPageChange={handlePageChange}
            onRowClick={handleRowClick}
          />
        </div>

      </div>

      {/* Deep-Dive Drawer */}
      <CartDrawer 
        isOpen={isDrawerOpen} 
        onClose={closeDrawer} 
        cartId={selectedCartId} 
      />
    </div>
  );
};

export default Carts;