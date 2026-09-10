import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useDispatch, useSelector } from "react-redux";

import {
  verifyStock,
  addToCartDB,
  addLocalItem,
  hydrateGuestCartAPI 
} from "../../store/features/cartSlice";

import {
  toggleWishlistDB,
  toggleLocalItem,
  hydrateGuestWishlistAPI 
} from "../../store/features/wishlistSlice";

// --- 1. IMPORT THE META PIXEL UTILITY ---
import { trackAddToCart } from "../../utils/metaPixel";

const ProductActions = ({ product, activeVariant }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); 

  const isAuth = useSelector((state) => state.auth?.isAuthenticated);
  const cartItems = useSelector((state) => state.cart?.items || []); 
  const wishlistItems = useSelector((state) => state.wishlist?.items || []);
  
  // --- 2. PULL CURRENCY CODE FROM REDUX ---
  const currencyCode = useSelector((state) => state.product?.currencyCode) || "INR";

  const isItemInCart = cartItems.some((item) => item.variantId === activeVariant.variantId);
  const isInWishlist = wishlistItems.some(
    (item) => item.productId === product.id && item.variantId === activeVariant.variantId
  );

  const [quantity, setQuantity] = useState(1);
  const [isCopied, setIsCopied] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false); 
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  
  const [isVerifyingQty, setIsVerifyingQty] = useState(false);
  const qtyDebounceTimer = useRef(null);

  const { inStock, stockQuantity } = activeVariant;
  const maxLimit = (inStock && stockQuantity <= 0) ? 3 : Math.min(3, stockQuantity);

  useEffect(() => {
    setQuantity(1);
    return () => {
      if (qtyDebounceTimer.current) clearTimeout(qtyDebounceTimer.current);
    };
  }, [activeVariant.variantId]);

  const buyBtnRef = useRef(null);
  const buyRippleRef = useRef(null);
  const buyTextDarkRef = useRef(null);
  const buyTextLightRef = useRef(null);

  const handleQuantity = (type) => {
    let newQty = quantity;
    if (type === "dec" && quantity > 1) newQty -= 1;
    if (type === "inc" && quantity < maxLimit) newQty += 1;
    if (newQty === quantity) return;

    setQuantity(newQty);

    if (qtyDebounceTimer.current) clearTimeout(qtyDebounceTimer.current);

    qtyDebounceTimer.current = setTimeout(async () => {
      setIsVerifyingQty(true); 
      
      try {
        const pingPayload = {
          productId: product.id,
          variantId: activeVariant.variantId,
          requestedQuantity: newQty,
        };

        const stockCheck = await dispatch(verifyStock(pingPayload)).unwrap();

        if (!stockCheck.isAvailable) {
          alert(stockCheck.message);
          setQuantity(stockCheck.availableStock);
        }
      } catch (error) {
        console.error("Stock verification failed:", error);
      } finally {
        setIsVerifyingQty(false); 
      }
    }, 800); 
  };

  const handleMainButtonClick = async () => {
    if (isItemInCart) {
      navigate("/cart");
      return;
    }

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
          })
        ).unwrap();
      } else {
        dispatch(
          addLocalItem({
            productId: product.id,
            variantId: activeVariant.variantId,
            quantity: quantity,
            maxLimit: stockCheck.availableStock,
          })
        );
        dispatch(hydrateGuestCartAPI());
      }

      // --- FIRE ADD TO CART PIXEL EVENT (Standard Add) ---
      trackAddToCart(
        product.title,
        product.id,
        activeVariant.finalPrice * quantity, // Calculate total value added
        currencyCode
      );

      setQuantity(1);
    } catch (error) {
      alert(error || "An error occurred while adding to cart.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNowClick = async () => {
    if (!inStock) return;

    if (isItemInCart) {
      navigate("/checkout");
      return;
    }

    setIsBuying(true);

    try {
      const pingPayload = {
        productId: product.id,
        variantId: activeVariant.variantId,
        requestedQuantity: quantity,
      };

      const stockCheck = await dispatch(verifyStock(pingPayload)).unwrap();

      if (!stockCheck.isAvailable) {
        alert(stockCheck.message);
        setIsBuying(false);
        return;
      }

      if (isAuth) {
        await dispatch(
          addToCartDB({
            productId: product.id,
            variantId: activeVariant.variantId,
            quantity,
          })
        ).unwrap();
      } else {
        dispatch(
          addLocalItem({
            productId: product.id,
            variantId: activeVariant.variantId,
            quantity: quantity,
            maxLimit: stockCheck.availableStock,
          })
        );
        dispatch(hydrateGuestCartAPI());
      }

      // --- 3B. FIRE ADD TO CART PIXEL EVENT (Buy Now) ---
      trackAddToCart(
        product.title,
        product.id,
        activeVariant.finalPrice * quantity, 
        currencyCode
      );

      navigate("/checkout");
    } catch (error) {
      alert(error || "An error occurred while processing your request.");
    } finally {
      setIsBuying(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (isTogglingWishlist) return; 

    if (isAuth) {
      setIsTogglingWishlist(true);
      try {
        await dispatch(toggleWishlistDB({ 
          productId: product.id, 
          variantId: activeVariant.variantId 
        })).unwrap();
      } catch (error) {
        console.error("Failed to update wishlist", error);
      } finally {
        setIsTogglingWishlist(false);
      }
    } else {
      dispatch(toggleLocalItem({
        productId: product.id,
        variantId: activeVariant.variantId,
      }));
      dispatch(hydrateGuestWishlistAPI());
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
    if (!inStock || isBuying || isAdding) return;
    const rect = buyBtnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.set(buyRippleRef.current, { x: x, y: y, scale: 0 });
    gsap.to(buyRippleRef.current, { scale: 1, duration: 0.5, ease: "power3.out" });
    gsap.to(buyTextDarkRef.current, { opacity: 0, duration: 0.3, ease: "power2.out" });
    gsap.to(buyTextLightRef.current, { opacity: 1, duration: 0.3, ease: "power2.out" });
  });

  const handleBuyMouseLeave = contextSafe((e) => {
    if (!inStock || isBuying || isAdding) return;
    const rect = buyBtnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.to(buyRippleRef.current, { scale: 0, x: x, y: y, duration: 0.5, ease: "power3.out" });
    gsap.to(buyTextDarkRef.current, { opacity: 1, duration: 0.3, ease: "power2.out" });
    gsap.to(buyTextLightRef.current, { opacity: 0, duration: 0.3, ease: "power2.out" });
  });

  const isActionDisabled = !inStock || isAdding || isBuying || isVerifyingQty;

  return (
    <div className="product-info-item w-full flex flex-col gap-4 mb-12">
      <div className="flex gap-2 lg:gap-4 h-14 w-full">
        <div className="flex items-center justify-between border border-black/10 px-4 w-[100px] lg:w-32 shrink-0">
          <button
            onClick={() => handleQuantity("dec")}
            disabled={quantity <= 1 || isActionDisabled || isItemInCart}
            className={`p-2 cursor-pointer transition-opacity ${quantity <= 1 || isActionDisabled || isItemInCart ? "opacity-20 cursor-not-allowed" : "opacity-50 hover:opacity-100"}`}
          >
            <Icon icon="ph:minus" />
          </button>

          <span className={`text-sm font-medium ${(!inStock || isItemInCart) && "opacity-30"}`}>
            {quantity}
          </span>

          <button
            onClick={() => handleQuantity("inc")}
            disabled={quantity >= maxLimit || isActionDisabled || isItemInCart}
            className={`p-2 cursor-pointer transition-opacity ${quantity >= maxLimit || isActionDisabled || isItemInCart ? "opacity-20 cursor-not-allowed" : "opacity-50 hover:opacity-100"}`}
          >
            <Icon icon="ph:plus" />
          </button>
        </div>

        <button
          onClick={handleMainButtonClick}
          disabled={(!inStock && !isItemInCart) || isAdding || isVerifyingQty || isBuying}
          className="flex-1 flex justify-center items-center gap-2 bg-[#1a1a1a] text-white text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:bg-black/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdding || isVerifyingQty ? (
            <>
              <Icon
                icon="ph:spinner-gap-bold"
                className="animate-spin text-lg"
              />
              {isVerifyingQty ? "VERIFYING..." : "ADDING..."}
            </>
          ) : isItemInCart ? (
            "Go to Cart"
          ) : inStock ? (
            "Add to Cart"
          ) : (
            "Out of Stock"
          )}
        </button>

        <button 
          onClick={handleWishlistToggle}
          disabled={isTogglingWishlist}
          className={`w-[45px] lg:w-14 border border-black/10 flex items-center justify-center text-xl hover:bg-black/5 transition-colors shrink-0 cursor-pointer disabled:opacity-50 ${isInWishlist ? 'text-[#7e7053] border-[#171410]' : 'text-[#1a1a1a]'}`}
          title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          {isTogglingWishlist ? (
            <Icon icon="ph:spinner-gap-bold" className="animate-spin" />
          ) : (
            <Icon icon={isInWishlist ? "ph:heart-fill" : "ph:heart-light"} />
          )}
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
        onClick={handleBuyNowClick}
        disabled={isActionDisabled}
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
          className={`absolute inset-0 z-10 flex items-center justify-center gap-2 text-[0.65rem] font-bold tracking-[0.2em] uppercase ${!inStock ? "text-black/30" : "text-[#1a1a1a]"}`}
        >
          {isBuying ? <><Icon icon="ph:spinner-gap-bold" className="animate-spin text-lg" /> PROCESSING...</> : inStock ? "Buy it now" : "Unavailable"}
        </span>
        <span
          ref={buyTextLightRef}
          className="absolute inset-0 z-10 flex items-center justify-center gap-2 text-[0.65rem] font-bold tracking-[0.2em] uppercase text-white opacity-0"
        >
          {isBuying ? <><Icon icon="ph:spinner-gap-bold" className="animate-spin text-lg" /> PROCESSING...</> : "Buy it now"}
        </span>
      </button>
    </div>
  );
};

export default ProductActions;