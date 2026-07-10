import React, { useEffect, useRef, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchSingleProduct, clearSingleProduct } from "../store/features/productSlice";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Icon } from "@iconify/react";

// Sub-components
import ProductGallery from "../components/product/ProductGallery";
import ProductInfo from "../components/product/ProductInfo";
import ProductSwatches from "../components/product/ProductSwatches";
import ProductActions from "../components/product/ProductActions";
import ProductAccordion from "../components/product/ProductAccordion";
import ProductReviews from "../components/product/ProductReviews";

const Product = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const containerRef = useRef(null);

  const [desktopZoom, setDesktopZoom] = useState({ show: false, img: "", x: 0, y: 0 });
  const [activeVariant, setActiveVariant] = useState(null);

  // Pull product data AND the localized currency strings from Redux
  const { 
    singleProduct: product, 
    isLoading, 
    isError, 
    message,
    currencySymbol,
    currencyCode
  } = useSelector((state) => state.product);

  // Fetch the product when the component mounts or the slug changes
  useEffect(() => {
    dispatch(fetchSingleProduct(slug));
    return () => { dispatch(clearSingleProduct()); };
  }, [dispatch, slug]);

  // Sync the variant state with the URL and Product Data
  useEffect(() => {
    if (product && product.variants?.length > 0) {
      const urlVariantId = searchParams.get("variant");
      
      // Look for the variant in the URL, otherwise default to the 0th variant
      const matchedVariant = product.variants.find(v => v.variantId === urlVariantId);
      setActiveVariant(matchedVariant || product.variants[0]);
    }
  }, [product, searchParams]);

  // Handle when a user clicks a color swatch
  const handleVariantChange = (variant) => {
    setActiveVariant(variant);
    // Silently update the URL without refreshing the page
    setSearchParams({ variant: variant.variantId }, { replace: true });
  };

  // Entrance Animations
  useGSAP(() => {
    // Only run the entrance animation once when the product initially loads
    if (product && activeVariant) {
      const tl = gsap.timeline({ delay: 0.1 });
      tl.fromTo(".product-image", 
        { opacity: 0, y: 50, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 1.2, stagger: 0.15, ease: "power3.out" }
      )
      .fromTo(".product-info-item",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "power2.out" },
        "-=1.5" 
      );
    }
  }, [product]); // Removed activeVariant dependency so GSAP doesn't re-run on color change

  // Loading State
  if (isLoading || !product || !activeVariant) {
    return (
      <main className="w-full min-h-screen bg-[#f8f8f8] flex items-center justify-center">
         <Icon icon="lucide:loader-2" className="animate-spin text-gray-400" width="32" />
      </main>
    );
  }

  // Error State
  if (isError) {
    return (
      <main className="w-full min-h-screen bg-[#f8f8f8] flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <p className="text-gray-500 mb-8">{message}</p>
        <Link to="/shop" className="bg-[#1a1a1a] text-white px-8 py-3 text-xs tracking-widest uppercase font-bold">Return to Shop</Link>
      </main>
    );
  }

  // Main Render
  return (
    <main ref={containerRef} className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a] pt-[80px] lg:pt-[100px] pb-20">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row gap-12 lg:gap-20">
        
        {/* Left Column: Image Gallery */}
        <ProductGallery images={activeVariant.images} setDesktopZoom={setDesktopZoom} />

        {/* Right Column: Sticky Product Info */}
        <div className="w-full lg:w-[45%] relative">
          <div className="lg:sticky lg:top-[120px] flex flex-col items-start w-full lg:max-w-[500px]">
            
            <div className={`transition-opacity duration-300 w-full ${desktopZoom.show ? "lg:opacity-0 pointer-events-none" : "opacity-100"}`}>
              
              <ProductInfo 
                product={product} 
                activeVariant={activeVariant} 
                currencySymbol={currencySymbol}
                currencyCode={currencyCode}
              />
              
              <ProductSwatches 
                variants={product.variants} 
                activeVariant={activeVariant} 
                onVariantChange={handleVariantChange} 
              />
              
              <ProductActions product={product} activeVariant={activeVariant} />
              <ProductAccordion product={product} variant={activeVariant} />
            </div>

            {/* Desktop Zoom Overlay */}
            <div 
              className={`hidden lg:block absolute inset-0 w-full h-[600px] bg-[#f8f8f8] z-10 transition-opacity duration-300 pointer-events-none overflow-hidden rounded-[2px]
                ${desktopZoom.show ? "opacity-100" : "opacity-0"}
              `}
              style={{
                backgroundImage: `url(${desktopZoom.img})`,
                backgroundPosition: `${desktopZoom.x}% ${desktopZoom.y}%`,
                backgroundSize: '400%',
                backgroundRepeat: 'no-repeat'
              }}
            />

          </div>
        </div>

      </div>
      <ProductReviews product={product} />
    </main>
  );
};

export default Product;