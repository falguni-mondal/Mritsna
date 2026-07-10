import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Icon } from '@iconify/react';
import { format } from 'date-fns';

import { fetchProductReviews, checkReviewEligibility } from '../../store/features/reviewSlice';
import WriteReview from './WriteReview';

const ProductReviews = ({ product }) => {
  const dispatch = useDispatch();
  
  const { 
    reviews, 
    isFetchingReviews, 
    eligibilityStatus, 
    isCheckingEligibility 
  } = useSelector((state) => state.reviews);

  useEffect(() => {
    if (product?.id && product?.slug) {
      dispatch(fetchProductReviews(product.slug));
      dispatch(checkReviewEligibility(product.id));
    }
  }, [dispatch, product]);

  const renderStars = (rating, size = "14") => {
    return (
      <div className="flex gap-1 text-[#C5A880]">
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon key={star} icon={star <= rating ? "ph:star-fill" : "ph:star"} width={size} />
        ))}
      </div>
    );
  };

  return (
    <section className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-20 border-t border-black/5">
      <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
        
        {/* Left Column: Summary & Form */}
        <div className="w-full lg:w-[35%]">
          <h2 className="text-xl font-light uppercase tracking-widest mb-10">Customer Reviews</h2>
          
          <div className="flex items-center gap-6 mb-12">
            <div className="text-6xl font-light tracking-tighter text-[#1a1a1a]">
              {product.averageRating?.toFixed(1) || '0.0'}
            </div>
            <div className="flex flex-col gap-2 mt-1">
              {renderStars(Math.round(product.averageRating || 0), "18")}
              <span className="text-[11px] text-gray-500 uppercase tracking-widest">
                Based on {product.totalReviews || 0} Reviews
              </span>
            </div>
          </div>

          {/* Conditional Form Rendering */}
          {isCheckingEligibility ? (
             <div className="h-64 bg-[#f8f8f8] animate-pulse border border-black/5"></div>
          ) : (
            (eligibilityStatus === 'CAN_REVIEW' || eligibilityStatus === 'ALREADY_REVIEWED') && (
              <WriteReview productId={product._id} />
            )
          )}
        </div>

        {/* Right Column: Review List */}
        <div className="w-full lg:w-[65%]">
          {isFetchingReviews ? (
            <div className="flex items-center justify-center py-32">
              <Icon icon="ph:spinner-gap-bold" className="animate-spin text-gray-300" width="32" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-32 text-center border border-black/5 bg-white flex flex-col items-center">
              <Icon icon="ph:chat-teardrop-light" className="text-gray-200 mb-6" width="48" />
              <p className="text-sm font-light text-gray-500 uppercase tracking-widest">No reviews yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {reviews.map((review) => (
                <div key={review._id} className="bg-white p-8 border border-black/5 relative">
                  
                  {/* Badge for Pending Reviews */}
                  {review.status === 'pending' && (
                    <span className="absolute top-8 right-8 text-[9px] bg-[#f8f8f8] text-gray-600 px-3 py-1 uppercase tracking-widest border border-black/5">
                      Pending Approval
                    </span>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                    {renderStars(review.rating)}
                    <span className="hidden sm:block text-gray-200">|</span>
                    <h4 className="text-sm font-bold uppercase tracking-wide">{review.author}</h4>
                    
                    {review.isVerifiedBuyer && (
                      <span className="text-[10px] text-black uppercase tracking-widest font-bold flex items-center gap-1.5 bg-[#f8f8f8] px-2.5 py-1 border border-black/5">
                        <Icon icon="ph:seal-check-fill" className="text-[#C5A880]" width="14" /> Verified
                      </span>
                    )}
                    
                    <span className="text-[11px] text-gray-400 uppercase tracking-widest sm:ml-auto">
                      {format(new Date(review.createdAt), 'MMMM dd, yyyy')}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-4">
                    Variant: <span className="font-bold text-black">{review.colorName}</span>
                  </p>

                  <p className="text-sm text-[#1a1a1a] leading-relaxed mb-6 font-light">{review.comment}</p>

                  {review.images?.length > 0 && (
                    <div className="flex flex-wrap gap-4 mt-2">
                      {review.images.map((img) => (
                        <a 
                          key={img.imagekitFileId} 
                          href={img.baseUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="block w-20 h-20 bg-[#f8f8f8] border border-black/5 hover:border-black/20 transition-colors"
                        >
                          <img src={`${img.baseUrl}?tr=w-150,h-150,q-80`} alt="Customer upload" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductReviews;