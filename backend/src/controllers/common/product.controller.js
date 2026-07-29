import Product from '../../models/product.model.js'; 
import { calculateRegionalPricing } from '../../utils/pricingEngine.js';

export const getNewArrivals = async (req, res, next) => {
  try {
    const regionData = req.region || { countryCode: 'IN', currencyCode: 'INR', symbol: '₹', rate: 1 };

    const newArrivals = await Product.find({ 
      status: 'active', 
      isPremium: false
    })
      .select('title slug isPremium variants.pricing variants.images')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(); 

    const formattedProducts = newArrivals.map((product) => {
      const firstVariant = product.variants?.[0] || {};
      const firstImage = firstVariant.images?.[0] || {};
      const pricing = firstVariant.pricing || { price: 0, discountPercentage: 0 };

      const localizedPricing = calculateRegionalPricing(
        pricing.price, 
        pricing.discountPercentage, 
        product.isPremium || false, 
        regionData
      );

      return {
        _id: product._id,
        slug: product.slug,
        name: product.title,
        isPremium: product.isPremium || false,
        originalPrice: localizedPricing.originalPrice, 
        finalPrice: localizedPricing.sellingPrice,      
        img: firstImage.baseUrl || null, 
        altText: firstImage.altText || product.title,
        totalReviews: product.totalReviews || 0,
        averageRating: product.averageRating || 0,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedProducts.length,
      data: formattedProducts,
      currencySymbol: regionData.symbol,      
      currencyCode: regionData.currencyCode 
    });

  } catch (error) {
    console.error("Error fetching new arrivals:", error);
    next(error);
  }
};


export const getPaginatedProducts = async (req, res, next) => {
  try {
    const regionData = req.region || { countryCode: 'IN', currencyCode: 'INR', symbol: '₹', rate: 1 };

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 12);
    const search = req.query.search || '';
    const category = req.query.category || '';
    const isPremium = req.query.isPremium;
    const sortParams = req.query.sort || 'material_terracotta'; // Changed fallback

    const filter = { status: 'active' };

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }
    if (category) {
      filter.category = category;
    }
    if (isPremium === 'true') filter.isPremium = true;
    if (isPremium === 'false') filter.isPremium = false;

    // We only use this standard strategy for non-material sorts
    let sortStrategy = {};
    switch (sortParams) {
      case 'price_asc': sortStrategy = { 'variants.pricing.price': 1 }; break;
      case 'price_desc': sortStrategy = { 'variants.pricing.price': -1 }; break;
      case 'name_asc': sortStrategy = { title: 1 }; break;
      case 'newest': sortStrategy = { createdAt: -1 }; break;
    }

    const skip = (page - 1) * limit;

    let products = [];
    let totalCount = 0;

    // --- THE NEW MATERIAL SORTING LOGIC ---
    if (sortParams === 'material_terracotta' || sortParams === 'material_stoneware') {
      
      // We grab the material string safely, convert to lowercase
      const safeMaterial = { $ifNull: [{ $toLower: { $arrayElemAt: ["$variants.attributes.material", 0] } }, ""] };
      
      // Using indexOfCP is much faster and safer than regex for simple substring matching
      const isTerracotta = { 
        $or: [
          { $ne: [{ $indexOfCP: [safeMaterial, "teracotta"] }, -1] },
          { $ne: [{ $indexOfCP: [safeMaterial, "terracotta"] }, -1] }
        ] 
      };
      
      const isStoneware = { $ne: [{ $indexOfCP: [safeMaterial, "stoneware"] }, -1] };

      // Assign hidden priority scores (1 is first, 3 is last)
      const scoreLogic = sortParams === 'material_terracotta'
        ? { $cond: [isTerracotta, 1, { $cond: [isStoneware, 2, 3] }] }
        : { $cond: [isStoneware, 1, { $cond: [isTerracotta, 2, 3] }] };

      [products, totalCount] = await Promise.all([
        Product.aggregate([
          { $match: filter },
          { $addFields: { materialScore: scoreLogic } },
          { $sort: { materialScore: 1, createdAt: -1 } }, // Sort by score, then newest
          { $skip: skip },
          { $limit: limit },
          { $project: { title: 1, slug: 1, category: 1, isPremium: 1, 'variants.pricing': 1, 'variants.images': 1, createdAt: 1 } }
        ]),
        Product.countDocuments(filter)
      ]);

    } else {
      // --- STANDARD SORTING LOGIC (Preserved perfectly) ---
      [products, totalCount] = await Promise.all([
        Product.find(filter)
          .select('title slug category isPremium variants.pricing variants.images createdAt')
          .sort(sortStrategy)
          .skip(skip)
          .limit(limit)
          .lean(),
        Product.countDocuments(filter)
      ]);
    }

    const formattedProducts = products.map((product) => {
      const firstVariant = product.variants?.[0] || {};
      const firstImage = firstVariant.images?.[0] || {};
      const pricing = firstVariant.pricing || { price: 0, discountPercentage: 0 };

      const localizedPricing = calculateRegionalPricing(
        pricing.price, 
        pricing.discountPercentage, 
        product.isPremium || false, 
        regionData
      );

      return {
        _id: product._id,
        slug: product.slug,
        name: product.title,
        category: product.category,
        isPremium: product.isPremium || false,
        originalPrice: localizedPricing.originalPrice, 
        finalPrice: localizedPricing.sellingPrice,      
        discount: localizedPricing.discountPercentage,
        img: firstImage.baseUrl || null,
        altText: firstImage.altText || product.title,
        totalReviews: product.totalReviews || 0,
        averageRating: product.averageRating || 0,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      data: formattedProducts,
      currencySymbol: regionData.symbol,      
      currencyCode: regionData.currencyCode,
      pagination: {
        totalItems: totalCount,
        totalPages: totalPages,
        currentPage: page,
        limit: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching paginated products:", error);
    next(error);
  }
};


export const getSingleProduct = async (req, res, next) => {
  try {
    const regionData = req.region || { countryCode: 'IN', currencyCode: 'INR', symbol: '₹', rate: 1 };

    const { slug } = req.params;
    const product = await Product.findOne({ slug, status: 'active' })
      .select('-pricing.hsnCode -pricing.taxClass -shipping.weightGrams -variants.sku')
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or is no longer available.'
      });
    }

    let formattedDimensions = "Dimensions unavailable";
    if (product.shipping && product.shipping.dimensions) {
      const { lengthCm, widthCm, heightCm } = product.shipping.dimensions;
      formattedDimensions = `L ${lengthCm}cm x W ${widthCm}cm x H ${heightCm}cm`;
    }

    const formattedVariants = product.variants.map(variant => {
      const basePriceINR = variant.pricing?.price || 0;
      const discount = variant.pricing?.discountPercentage || 0;
      
      const localizedPricing = calculateRegionalPricing(
        basePriceINR, 
        discount, 
        product.isPremium || false, 
        regionData
      );

      const stockQuantity = variant.inventory?.quantity || 0;
      const threshold = variant.inventory?.lowStockThreshold || 3;

      return {
        variantId: variant._id,
        isMulticolor: variant.isMulticolor,
        colorName: variant.colorName,
        colorHex: variant.colorHex,
        originalPrice: localizedPricing.originalPrice, 
        finalPrice: localizedPricing.sellingPrice,      
        discountPercentage: localizedPricing.discountPercentage,
        material: variant.attributes?.material,
        finish: variant.attributes?.finish,
        stockQuantity: stockQuantity, 
        
        inStock: stockQuantity > 0 || (variant.inventory?.allowBackorder || false),
        lowStockWarning: stockQuantity > 0 && stockQuantity <= threshold,
        images: variant.images.map(img => ({
          url: img.baseUrl,
          alt: img.altText,
          isPrimary: img.isPrimary
        }))
      };
    });

    const publicProductData = {
      id: product._id,
      slug: product.slug,
      title: product.title,
      description: product.description,
      category: product.category,
      isPremium: product.isPremium,
      dimensions: formattedDimensions,
      variants: formattedVariants,
      currencySymbol: regionData.symbol,
      currencyCode: regionData.currencyCode,
      totalReviews: product.totalReviews,
      averageRating: product.averageRating,
    };

    return res.status(200).json({
      success: true,
      data: publicProductData
    });

  } catch (error) {
    console.error("Error fetching single product:", error);
    next(error);
  }
};


