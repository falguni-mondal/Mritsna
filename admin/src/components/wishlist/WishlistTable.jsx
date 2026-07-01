import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";

const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

const regionOptions = [
  { value: "global", label: "Global (All)" },
  { value: "domestic", label: "Domestic (India)" },
  { value: "international", label: "International (All Exports)" },
  { type: "divider" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "EU", label: "Europe" },
  { value: "AE", label: "UAE" },
];

const WishlistTable = ({ 
  wishlists, 
  pagination, 
  isLoading, 
  currentRegion, 
  onRegionChange, 
  onPageChange, 
  onRowClick 
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    
    if (isDropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const handleOptionClick = (value) => {
    onRegionChange(value);
    setIsDropdownOpen(false);
  };

  const selectedRegionLabel = regionOptions.find(opt => opt.value === currentRegion)?.label || "Global (All)";

  return (
    <div className="flex flex-col w-full">
      
      {/* Top Controls: Just the Region Filter for Wishlists */}
      <div className="flex justify-end border-b border-black/10 mb-6">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 pb-4 text-black/60 hover:text-black transition-colors outline-none cursor-pointer"
          >
            <Icon icon="ph:globe-light" className="text-lg" />
            <span className="text-xs font-bold uppercase tracking-widest">
              {selectedRegionLabel}
            </span>
            <Icon 
              icon="ph:caret-down-bold" 
              className={`text-[0.65rem] opacity-50 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : "rotate-0"}`} 
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-1 w-56 bg-white shadow-xl border border-black/5 z-[60] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
              {regionOptions.map((option, index) => {
                if (option.type === "divider") {
                  return <div key={`divider-${index}`} className="h-px bg-black/5 my-2" />;
                }
                const isSelected = currentRegion === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleOptionClick(option.value)}
                    className={`w-full text-left px-5 py-2.5 text-[0.65rem] uppercase tracking-widest transition-colors flex justify-between items-center group
                      ${isSelected ? "bg-black/5 text-black font-bold" : "text-black/60 hover:bg-black/5 hover:text-black font-medium"}
                    `}
                  >
                    {option.label}
                    {isSelected && <Icon icon="ph:check-bold" className="text-black" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black/5 text-[0.65rem] uppercase tracking-widest opacity-50">
              <th className="py-4 px-4 font-bold">Customer</th>
              <th className="py-4 px-4 font-bold">Total Items</th>
              <th className="py-4 px-4 font-bold text-right">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="3" className="py-12 text-center">
                  <Icon icon="ph:spinner-gap-light" className="text-3xl animate-spin mx-auto opacity-30" />
                </td>
              </tr>
            ) : wishlists.length === 0 ? (
              <tr>
                <td colSpan="3" className="py-12 text-center text-sm opacity-40">
                  No wishlists found for this region.
                </td>
              </tr>
            ) : (
              wishlists.map((wishlist) => (
                <tr 
                  key={wishlist.wishlistId} 
                  onClick={() => onRowClick(wishlist.wishlistId)}
                  className="border-b border-black/5 hover:bg-black/[0.02] transition-colors cursor-pointer group"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium">{wishlist.user.name}</p>
                      {wishlist.isForeign && (
                        <span className="bg-black/5 text-black text-[0.55rem] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm">
                          {wishlist.user.countryCode}
                        </span>
                      )}
                    </div>
                    <p className="text-xs opacity-50">{wishlist.user.email}</p>
                  </td>
                  
                  <td className="py-4 px-4 text-sm font-medium">
                    {wishlist.itemCount} <span className="opacity-50 font-normal ml-1">saved</span>
                  </td>
                  
                  <td className="py-4 px-4 text-sm text-right opacity-60">
                    {timeAgo(wishlist.lastActive)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 pt-6 border-t border-black/5">
          <span className="text-xs opacity-50 uppercase tracking-widest font-bold">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="w-8 h-8 flex items-center justify-center border border-black/10 disabled:opacity-30 hover:bg-black/5 transition-colors cursor-pointer"
            >
              <Icon icon="ph:caret-left-bold" />
            </button>
            <button
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="w-8 h-8 flex items-center justify-center border border-black/10 disabled:opacity-30 hover:bg-black/5 transition-colors cursor-pointer"
            >
              <Icon icon="ph:caret-right-bold" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistTable;