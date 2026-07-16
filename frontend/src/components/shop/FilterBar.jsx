import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom"; 

const sortOptions = ["Featured", "Price: Low to High", "Price: High to Low"];

const FilterBar = ({ categories = [], activeCategory, setActiveCategory, activeSort, setActiveSort }) => {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false); 
  
  // Initialize URL parameter hook
  const [searchParams, setSearchParams] = useSearchParams();

  const dropdownRef = useRef(null);
  const categoryDropdownRef = useRef(null); 

  const filterOptions = ["All", ...categories];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- URL & State Sync Handlers ---
  const handleCategoryChange = (cat) => {
    if (cat === "All") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", cat);
    }
    // Always reset to page 1 when changing filters so they don't land on an empty page
    searchParams.delete("page"); 
    setSearchParams(searchParams);
    
    setActiveCategory(cat);
    setIsCategoryOpen(false);
  };

  const handleSortChange = (option) => {
    if (option === "Featured") {
      searchParams.delete("sort");
    } else {
      searchParams.set("sort", option);
    }
    searchParams.delete("page");
    setSearchParams(searchParams);

    setActiveSort(option);
    setIsSortOpen(false);
  };

  return (
    <div className="sticky top-[53px] lg:top-[60px] z-40 w-full bg-[#f8f8f8]/80 backdrop-blur-md border-b border-black/5">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-6 flex justify-between items-center gap-8">
        
        {/* LEFT: DESKTOP CATEGORIES */}
        <ul className="hidden lg:flex items-center gap-12 overflow-x-auto no-scrollbar flex-1">
          {filterOptions.map((cat) => (
            <li key={cat} className="flex-shrink-0">
              <button
                onClick={() => handleCategoryChange(cat)}
                className={`group text-[0.65rem] font-bold tracking-[0.2em] uppercase transition-all duration-300 relative pb-1`}
              >
                {cat}
                {activeCategory === cat && (
                  <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#1a1a1a] animate-reveal-line" />
                )}
                {activeCategory !== cat && (
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#1a1a1a] transition-all duration-300 ease-out group-hover:w-full" />
                )}
              </button>
            </li>
          ))}
        </ul>

        {/* LEFT: MOBILE CATEGORY DROPDOWN */}
        <div className="relative flex-shrink-0 z-50 lg:hidden flex-1" ref={categoryDropdownRef}>
          <button 
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className="group relative text-[0.65rem] font-bold tracking-[0.2em] uppercase text-[#1a1a1a] flex items-center gap-2 pb-1 transition-opacity"
          >
            Filter: <span>{activeCategory}</span>
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#1a1a1a] transition-all duration-300 ease-out group-hover:w-full" />
          </button>
          
          <div 
            className={`absolute top-full left-0 mt-4 w-48 bg-white border border-black/5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col py-2 transition-all duration-300 origin-top-left
              ${isCategoryOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}
            `}
          >
            {filterOptions.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`text-left px-5 py-3 text-[0.6rem] font-bold tracking-[0.15em] uppercase transition-colors
                  ${activeCategory === cat ? "text-[#1a1a1a] bg-black/5" : "text-[#1a1a1a] hover:bg-black/5"}
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: CUSTOM SORT DROPDOWN */}
        <div className="relative flex-shrink-0 z-50" ref={dropdownRef}>
          <button 
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="group relative text-[0.65rem] font-bold tracking-[0.2em] uppercase text-[#1a1a1a] flex items-center gap-2 pb-1 transition-opacity"
          >
            Sort: <span>{activeSort}</span>
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#1a1a1a] transition-all duration-300 ease-out group-hover:w-full" />
          </button>
          
          <div 
            className={`absolute top-full right-0 mt-4 w-48 bg-white border border-black/5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col py-2 transition-all duration-300 origin-top-right
              ${isSortOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}
            `}
          >
            {sortOptions.map((option) => (
              <button
                key={option}
                onClick={() => handleSortChange(option)}
                className={`text-left px-5 py-3 text-[0.6rem] font-bold tracking-[0.15em] uppercase transition-colors
                  ${activeSort === option ? "text-[#1a1a1a] bg-black/5" : "text-[#1a1a1a] hover:bg-black/5"}
                `}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FilterBar;