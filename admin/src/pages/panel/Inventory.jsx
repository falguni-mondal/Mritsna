import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInventoryList } from '../../store/slices/productSlice';

import ProductPageHeader from '../../components/product/ProductPageHeader';
import InventoryTable from '../../components/inventory/InventoryTable';

const Inventory = () => {
  const dispatch = useDispatch();
  const { inventory, isLoading } = useSelector((state) => state.adminProduct || state.product || {});
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  useEffect(() => {
    dispatch(fetchInventoryList());
  }, [dispatch]);

  // Client-side filtering
  const filteredInventory = inventory?.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStockFilter = showLowStockOnly ? item.isLowStock : true;

    return matchesSearch && matchesStockFilter;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50/50 w-full max-w-7xl mx-auto pb-12">
      <ProductPageHeader 
        title="Inventory" 
        description="Fast stock management for all product variants."
        // Hiding the action button since admins usually add products from the Products page
      />

      {/* Basic Inventory Toolbar */}
      <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:w-96">
          <input 
            type="text" 
            placeholder="Search by product name or SKU..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {/* Search Icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={showLowStockOnly}
            onChange={(e) => setShowLowStockOnly(e.target.checked)}
            className="rounded border-gray-300 text-black focus:ring-black"
          />
          <span className="text-sm font-medium text-gray-700">Show Low Stock Only</span>
        </label>
      </div>

      <InventoryTable 
        inventory={filteredInventory} 
        isLoading={isLoading} 
      />
    </div>
  );
};

export default Inventory;