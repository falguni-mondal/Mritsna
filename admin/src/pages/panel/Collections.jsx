import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import { fetchAdminCollections } from "../../store/slices/collectionSlice";
import CollectionMetrics from "../../components/collection/CollectionMetrics";
import CollectionTable from "../../components/collection/CollectionTable";
import CollectionFormDrawer from "../../components/collection/CollectionFormDrawer";

const Collections = () => {
  const dispatch = useDispatch();
  
  const { collections, isLoading } = useSelector((state) => state.adminCollection);

  // Table State
  const [currentFilter, setCurrentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);

  // 1. Fetch Table Data on mount
  useEffect(() => {
    dispatch(fetchAdminCollections());
  }, [dispatch]);

  // Derived Stats based on current collections
  const stats = useMemo(() => {
    const active = collections.filter(c => c.status === 'active').length;
    const totalProductsLinked = collections.reduce((acc, curr) => acc + (curr.productCount || 0), 0);
    return {
      total: collections.length,
      active,
      totalProductsLinked
    };
  }, [collections]);

  const handleFilterChange = (filter) => setCurrentFilter(filter);
  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const handleEditClick = (id) => {
    setSelectedCollectionId(id);
    setIsDrawerOpen(true);
  };

  const handleCreateNewClick = () => {
    setSelectedCollectionId(null); 
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedCollectionId(null), 300);
  };

  return (
    <div className="w-full min-h-screen bg-[#f8f8f8] p-6 lg:p-10 text-[#1a1a1a]">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header with Create Action */}
        <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-light tracking-widest uppercase mb-2">
              Editorial Collections
            </h1>
            <p className="text-sm opacity-50">
              Curate lookbooks, manage thematic galleries, and bundle products.
            </p>
          </div>
          <button 
            onClick={handleCreateNewClick}
            className="shrink-0 bg-black text-white px-6 py-3.5 text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:bg-black/80 transition-colors flex items-center gap-2"
          >
            <Icon icon="ph:plus-bold" className="text-lg" />
            New Collection
          </button>
        </header>

        {/* Metrics Grid */}
        <CollectionMetrics stats={stats} isLoading={isLoading} />

        {/* Data Table */}
        <div className="mt-10 bg-white border border-black/5 p-6 shadow-sm">
          <CollectionTable 
            collections={collections}
            isLoading={isLoading}
            currentFilter={currentFilter}
            searchQuery={searchQuery}
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
            onRowClick={handleEditClick}
          />
        </div>

      </div>

      {/* Deep-Dive / Form Drawer */}
      <CollectionFormDrawer 
        isOpen={isDrawerOpen} 
        onClose={closeDrawer} 
        collectionId={selectedCollectionId} 
      />
    </div>
  );
};

export default Collections;