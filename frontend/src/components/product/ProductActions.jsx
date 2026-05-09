import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useDispatch, useSelector } from "react-redux";

// Import the actions from your newly created slice (Adjust path as needed)
import {
  verifyStock,
  addToCartDB,
  addLocalItem,
} from "../../store/features/cartSlice";

// NOTE: Added `product` prop so we can extract the title and slug for guest carts!
const ProductActions = ({ product, activeVariant }) => {
  const dispatch = useDispatch();

  // 1. Get Auth State
  const isAuth = useSelector((state) => state.auth?.isAuthenticated);

  const [quantity, setQuantity] = useState(1);
  const [isCopied, setIsCopied] = useState(false);
  const [isAdding, setIsAdding] = useState(false); // NEW: Loading state for the button

  const { inStock, stockQuantity } = activeVariant;
  const maxLimit = stockQuantity !== undefined ? Math.min(5, stockQuantity) : 5;

  // Reset quantity back to 1 if the user switches color variants
  useEffect(() => {
    setQuantity(1);
  }, [activeVariant.variantId]);

  const buyBtnRef = useRef(null);
  const buyRippleRef = useRef(null);
  const buyTextDarkRef = useRef(null);
  const buyTextLightRef = useRef(null);

  const handleQuantity = (type) => {
    if (type === "dec" && quantity > 1) setQuantity(quantity - 1);
    if (type === "inc" && quantity < maxLimit) setQuantity(quantity + 1);
  };

  const handleAddToCart = async () => {
    // Loud Error Handling
    if (!product) {
      alert("CRITICAL ERROR: 'product' prop is missing in ProductActions!");
      return;
    }

    if (!inStock) return;

    setIsAdding(true);

    try {
      const pingPayload = {
        productId: product.id,
        variantId: activeVariant.variantId,
        requestedQuantity: quantity,
      };

      const stockCheck = await dispatch(verifyStock(pingPayload)).unwrap();

      if (!stockCheck.isAvailable) {
        alert(stockCheck.message);
        setIsAdding(false);
        return;
      }

      if (isAuth) {
        await dispatch(
          addToCartDB({
            productId: product.id,
            variantId: activeVariant.variantId,
            quantity,
          }),
        ).unwrap();
        console.log("Saved to DB!");
      } else {
        dispatch(
          addLocalItem({
            productId: product.id,
            variantId: activeVariant.variantId,
            slug: product.slug,
            title: product.title,
            colorName: activeVariant.colorName,
            img:
              activeVariant.images?.find((img) => img.isPrimary)?.url ||
              activeVariant.images?.[0]?.url,
            price: activeVariant.finalPrice || activeVariant.originalPrice,
            quantity: quantity,
            maxLimit: stockCheck.availableStock,
          }),
        );
        console.log("Saved to LocalStorage!");
      }

      setQuantity(1);
    } catch (error) {
      alert(error || "An error occurred while adding to cart.");
    } finally {
      setIsAdding(false);
    }
  };

  const fallbackCopy = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleShare = async () => {
    const currentUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title || "Check out this product",
          text: `I thought you might like this ${activeVariant.colorName} variant!`,
          url: currentUrl,
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          fallbackCopy(currentUrl);
        }
      }
    } else {
      fallbackCopy(currentUrl);
    }
  };

  const { contextSafe } = useGSAP();

  const handleBuyMouseEnter = contextSafe((e) => {
    if (!inStock) return;
    const rect = buyBtnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.set(buyRippleRef.current, { x: x, y: y, scale: 0 });
    gsap.to(buyRippleRef.current, {
      scale: 1,
      duration: 0.5,
      ease: "power3.out",
    });
    gsap.to(buyTextDarkRef.current, {
      opacity: 0,
      duration: 0.3,
      ease: "power2.out",
    });
    gsap.to(buyTextLightRef.current, {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out",
    });
  });

  const handleBuyMouseLeave = contextSafe((e) => {
    if (!inStock) return;
    const rect = buyBtnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.to(buyRippleRef.current, {
      scale: 0,
      x: x,
      y: y,
      duration: 0.5,
      ease: "power3.out",
    });
    gsap.to(buyTextDarkRef.current, {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out",
    });
    gsap.to(buyTextLightRef.current, {
      opacity: 0,
      duration: 0.3,
      ease: "power2.out",
    });
  });

  return (
    <div className="product-info-item w-full flex flex-col gap-4 mb-12">
      <div className="flex gap-2 lg:gap-4 h-14 w-full">
        <div className="flex items-center justify-between border border-black/10 px-4 w-[100px] lg:w-32 shrink-0">
          <button
            onClick={() => handleQuantity("dec")}
            disabled={quantity <= 1 || !inStock || isAdding}
            className={`p-2 cursor-pointer transition-opacity ${quantity <= 1 || !inStock || isAdding ? "opacity-20 cursor-not-allowed" : "opacity-50 hover:opacity-100"}`}
          >
            <Icon icon="ph:minus" />
          </button>

          <span className={`text-sm font-medium ${!inStock && "opacity-30"}`}>
            {quantity}
          </span>

          <button
            onClick={() => handleQuantity("inc")}
            disabled={quantity >= maxLimit || !inStock || isAdding}
            className={`p-2 cursor-pointer transition-opacity ${quantity >= maxLimit || !inStock || isAdding ? "opacity-20 cursor-not-allowed" : "opacity-50 hover:opacity-100"}`}
          >
            <Icon icon="ph:plus" />
          </button>
        </div>

        {/* Updated Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={!inStock || isAdding}
          className="flex-1 flex justify-center items-center gap-2 bg-[#1a1a1a] text-white text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:bg-black/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdding ? (
            <>
              <Icon
                icon="ph:spinner-gap-bold"
                className="animate-spin text-lg"
              />
              ADDING...
            </>
          ) : inStock ? (
            "Add to Cart"
          ) : (
            "Out of Stock"
          )}
        </button>

        <button className="w-[45px] lg:w-14 border border-black/10 flex items-center justify-center text-xl hover:bg-black/5 transition-colors shrink-0 cursor-pointer">
          <Icon icon="ph:heart-light" />
        </button>

        <button
          onClick={handleShare}
          className="relative w-[45px] lg:w-14 border border-black/10 flex items-center justify-center text-xl hover:bg-black/5 transition-colors shrink-0 group cursor-pointer"
          title="Share Product"
        >
          {isCopied ? (
            <Icon icon="ph:check" className="text-green-600" />
          ) : (
            <Icon icon="ph:share-network-light" />
          )}

          <span
            className={`absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-white text-[0.55rem] font-bold tracking-wider uppercase px-3 py-1.5 rounded-[2px] whitespace-nowrap transition-all duration-300 pointer-events-none ${isCopied ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
          >
            Link Copied
          </span>
        </button>
      </div>

      <button
        ref={buyBtnRef}
        disabled={!inStock || isAdding}
        onMouseEnter={handleBuyMouseEnter}
        onMouseLeave={handleBuyMouseLeave}
        className="relative overflow-hidden w-full h-14 border border-[#1a1a1a] flex items-center justify-center group disabled:border-black/20 disabled:cursor-not-allowed cursor-pointer"
      >
        <div
          ref={buyRippleRef}
          className="absolute bg-[#1a1a1a] rounded-full pointer-events-none z-0"
          style={{
            width: "1000px",
            height: "1000px",
            top: "-500px",
            left: "-500px",
            transform: "scale(0)",
          }}
        />
        <span
          ref={buyTextDarkRef}
          className={`absolute inset-0 z-10 flex items-center justify-center text-[0.65rem] font-bold tracking-[0.2em] uppercase ${!inStock ? "text-black/30" : "text-[#1a1a1a]"}`}
        >
          {inStock ? "Buy it now" : "Unavailable"}
        </span>
        <span
          ref={buyTextLightRef}
          className="absolute inset-0 z-10 flex items-center justify-center text-[0.65rem] font-bold tracking-[0.2em] uppercase text-white opacity-0"
        >
          Buy it now
        </span>
      </button>
    </div>
  );
};

export default ProductActions;
