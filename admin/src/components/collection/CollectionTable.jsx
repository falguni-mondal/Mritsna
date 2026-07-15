import React, { useMemo } from "react";
import { Icon } from "@iconify/react";

const filterOptions = [
  { label: "All Collections", value: "all" },
  { label: "Active", value: "active" },
  { label: "Drafts", value: "draft" }
];

const CollectionTable = ({ 
  collections, 
  isLoading, 
  currentFilter, 
  searchQuery, 
  onFilterChange, 
  onSearchChange,
  onRowClick 
}) => {
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric"
    });
  };

  // Local filtering based on search and status
  const filteredCollections = useMemo(() => {
    return collections.filter(collection => {
      const matchesSearch = collection.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            collection.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = currentFilter === 'all' || collection.status === currentFilter;
      return matchesSearch && matchesFilter;
    });
  }, [collections, searchQuery, currentFilter]);

  return (
    <div className="flex flex-col w-full">
      
      {/* Top Controls: Search & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/10 mb-6 pb-4">
        
        <div className="relative w-full sm:w-72">
          <Icon icon="ph:magnifying-glass-light" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input 
            type="text"
            placeholder="Search collections..."
            value={searchQuery}
            onChange={onSearchChange}
            className="w-full pl-10 pr-4 py-2 text-sm border border-black/10 bg-gray-50 focus:bg-white focus:outline-none focus:border-black transition-colors rounded-sm tracking-wider"
          />
        </div>

        <div className="flex gap-6">
          {filterOptions.map(option => (
            <button
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              className={`text-[0.65rem] uppercase tracking-widest font-bold pb-1 border-b-2 transition-colors
                ${currentFilter === option.value ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"}
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black/5 text-[0.65rem] uppercase tracking-widest opacity-50">
              <th className="py-4 px-4 font-bold">Cover</th>
              <th className="py-4 px-4 font-bold">Details</th>
              <th className="py-4 px-4 font-bold text-center">Items Linked</th>
              <th className="py-4 px-4 font-bold text-right">Created</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="4" className="py-12 text-center">
                  <Icon icon="ph:spinner-gap-light" className="text-3xl animate-spin mx-auto opacity-30" />
                </td>
              </tr>
            ) : filteredCollections.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-12 text-center text-sm opacity-40">
                  No collections found.
                </td>
              </tr>
            ) : (
              filteredCollections.map((collection) => (
                <tr 
                  key={collection._id} 
                  onClick={() => onRowClick(collection._id)}
                  className="border-b border-black/5 hover:bg-black/[0.02] transition-colors cursor-pointer group"
                >
                  <td className="py-4 px-4 w-24">
                    <div className="w-16 h-20 bg-gray-100 overflow-hidden border border-black/5">
                      {collection.image ? (
                        <img src={collection.image.baseUrl} alt={collection.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20"><Icon icon="ph:image-light" /></div>
                      )}
                    </div>
                  </td>
                  
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold tracking-wider">{collection.title}</p>
                      {collection.status === 'active' ? (
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                      )}
                    </div>
                    <p className="text-xs opacity-50 mt-1">{collection.subtitle}</p>
                    <p className="text-[0.55rem] uppercase tracking-widest font-bold opacity-40 mt-2">/{collection.slug}</p>
                  </td>
                  
                  <td className="py-4 px-4 text-sm text-center">
                    <span className="font-medium">{collection.productCount}</span>
                  </td>

                  <td className="py-4 px-4 text-sm text-right opacity-60">
                    {formatDate(collection.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CollectionTable;