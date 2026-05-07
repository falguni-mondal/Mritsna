import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchSingleProduct, clearSingleProduct } from "../store/features/productSlice";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Icon } from "@iconify/react";

// Sub-components
import ProductGallery from "../components/product/ProductGallery";
import ProductInfo from "../components/product/ProductInfo";
import ProductActions from "../components/product/ProductActions";
import ProductAccordion from "../components/product/ProductAccordion";

const Product = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const containerRef = useRef(null);

  // Zoom State lifted to parent
  const [desktopZoom, setDesktopZoom] = useState({ show: false, img: "", x: 0, y: 0 });

  const { singleProduct: product, isLoading, isError, message } = useSelector((state) => state.product);

  useEffect(() => {
    dispatch(fetchSingleProduct(slug));
    return () => { dispatch(clearSingleProduct()); };
  }, [dispatch, slug]);

  useGSAP(() => {
    if (product) {
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
  }, [product]);

  if (isLoading || !product) {
    return (
      <main className="w-full min-h-screen bg-[#f8f8f8] flex items-center justify-center">
         <Icon icon="lucide:loader-2" className="animate-spin text-gray-400" width="32" />
      </main>
    );
  }

  if (isError) {
    return (
      <main className="w-full min-h-screen bg-[#f8f8f8] flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <p className="text-gray-500 mb-8">{message}</p>
        <Link to="/shop" className="bg-[#1a1a1a] text-white px-8 py-3 text-xs tracking-widest uppercase font-bold">Return to Shop</Link>
      </main>
    );
  }

  const activeVariant = product.variants[0];

  return (
    <main ref={containerRef} className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a] pt-[80px] lg:pt-[100px] pb-20">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row gap-12 lg:gap-20">
        
        {/* LEFT COLUMN */}
        <ProductGallery images={activeVariant.images} setDesktopZoom={setDesktopZoom} />

        {/* RIGHT COLUMN */}
        <div className="w-full lg:w-[45%] relative">
          <div className="lg:sticky lg:top-[120px] flex flex-col items-start w-full lg:max-w-[500px]">
            
            {/* TEXT WRAPPER - Fades out when zooming */}
            <div className={`transition-opacity duration-300 w-full ${desktopZoom.show ? "lg:opacity-0 pointer-events-none" : "opacity-100"}`}>
              <ProductInfo product={product} activeVariant={activeVariant} />
              <ProductActions activeVariant={activeVariant} />
              <ProductAccordion product={product} variant={activeVariant} />
            </div>

            {/* ZOOM LENS - Re-positioned securely inside the sticky column */}
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
    </main>
  );
};

export default Product;