export const calculateRegionalPricing = (basePriceINR, discountPercentage = 0, isPremium = false, regionData) => {
    // Calculate the true selling price in INR first (Base - Discount)
    let sellingPriceINR = basePriceINR;
    if (discountPercentage > 0) {
        sellingPriceINR = Math.round(basePriceINR - (basePriceINR * (discountPercentage / 100)));
    }

    // Domestic (India) Routing - No markup, no conversion needed
    if (regionData.countryCode === 'IN' || regionData.countryCode === 'INDIA') {
        return {
            originalPrice: basePriceINR,
            sellingPrice: sellingPriceINR,
            discountPercentage: discountPercentage,
            currencyCode: 'INR',
            symbol: '₹'
        };
    }

    // International (Export) Routing - Apply Markups
    const exportMarkupINR = isPremium ? 10000 : 5000;
    
    // We add the markup to both the selling price and the original price 
    // so the frontend still shows a realistic "strikethrough" discount UI
    const finalSellingPriceINR = sellingPriceINR + exportMarkupINR;
    const finalOriginalPriceINR = basePriceINR + exportMarkupINR;

    // Multi-Currency Conversion
    const convertedSellingPrice = Math.max(1, Math.round(finalSellingPriceINR * regionData.rate));
    const convertedOriginalPrice = Math.max(1, Math.round(finalOriginalPriceINR * regionData.rate));

    return {
        originalPrice: convertedOriginalPrice,
        sellingPrice: convertedSellingPrice,
        discountPercentage: discountPercentage,
        currencyCode: regionData.currencyCode,
        symbol: regionData.symbol
    };
};