import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import { 
  fetchCouponDetails, 
  createCoupon, 
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
  clearCurrentCouponDetails 
} from "../../store/slices/couponSlice";

const initialFormState = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: 0,
  maxDiscountAmount: "",
  minOrderValue: 0,
  applicableRegions: "GLOBAL", // Stored as a comma separated string for the UI
  usageLimit: "",
  usagePerUserLimit: 1,
  expiryDate: "",
  isAutoApply: false,
};

const toastConfig = {
  style: {
    borderRadius: '2px',
    background: '#1a1a1a',
    color: '#fff',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    padding: '12px 20px',
  },
};

const CouponFormDrawer = ({ isOpen, onClose, couponId }) => {
  const dispatch = useDispatch();
  
  const { 
    currentCouponDetails: coupon, 
    isDetailsLoading, 
    isActionLoading 
  } = useSelector((state) => state.adminCoupon);

  const [formData, setFormData] = useState(initialFormState);
  const isEditMode = Boolean(couponId);

  // Fetch or Reset Data
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (isEditMode) {
        dispatch(fetchCouponDetails(couponId));
      } else {
        setFormData({ ...initialFormState, expiryDate: getTomorrowDateString() });
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen, couponId, dispatch, isEditMode]);

  // Populate form when data arrives
  useEffect(() => {
    if (isEditMode && coupon) {
      setFormData({
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue || 0,
        maxDiscountAmount: coupon.maxDiscountAmount || "",
        minOrderValue: coupon.minOrderValue || 0,
        applicableRegions: coupon.applicableRegions.join(", "),
        usageLimit: coupon.usageLimit || "",
        usagePerUserLimit: coupon.usagePerUserLimit || 1,
        expiryDate: new Date(coupon.expiryDate).toISOString().slice(0, 16), // Format for datetime-local
        isAutoApply: coupon.isAutoApply,
      });
    }
  }, [coupon, isEditMode]);

  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 16);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      dispatch(clearCurrentCouponDetails());
      setFormData(initialFormState);
    }, 300);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare Payload
    const payload = {
      ...formData,
      code: formData.code.toUpperCase(),
      discountValue: Number(formData.discountValue),
      minOrderValue: Number(formData.minOrderValue),
      maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
      usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
      usagePerUserLimit: Number(formData.usagePerUserLimit),
      applicableRegions: formData.applicableRegions.split(',').map(r => r.trim().toUpperCase()).filter(r => r),
    };

    let resultAction;
    if (isEditMode) {
      resultAction = await dispatch(updateCoupon({ id: couponId, payload }));
    } else {
      resultAction = await dispatch(createCoupon(payload));
    }

    if (resultAction.meta.requestStatus === 'fulfilled') {
      toast.success(`Coupon ${isEditMode ? 'updated' : 'created'} successfully`, toastConfig);
      handleClose();
    } else {
      toast.error(resultAction.payload || "An error occurred", toastConfig);
    }
  };

  const handleToggleStatus = async () => {
    if (!window.confirm(`Are you sure you want to ${coupon.isActive ? 'PAUSE' : 'ACTIVATE'} this coupon?`)) return;
    
    const resultAction = await dispatch(toggleCouponStatus(couponId));
    if (resultAction.meta.requestStatus === 'fulfilled') {
      toast.success("Status updated", toastConfig);
      dispatch(fetchCouponDetails(couponId)); // Refresh drawer
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("WARNING: This permanently deletes the coupon. Proceed?")) return;
    
    const resultAction = await dispatch(deleteCoupon(couponId));
    if (resultAction.meta.requestStatus === 'fulfilled') {
      toast.success("Coupon deleted", toastConfig);
      handleClose();
    }
  };

  const stopScrollPropagation = (e) => e.stopPropagation();

  // Common input classes
  const labelClass = "block text-[0.65rem] font-bold tracking-widest uppercase opacity-60 mb-2";
  const inputClass = "w-full bg-transparent border-b border-black/20 pb-2 text-sm focus:outline-none focus:border-black transition-colors";

  return (
    <>
      <div 
        onClick={handleClose}
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[99998] transition-opacity duration-500
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />

      <div 
        data-lenis-prevent="true"
        className={`fixed top-0 right-0 h-[100dvh] w-full max-w-lg bg-[#f8f8f8] shadow-2xl z-[99999] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.175,1)]
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="shrink-0 px-8 py-6 border-b border-black/10 flex justify-between items-center bg-white">
          <h2 className="text-sm font-bold tracking-widest uppercase">
            {isEditMode ? "Manage Coupon" : "Create New Coupon"}
          </h2>
          <button 
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors cursor-pointer"
          >
            <Icon icon="ph:x-light" className="text-xl" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div 
          onWheel={stopScrollPropagation}
          onTouchMove={stopScrollPropagation}
          className="flex-1 overflow-y-auto overscroll-contain min-h-0 custom-scrollbar p-8"
        >
          {isDetailsLoading && isEditMode ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30">
              <Icon icon="ph:spinner-gap-light" className="text-4xl animate-spin mb-4" />
              <p className="text-xs uppercase tracking-widest font-bold">Loading Data...</p>
            </div>
          ) : (
            <form id="couponForm" onSubmit={handleSubmit} className="flex flex-col gap-8">
              
              {/* Basic Details */}
              <div className="bg-white p-6 border border-black/5 shadow-sm space-y-6">
                <div>
                  <label className={labelClass}>Coupon Code</label>
                  <input 
                    type="text" 
                    name="code" 
                    required 
                    value={formData.code} 
                    onChange={handleChange}
                    placeholder="e.g. SUMMER26"
                    className={`${inputClass} uppercase tracking-widest font-bold`} 
                  />
                </div>
                <div>
                  <label className={labelClass}>Internal Description</label>
                  <input 
                    type="text" 
                    name="description" 
                    required 
                    value={formData.description} 
                    onChange={handleChange}
                    placeholder="What is this promotion for?"
                    className={inputClass} 
                  />
                </div>
              </div>

              {/* Reward Rules */}
              <div className="bg-white p-6 border border-black/5 shadow-sm space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Discount Type</label>
                    <select 
                      name="discountType" 
                      value={formData.discountType} 
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed_amount">Fixed Amount (Base INR)</option>
                      <option value="free_shipping">Free Shipping</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Value</label>
                    <input 
                      type="number" 
                      name="discountValue" 
                      min="0"
                      disabled={formData.discountType === 'free_shipping'}
                      value={formData.discountValue} 
                      onChange={handleChange}
                      className={inputClass} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Max Cap Amount (INR)</label>
                    <input 
                      type="number" 
                      name="maxDiscountAmount" 
                      min="0"
                      placeholder="Leave blank for none"
                      value={formData.maxDiscountAmount} 
                      onChange={handleChange}
                      className={inputClass} 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Min Order Value (INR)</label>
                    <input 
                      type="number" 
                      name="minOrderValue" 
                      min="0"
                      required
                      value={formData.minOrderValue} 
                      onChange={handleChange}
                      className={inputClass} 
                    />
                  </div>
                </div>
              </div>

              {/* Targeting & Expiry */}
              <div className="bg-white p-6 border border-black/5 shadow-sm space-y-6">
                <div>
                  <label className={labelClass}>Target Regions (Comma Separated)</label>
                  <input 
                    type="text" 
                    name="applicableRegions" 
                    value={formData.applicableRegions} 
                    onChange={handleChange}
                    placeholder="e.g. GLOBAL or IN, US, GB"
                    className={`${inputClass} uppercase`} 
                  />
                  <p className="text-[0.6rem] text-gray-400 mt-1">Use 'GLOBAL' for all countries, or specific 2-letter ISO codes.</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Total Global Limit</label>
                    <input 
                      type="number" 
                      name="usageLimit" 
                      min="1"
                      placeholder="Unlimited if blank"
                      value={formData.usageLimit} 
                      onChange={handleChange}
                      className={inputClass} 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Limit Per User</label>
                    <input 
                      type="number" 
                      name="usagePerUserLimit" 
                      min="1"
                      required
                      value={formData.usagePerUserLimit} 
                      onChange={handleChange}
                      className={inputClass} 
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Expiry Date & Time</label>
                  <input 
                    type="datetime-local" 
                    name="expiryDate" 
                    required
                    value={formData.expiryDate} 
                    onChange={handleChange}
                    className={inputClass} 
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer group pt-2">
                  <div className={`w-5 h-5 border border-black/20 flex items-center justify-center transition-colors ${formData.isAutoApply ? 'bg-black border-black' : 'group-hover:border-black'}`}>
                    {formData.isAutoApply && <Icon icon="ph:check-bold" className="text-white text-xs" />}
                  </div>
                  <input 
                    type="checkbox" 
                    name="isAutoApply" 
                    checked={formData.isAutoApply} 
                    onChange={handleChange}
                    className="hidden" 
                  />
                  <div>
                    <span className="text-sm font-medium block">Auto-Apply at Checkout</span>
                    <span className="text-xs text-gray-500">System automatically applies this to eligible carts.</span>
                  </div>
                </label>
              </div>

            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 p-6 border-t border-black/10 bg-white flex flex-col gap-3">
          
          <button
            type="submit"
            form="couponForm"
            disabled={isActionLoading || isDetailsLoading}
            className="w-full py-4 bg-black text-white text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:bg-black/80 transition-colors flex justify-center items-center disabled:opacity-50"
          >
            {isActionLoading ? <Icon icon="ph:spinner-gap-light" className="animate-spin text-lg" /> : (isEditMode ? "Save Changes" : "Create Coupon")}
          </button>

          {isEditMode && coupon && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={isActionLoading}
                className="flex-1 py-3 border border-black/20 text-[0.65rem] font-bold tracking-widest uppercase hover:bg-gray-50 transition-colors"
              >
                {coupon.isActive ? "Pause Code" : "Reactivate"}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isActionLoading}
                className="flex-1 py-3 border border-red-200 bg-red-50 text-red-600 text-[0.65rem] font-bold tracking-widest uppercase hover:bg-red-100 transition-colors"
              >
                Delete
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default CouponFormDrawer;