import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import { 
  fetchCollectionById, 
  createNewCollection, 
  updateExistingCollection,
  changeCollectionStatus,
  deleteCollection,
  clearCollectionDetails 
} from "../../store/slices/collectionSlice";

const initialFormState = {
  title: "",
  subtitle: "",
  description: "",
  status: "draft",
  // In a real app, these would be populated by your ImageKit upload component
  heroImage: null, 
  lookbook: { image: null, hotspots: [] },
  gridProducts: [],
  bundle: { products: [], discountPercentage: 0 }
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

const CollectionFormDrawer = ({ isOpen, onClose, collectionId }) => {
  const dispatch = useDispatch();
  
  const { 
    collectionDetails, 
    isLoading 
  } = useSelector((state) => state.adminCollection);
  
  // We'll also grab products to allow admin to select them for grids/bundles
  const { products } = useSelector((state) => state.adminProduct);

  const [formData, setFormData] = useState(initialFormState);
  const isEditMode = Boolean(collectionId);

  // Fetch or Reset Data
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (isEditMode) {
        dispatch(fetchCollectionById(collectionId));
      } else {
        setFormData(initialFormState);
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen, collectionId, dispatch, isEditMode]);

  // Populate form
  useEffect(() => {
    if (isEditMode && collectionDetails) {
      setFormData({
        title: collectionDetails.title,
        subtitle: collectionDetails.subtitle,
        description: collectionDetails.description,
        status: collectionDetails.status,
        heroImage: collectionDetails.heroImage,
        lookbook: {
          image: collectionDetails.lookbook?.image,
          hotspots: collectionDetails.lookbook?.hotspots || []
        },
        // We map to IDs because the form just needs to send IDs back
        gridProducts: collectionDetails.gridProducts.map(p => p._id),
        bundle: {
          products: collectionDetails.bundle?.products.map(p => p._id) || [],
          discountPercentage: collectionDetails.bundle?.discountPercentage || 0
        }
      });
    }
  }, [collectionDetails, isEditMode]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      dispatch(clearCollectionDetails());
      setFormData(initialFormState);
    }, 300);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Minor validation before sending to Zod
    if (formData.gridProducts.length === 0) {
      return toast.error("Select at least one product for the Grid.", toastConfig);
    }

    let resultAction;
    if (isEditMode) {
      resultAction = await dispatch(updateExistingCollection({ id: collectionId, updateData: formData }));
    } else {
      resultAction = await dispatch(createNewCollection(formData));
    }

    if (resultAction.meta.requestStatus === 'fulfilled') {
      toast.success(`Collection ${isEditMode ? 'updated' : 'created'}`, toastConfig);
      handleClose();
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = formData.status === 'active' ? 'draft' : 'active';
    if (!window.confirm(`Change status to ${newStatus.toUpperCase()}?`)) return;
    
    const resultAction = await dispatch(changeCollectionStatus({ id: collectionId, status: newStatus }));
    if (resultAction.meta.requestStatus === 'fulfilled') {
      toast.success("Status updated", toastConfig);
      setFormData(prev => ({ ...prev, status: newStatus }));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("WARNING: This permanently deletes the collection and all associated media. Proceed?")) return;
    
    const resultAction = await dispatch(deleteCollection(collectionId));
    if (resultAction.meta.requestStatus === 'fulfilled') {
      toast.success("Collection deleted", toastConfig);
      handleClose();
    }
  };

  const stopScrollPropagation = (e) => e.stopPropagation();

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
        className={`fixed top-0 right-0 h-[100dvh] w-full max-w-2xl bg-[#f8f8f8] shadow-2xl z-[99999] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.175,1)]
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="shrink-0 px-8 py-6 border-b border-black/10 flex justify-between items-center bg-white">
          <h2 className="text-sm font-bold tracking-widest uppercase">
            {isEditMode ? "Manage Collection" : "Create Collection"}
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
          {isLoading && isEditMode && !collectionDetails ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30">
              <Icon icon="ph:spinner-gap-light" className="text-4xl animate-spin mb-4" />
              <p className="text-xs uppercase tracking-widest font-bold">Loading Editor...</p>
            </div>
          ) : (
            <form id="collectionForm" onSubmit={handleSubmit} className="flex flex-col gap-8">
              
              {/* --- Core Details --- */}
              <div className="bg-white p-6 border border-black/5 shadow-sm space-y-6">
                <div>
                  <label className={labelClass}>Collection Title</label>
                  <input 
                    type="text" 
                    name="title" 
                    required 
                    value={formData.title} 
                    onChange={handleChange}
                    placeholder="e.g. The Obsidian Series"
                    className={`${inputClass} tracking-widest font-bold`} 
                  />
                </div>
                <div>
                  <label className={labelClass}>Subtitle / Season</label>
                  <input 
                    type="text" 
                    name="subtitle" 
                    required 
                    value={formData.subtitle} 
                    onChange={handleChange}
                    placeholder="e.g. Autumn / Winter 2026"
                    className={inputClass} 
                  />
                </div>
                <div>
                  <label className={labelClass}>Editorial Description</label>
                  <textarea 
                    name="description" 
                    required 
                    rows="4"
                    value={formData.description} 
                    onChange={handleChange}
                    placeholder="Poetic description of the collection..."
                    className={`${inputClass} resize-none`} 
                  />
                </div>
              </div>

              {/* --- Media Placeholders (Integrate your ImageKit here) --- */}
              <div className="bg-white p-6 border border-black/5 shadow-sm space-y-6">
                <div>
                  <label className={labelClass}>Hero Parallax Image (High Res)</label>
                  <div className="w-full h-32 border border-dashed border-black/20 flex flex-col items-center justify-center text-gray-400 hover:border-black/50 hover:bg-black/5 transition-colors cursor-pointer">
                     <Icon icon="ph:upload-simple-light" className="text-2xl mb-2" />
                     <span className="text-[0.65rem] uppercase tracking-widest font-bold">Click to Upload Hero</span>
                  </div>
                  {/* Note: Map your ImageKit file response to formData.heroImage */}
                </div>
                
                <div>
                  <label className={labelClass}>Lookbook Lifestyle Image</label>
                  <div className="w-full h-32 border border-dashed border-black/20 flex flex-col items-center justify-center text-gray-400 hover:border-black/50 hover:bg-black/5 transition-colors cursor-pointer">
                     <Icon icon="ph:image-square-light" className="text-2xl mb-2" />
                     <span className="text-[0.65rem] uppercase tracking-widest font-bold">Click to Upload Lookbook</span>
                  </div>
                </div>
              </div>

              {/* --- Array Inputs (Grid & Bundle) --- */}
              <div className="bg-white p-6 border border-black/5 shadow-sm space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className={labelClass}>Grid Products</label>
                    <span className="text-[0.55rem] uppercase tracking-widest text-black/40">{formData.gridProducts.length} Selected</span>
                  </div>
                  <select 
                    multiple
                    className="w-full h-32 border border-black/10 p-2 text-sm outline-none custom-scrollbar"
                    value={formData.gridProducts}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData(prev => ({ ...prev, gridProducts: selected }));
                    }}
                  >
                    {products.map(p => (
                      <option key={p._id} value={p._id} className="py-1">{p.title}</option>
                    ))}
                  </select>
                  <p className="text-[0.6rem] text-gray-400 mt-2">Hold Ctrl/Cmd to select multiple. These will appear in the asymmetric roster.</p>
                </div>

                <div className="pt-4 border-t border-black/5">
                  <div className="flex justify-between mb-2">
                    <label className={labelClass}>"Shop the Set" Bundle Products</label>
                    <span className="text-[0.55rem] uppercase tracking-widest text-black/40">{formData.bundle.products.length} Selected</span>
                  </div>
                  <select 
                    multiple
                    className="w-full h-24 border border-black/10 p-2 text-sm outline-none custom-scrollbar mb-4"
                    value={formData.bundle.products}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData(prev => ({ 
                        ...prev, 
                        bundle: { ...prev.bundle, products: selected } 
                      }));
                    }}
                  >
                    {products.map(p => (
                      <option key={p._id} value={p._id} className="py-1">{p.title}</option>
                    ))}
                  </select>

                  <label className={labelClass}>Bundle Discount Percentage (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={formData.bundle.discountPercentage} 
                    onChange={(e) => setFormData(prev => ({
                      ...prev, 
                      bundle: { ...prev.bundle, discountPercentage: Number(e.target.value) }
                    }))}
                    className={inputClass} 
                  />
                </div>
              </div>

            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 p-6 border-t border-black/10 bg-white flex flex-col gap-3">
          
          <button
            type="submit"
            form="collectionForm"
            disabled={isLoading}
            className="w-full py-4 bg-black text-white text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:bg-black/80 transition-colors flex justify-center items-center disabled:opacity-50"
          >
            {isLoading ? <Icon icon="ph:spinner-gap-light" className="animate-spin text-lg" /> : (isEditMode ? "Save Editorial" : "Publish Collection")}
          </button>

          {isEditMode && collectionDetails && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={isLoading}
                className="flex-1 py-3 border border-black/20 text-[0.65rem] font-bold tracking-widest uppercase hover:bg-gray-50 transition-colors"
              >
                {formData.status === 'active' ? "Unpublish to Draft" : "Publish Live"}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
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

export default CollectionFormDrawer;