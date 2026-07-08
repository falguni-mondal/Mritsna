import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminOrders, exportAdminOrders, clearOrderErrors } from "../../store/slices/orderSlice";
import OrderTable from "../../components/orders/OrderTable";
import OrderPagination from "../../components/orders/OrderPagination";
import CustomSelect from "../../components/orders/CustomSelect"; 
import toast from "react-hot-toast";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const downloadCSV = (data, filename) => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","), 
    ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName] || "")).join(",")) 
  ].join("\r\n");

  const blob = new Blob([csvRows], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("hidden", "");
  a.setAttribute("href", url);
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const Orders = () => {
  const dispatch = useDispatch();
  const headerRef = useRef(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [filters, setFilters] = useState({
    search: "",
    currency: "ALL",
    startDate: "",
    endDate: ""
  });

  const regionOptions = [
    { value: "ALL", label: "All Regions" },
    { value: "DOMESTIC", label: "Domestic (INR)" },
    { value: "INTERNATIONAL", label: "International Exports" },
    { value: "USD", label: "USD Only" },
    { value: "EUR", label: "EUR Only" }
  ];

  const { orders, pagination, loading, exportLoading, error, actionError } = useSelector((state) => state.adminOrders);

  useGSAP(() => {
    gsap.fromTo(
      ".animate-element",
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power2.out" }
    );
  }, { scope: headerRef });

  useEffect(() => {
    dispatch(fetchAdminOrders({ 
      page: currentPage, 
      limit: itemsPerPage, 
      ...filters 
    }));

    return () => { dispatch(clearOrderErrors()); };
  }, [dispatch, currentPage, filters]);

  useEffect(() => {
    const activeError = error || actionError;
    if (activeError) {
      toast.error(activeError, {
        style: {
          background: '#1A1A1A',
          color: '#fff',
          fontSize: '13px',
          letterSpacing: '0.05em',
          borderRadius: '2px',
          padding: '12px 20px',
        },
        iconTheme: { primary: '#ff4b4b', secondary: '#fff' },
      });
      dispatch(clearOrderErrors());
    }
  }, [error, actionError, dispatch]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); 
  };

  const clearFilters = () => {
    setFilters({ search: "", currency: "ALL", startDate: "", endDate: "" });
    setCurrentPage(1);
  };

  const executeExport = async (toastId, exportType) => {
    toast.dismiss(toastId);
    
    const loadingToastId = toast.loading(`Compiling ${exportType === 'profit' ? 'Profit' : 'All'} Data...`, {
       style: { background: '#1A1A1A', color: '#fff', fontSize: '12px', borderRadius: '2px' }
    });

    try {
      const result = await dispatch(exportAdminOrders({ exportType, ...filters })).unwrap();
      
      if (result.data && result.data.length > 0) {
        const timestamp = new Date().toISOString().split("T")[0];
        const filename = `Export_${exportType.toUpperCase()}_Orders_${timestamp}.csv`;
        downloadCSV(result.data, filename);
        toast.success(`Successfully exported ${result.count} records.`, { id: loadingToastId });
      } else {
        toast.error("No data found matching current filters.", { id: loadingToastId });
      }
    } catch (err) {
      toast.error("Export failed.", { id: loadingToastId });
    }
  };

  const handleBulkExportConfirm = () => {
    toast((t) => (
      <div className="relative">
        {/* Invisible full-screen backdrop to detect clicks outside the popup. Added pointer-events-auto */}
        <div 
          className="fixed inset-0 z-40 w-screen h-screen cursor-default pointer-events-auto" 
          onClick={() => toast.dismiss(t.id)}
        ></div>
        
        {/* Actual Popup UI */}
        <div className="relative z-50 flex flex-col gap-5 p-6 min-w-[300px] bg-white border border-gray-100 shadow-[0_20px_40px_rgba(0,0,0,0.08)] rounded-sm pointer-events-auto">
          <div>
            <p className="text-sm font-medium text-gray-900 tracking-wide mb-1">Export Order Data</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Choose your export type. Current table filters (Dates, Currency, Search) will be automatically applied.
            </p>
          </div>
          
          <div className="flex flex-col gap-2 mt-2">
            <button 
              onClick={() => executeExport(t.id, 'profit')} 
              className="w-full py-3 bg-[#F4F9F5] text-[#3D714C] border border-[#CDE5D5] text-[10px] font-bold uppercase tracking-widest hover:bg-[#E8F2EC] transition-colors"
            >
              Export Profit Data Only
            </button>
            <button 
              onClick={() => executeExport(t.id, 'all')} 
              className="w-full py-3 bg-black text-white border border-black text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
            >
              Export All Matching Orders
            </button>
            <button 
              onClick={() => toast.dismiss(t.id)} 
              className="w-full py-3 text-gray-500 text-[10px] uppercase tracking-widest hover:text-black transition-colors mt-1"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    ), {
      id: 'export-confirmation-modal',
      duration: Infinity, 
      style: { 
        background: 'transparent',
        boxShadow: 'none',
        border: 'none',
        padding: 0
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-white min-h-screen">
      {/* REMOVED: <Toaster position="top-center" reverseOrder={false} /> */}
      
      <div ref={headerRef}>
        {/* Header Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between">
          <div className="animate-element">
            <h1 className="text-2xl lg:text-3xl font-light tracking-[0.15em] uppercase mb-2 text-gray-900">
              Orders Management
            </h1>
            <p className="mt-1 text-sm text-gray-400 tracking-wide">
              View, fulfill, and analyze your global logistics.
            </p>
          </div>
          
          <div className="animate-element mt-6 sm:mt-0 flex gap-4 items-center relative z-10">
            <button 
              onClick={handleBulkExportConfirm}
              disabled={exportLoading || loading}
              className="text-[10px] tracking-widest uppercase border border-gray-200 px-6 py-3 hover:border-black transition-colors duration-300 text-gray-600 hover:text-black disabled:opacity-50"
            >
              {exportLoading ? "Compiling..." : "Export CSV"}
            </button>
          </div>
        </div>

        {/* Minimalist Filter Bar */}
        <div className="animate-element mb-10 pb-8 border-b border-gray-100 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 items-end relative z-30">
          
          {/* Search */}
          <div className="lg:col-span-2 relative z-10">
            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Search Order / Email</label>
            <input 
              type="text" 
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="e.g. ORD-1234 or email@domain.com" 
              className="w-full bg-transparent text-sm border-b border-gray-200 py-2 text-gray-900 placeholder-gray-300 focus:outline-none focus:border-black transition-colors"
            />
          </div>

          {/* Custom Region / Currency Select */}
          <div className="relative z-50">
            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Region / Currency</label>
            <CustomSelect
              name="currency"
              options={regionOptions}
              value={filters.currency}
              onChange={handleFilterChange}
            />
          </div>

          {/* Start Date */}
          <div className="relative z-10">
            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Start Date</label>
            <input 
              type="date" 
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full bg-transparent text-sm border-b border-gray-200 py-2 text-gray-900 focus:outline-none focus:border-black transition-colors uppercase text-[11px] tracking-wider"
            />
          </div>

          {/* End Date & Clear */}
          <div className="flex gap-4 items-end relative z-10">
            <div className="flex-1">
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">End Date</label>
              <input 
                type="date" 
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full bg-transparent text-sm border-b border-gray-200 py-2 text-gray-900 focus:outline-none focus:border-black transition-colors uppercase text-[11px] tracking-wider"
              />
            </div>
            
            {(filters.search || filters.currency !== "ALL" || filters.startDate || filters.endDate) && (
               <button 
                 onClick={clearFilters}
                 className="mb-2 text-[10px] uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors whitespace-nowrap"
               >
                 Clear
               </button>
            )}
          </div>
        </div>

        {/* Loading State vs Data Render */}
        {loading ? (
          <div className="flex justify-center items-center py-32 relative z-10">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 border-t border-black rounded-full animate-spin"></div>
              <div className="absolute inset-1 border-r border-gray-300 rounded-full animate-spin reverse"></div>
            </div>
          </div>
        ) : (
          <div className="animate-element relative z-10">
            <OrderTable orders={orders} />
            
            <OrderPagination 
              currentPage={pagination.currentPage} 
              totalPages={pagination.totalPages} 
              totalOrders={pagination.totalOrders}
              onPageChange={handlePageChange} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;