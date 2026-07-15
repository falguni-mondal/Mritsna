import React from "react";
import { Icon } from "@iconify/react";

const CollectionMetrics = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-black/5 p-6 h-32 animate-pulse flex flex-col justify-between shadow-sm">
            <div className="h-3 w-24 bg-black/5 rounded-sm"></div>
            <div className="h-8 w-16 bg-black/5 rounded-sm"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Total Collections */}
      <div className="bg-white border border-black/5 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-[0.65rem] uppercase tracking-widest font-bold opacity-50">Total Collections</h3>
          <Icon icon="ph:stack-light" className="text-xl opacity-20 group-hover:opacity-100 transition-opacity" />
        </div>
        <div>
          <p className="text-4xl font-light">{stats.total || 0}</p>
        </div>
      </div>

      {/* Active Lookbooks */}
      <div className="bg-white border border-black/5 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-[0.65rem] uppercase tracking-widest font-bold opacity-50">Active & Published</h3>
          <Icon icon="ph:eye-light" className="text-xl opacity-20 group-hover:opacity-100 transition-opacity" />
        </div>
        <div>
          <p className="text-4xl font-light">{stats.active || 0}</p>
        </div>
      </div>

      {/* Products Linked */}
      <div className="bg-white border border-black/5 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-[0.65rem] uppercase tracking-widest font-bold opacity-50">Products Showcased</h3>
          <Icon icon="ph:link-light" className="text-xl opacity-20 group-hover:opacity-100 transition-opacity" />
        </div>
        <div>
          <p className="text-4xl font-light">{stats.totalProductsLinked || 0}</p>
          <p className="text-[0.65rem] uppercase tracking-widest opacity-50 mt-1">Across all galleries</p>
        </div>
      </div>

    </div>
  );
};

export default CollectionMetrics;