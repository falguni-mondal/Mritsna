import React from "react";

const Pagination = () => {
  return (
    <div className="w-full flex justify-center pb-32 bg-[#f8f8f8]">
      <button className="group relative text-[0.65rem] font-bold tracking-[0.2em] uppercase text-[#1a1a1a] pb-2">
        Load More
        <span className="absolute bottom-0 left-0 w-full h-[1px] bg-black/20" />
        <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-black transition-all duration-500 ease-out group-hover:w-full" />
      </button>
    </div>
  );
};

export default Pagination;