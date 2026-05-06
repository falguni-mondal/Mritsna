import Product from '../../models/product.model.js';

export const getNewArrivals = async (req, res, next) => {
  try {
    // Fetch the 10 most recently created ACTIVE and NON-PREMIUM products
    const newArrivals = await Product.find({ 
      status: 'active', 
      isPremium: false // NEW: Strictly filter out premium products
    })
      .select('title slug isPremium variants.pricing variants.images')
      .sort({ createdAt: -1 }) // -1 gives us the newest products first (Descending date)
      .limit(10)
      .lean(); 

    // Format the data to send a clean, flat object to the frontend
    const formattedProducts = newArrivals.map((product) => {
      // Safely grab the first variant and its first image
      const firstVariant = product.variants?.[0] || {};
      const firstImage = firstVariant.images?.[0] || {};
      const pricing = firstVariant.pricing || { price: 0, discountPercentage: 0 };

      // Calculate final price manually since .lean() removes Mongoose virtuals
      const finalPrice = pricing.discountPercentage > 0 
        ? pricing.price - (pricing.price * (pricing.discountPercentage / 100))
        : pricing.price;

      return {
        _id: product._id,
        slug: product.slug,
        name: product.title,
        isPremium: product.isPremium || false,
        // Sending raw numbers allows the frontend to format the currency locally (Intl.NumberFormat)
        originalPrice: pricing.price,
        finalPrice: finalPrice,
        // Use ImageKit transformations here if you want to request smaller thumbnails!
        img: firstImage.baseUrl || null, 
        altText: firstImage.altText || product.title
      };
    });

    // Send the optimized response
    return res.status(200).json({
      success: true,
      count: formattedProducts.length,
      data: formattedProducts
    });

  } catch (error) {
    console.error("Error fetching new arrivals:", error);
    next(error);
  }
};

export const getPaginatedProducts = async (req, res, next) => {
  try {
    // Extract and sanitize query parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 12); // Default to 12 items (perfect for 3-col or 4-col grids)
    const search = req.query.search || '';
    const category = req.query.category || '';
    const isPremium = req.query.isPremium;
    const sortParams = req.query.sort || 'newest'; // Options: newest, price_asc, price_desc, name_asc

    // Build the exact filter object
    // CRITICAL: Force status to active so guests NEVER see drafts or archived products
    const filter = { status: 'active' };

    // Regex search on title (case-insensitive)
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    if (category) {
      filter.category = category;
    }

    // Safely check for boolean string values
    if (isPremium === 'true') filter.isPremium = true;
    if (isPremium === 'false') filter.isPremium = false;

    // Define the Sorting Strategy
    let sortStrategy = {};
    switch (sortParams) {
      case 'price_asc':
        sortStrategy = { 'variants.pricing.price': 1 };
        break;
      case 'price_desc':
        sortStrategy = { 'variants.pricing.price': -1 };
        break;
      case 'name_asc':
        sortStrategy = { title: 1 };
        break;
      case 'newest':
      default:
        sortStrategy = { createdAt: -1 };
        break;
    }

    const skip = (page - 1) * limit;

    // Execute Data Fetch and Count simultaneously for peak performance
    const [products, totalCount] = await Promise.all([
      Product.find(filter)
        // Select only the data required to render a product catalog card
        .select('title slug category isPremium variants.pricing variants.images createdAt')
        .sort(sortStrategy)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter)
    ]);

    // Transform data into flat, clean UI components
    const formattedProducts = products.map((product) => {
      const firstVariant = product.variants?.[0] || {};
      const firstImage = firstVariant.images?.[0] || {};
      const pricing = firstVariant.pricing || { price: 0, discountPercentage: 0 };

      const finalPrice = pricing.discountPercentage > 0 
        ? pricing.price - (pricing.price * (pricing.discountPercentage / 100))
        : pricing.price;

      return {
        _id: product._id,
        slug: product.slug,
        name: product.title,
        category: product.category,
        isPremium: product.isPremium || false,
        originalPrice: pricing.price,
        finalPrice: finalPrice,
        discount: pricing.discountPercentage,
        img: firstImage.baseUrl || null,
        altText: firstImage.altText || product.title
      };
    });

    // Return Data with Pagination Metadata
    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      data: formattedProducts,
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