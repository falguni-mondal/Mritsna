import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';

// Form Data & Redux
import { productValidationSchema } from '../../../utils/validations/productSchema';
import { 
  fetchProductById, 
  updateExistingProduct, 
  resetProductState, 
  clearProductDetails 
} from '../../../store/slices/productSlice'; 

// Reusable Components
import ProductPageHeader from '../../../components/product/ProductPageHeader';
import BasicInfoSection from '../../../components/product/add&update/BasicInfoSection';
import PricingSection from '../../../components/product/add&update/PricingSection';
import ShippingSection from '../../../components/product/add&update/ShippingSection';
import AttributesSection from '../../../components/product/add&update/AttributesSection';
import VariantManager from '../../../components/product/add&update/VariantManager';

const EditProduct = () => {
  const { id } = useParams(); // Grab the product ID from the URL
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Pull the exact variables from your shared Redux slice
  const { productDetails, isLoading, isError, message } = useSelector(
    (state) => state.adminProduct || state.product || {}
  ); 

  // Initialize the Form Engine without default values (we wait for the API)
  const methods = useForm({
    resolver: zodResolver(productValidationSchema),
  });

  // 1. Fetch the product data when the page loads
  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
    }
    
    // Cleanup function: Clear the product details and state when leaving the page
    return () => {
      dispatch(clearProductDetails());
      dispatch(resetProductState());
    };
  }, [id, dispatch]);

  // 2. Auto-fill the form once the data arrives from the backend
  useEffect(() => {
    if (productDetails) {
      // The reset() function takes the DB object and pushes it into all your child components!
      methods.reset(productDetails);
    }
  }, [productDetails, methods]);

  // 3. Form Submission Handler (Updating instead of Creating)
  const onSubmit = async (data) => {
    try {
      // Pass the ID and data using the exact keys your thunk expects: { id, updateData }
      await dispatch(updateExistingProduct({ id, updateData: data })).unwrap();
      
      toast.success("Product updated successfully!");
      navigate('/admin/products');
    } catch (error) {
      console.error("Failed to update product:", error);
      toast.error(error?.message || error || "Failed to update product. Please try again.");
    }
  };

  // If the page is loading the initial data, show a spinner so the form doesn't flicker empty
  if (isLoading && !productDetails) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center w-full">
        <Icon icon="lucide:loader-2" className="animate-spin text-gray-400 mb-4" width="32" />
        <p className="text-sm text-gray-500 font-medium">Loading product data...</p>
      </div>
    );
  }

  // If the product wasn't found (e.g., bad ID in URL), show an error state
  if (isError && !productDetails) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center w-full">
        <Icon icon="lucide:alert-circle" className="text-red-400 mb-4" width="32" />
        <p className="text-sm text-gray-600 font-medium">{message || "Product not found"}</p>
        <button 
          onClick={() => navigate('/admin/products')}
          className="mt-4 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 w-full max-w-7xl mx-auto pb-24">
      <ProductPageHeader 
        title="Edit Product" 
        description="Update inventory, variants, and product details."
        actionLabel="Cancel"
        actionLink="/admin/products"
      />

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="grid grid-cols-1 xl:grid-cols-3 gap-6 relative">
          
          {/* Main Left Column */}
          <div className="xl:col-span-2 space-y-6">
            <BasicInfoSection />
            <VariantManager />
          </div>

          {/* Right Sidebar Column */}
          <div className="space-y-6">
            
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Icon icon="lucide:settings" className="text-gray-400" width="18" />
                Organization
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Status</label>
                  <select 
                    {...methods.register('status')}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Category</label>
                  <select 
                    {...methods.register('category')}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                  >
                    <option value="Vases">Vases</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Dinnerware">Dinnerware</option>
                    <option value="Decor">Decor</option>
                    <option value="Sculpture">Sculpture</option>
                  </select>
                  {methods.formState.errors.category && (
                    <p className="text-red-500 text-xs mt-1">{methods.formState.errors.category.message}</p>
                  )}
                </div>
              </div>
            </div>

            <PricingSection />
            <ShippingSection />
            <AttributesSection />
          </div>

          {/* Sticky Bottom Save Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-3 px-8 z-40 md:pl-64 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button 
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg transition-colors"
            >
              Discard Changes
            </button>
            <button 
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {isLoading ? (
                <Icon icon="lucide:loader-2" className="animate-spin" width="18" />
              ) : (
                <Icon icon="lucide:save" width="18" />
              )}
              {isLoading ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};

export default EditProduct;