export const searchProducts = async (req, res, next) => {
  try {
    const query = req.query.q || '';
    
    if (!query.trim()) {
      return res.status(200).json({ success: true, data: [] });
    }

    const regionData = req.region || { countryCode: 'IN', currencyCode: 'INR', symbol: '₹', rate: 1 };
    const searchRegex = new RegExp(query, 'i');

    const filter = {
      status: 'active',
      $or: [
        { title: searchRegex },
        { category: searchRegex },
        { 'variants.colorName': searchRegex }
      ]
    };

    const products = await Product.find(filter)
      .select('title slug category isPremium variants.pricing variants.images variants.colorName')
      .limit(6) 
      .lean();

    const formattedProducts = products.map((product) => {
      let matchingVariant = product.variants?.[0] || {};
      
      const colorMatch = product.variants?.find(v => v.colorName.match(searchRegex));
      if (colorMatch) {
        matchingVariant = colorMatch;
      }

      const firstImage = matchingVariant.images?.[0] || {};
      const pricing = matchingVariant.pricing || { price: 0, discountPercentage: 0 };

      const localizedPricing = calculateRegionalPricing(
        pricing.price, 
        pricing.discountPercentage, 
        product.isPremium || false, 
        regionData
      );

      return {
        _id: product._id,
        slug: product.slug,
        title: product.title,
        category: product.category,
        colorName: matchingVariant.colorName,
        isPremium: product.isPremium || false,
        originalPrice: localizedPricing.originalPrice, 
        finalPrice: localizedPricing.sellingPrice,      
        img: firstImage.baseUrl || null,
        altText: firstImage.altText || product.title,
        totalReviews: product.totalReviews,
        averageRating: product.averageRating,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedProducts,
      currencySymbol: regionData.symbol,      
      currencyCode: regionData.currencyCode
    });

  } catch (error) {
    console.error("Error searching products:", error);
    next(error);
  }
};


export const getUniqueCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { status: 'active' });
    categories.sort();

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });

  } catch (error) {
    console.error("Error fetching unique categories:", error);
    next(error);
  }
};