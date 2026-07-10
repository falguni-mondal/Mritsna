import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Icon } from '@iconify/react';
import axios from 'axios';
import toast from 'react-hot-toast';

import { submitReview } from '../../store/features/reviewSlice';
import { userAxios } from '../../configs/axiosInstance';

const IMAGEKIT_PUBLIC_KEY = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
const IMAGEKIT_UPLOAD_URL = import.meta.env.VITE_IMAGEKIT_UPLOAD_URL;

// Update this to match wherever your backend serves the ImageKit signature
const IMAGEKIT_AUTH_ENDPOINT = '/products/imagekit/auth'; 

const WriteReview = ({ productId }) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  
  const { eligibilityData, isSubmittingReview, eligibilityStatus } = useSelector((state) => state.reviews);
  
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  
  // Stores the actual File objects and their local preview URLs
  const [selectedFiles, setSelectedFiles] = useState([]); 
  const [isProcessing, setIsProcessing] = useState(false);
  
  const maxImages = 3;

  // --- Handle Local File Selection ---
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (selectedFiles.length + files.length > maxImages) {
      toast.error(`You can only upload a maximum of ${maxImages} images.`);
      return;
    }

    const newFiles = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7) // Temp ID for React keys
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);
    // Reset input so the same file can be selected again if removed
    if (fileInputRef.current) fileInputRef.current.value = ''; 
  };

  const removeFile = (idToRemove) => {
    setSelectedFiles(prev => {
      const filtered = prev.filter(f => f.id !== idToRemove);
      // Clean up browser memory
      const removedFile = prev.find(f => f.id === idToRemove);
      if (removedFile) URL.revokeObjectURL(removedFile.preview);
      return filtered;
    });
  };

  // --- Handle Final Submission & Upload ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (comment.trim().length < 10) {
      return toast.error("Please write a review of at least 10 characters.");
    }
    
    setIsProcessing(true);
    let uploadedImages = [];

    try {
      // 1. Upload images to ImageKit (if any were selected)
      if (selectedFiles.length > 0) {
        // Fetch fresh signature directly
        const authRes = await userAxios.get(IMAGEKIT_AUTH_ENDPOINT);
        const { token, expire, signature } = authRes.data;

        for (const item of selectedFiles) {
          const formData = new FormData();
          formData.append('file', item.file);
          formData.append('fileName', `review_${Date.now()}_${item.file.name}`);
          formData.append('publicKey', IMAGEKIT_PUBLIC_KEY);
          formData.append('signature', signature);
          formData.append('expire', expire);
          formData.append('token', token);
          
          // Isolate guest folders securely
          const folderPath = `/reviews/prod_${productId}/order_${eligibilityData?.orderId || 'guest'}`;
          formData.append('folder', folderPath); 

          const uploadRes = await axios.post(IMAGEKIT_UPLOAD_URL, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          uploadedImages.push({
            imagekitFileId: uploadRes.data.fileId,
            baseUrl: uploadRes.data.url
          });
        }
      }

      // 2. Submit the actual review payload to your backend
      await dispatch(submitReview({
        productId,
        orderId: eligibilityData?.orderId,
        colorName: eligibilityData?.colorName,
        guestName: eligibilityData?.guestName,
        guestEmail: eligibilityData?.guestEmail,
        rating,
        comment,
        images: uploadedImages
      })).unwrap();
      
      toast.success("Review submitted! It will be visible once approved.");
      
      // Cleanup
      selectedFiles.forEach(f => URL.revokeObjectURL(f.preview));
      setSelectedFiles([]);
      setComment('');
      setRating(5);

    } catch (error) {
      console.error("Submission Error:", error);
      toast.error(error.message || "Failed to submit review. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- UI: ALREADY REVIEWED ---
  if (eligibilityStatus === 'ALREADY_REVIEWED' && eligibilityData?.review) {
    const rev = eligibilityData.review;
    return (
      <div className="bg-white border border-black/10 p-6 lg:p-8 mb-12">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center justify-between">
          Your Review 
          <span className="text-[10px] bg-[#f8f8f8] text-black px-3 py-1 border border-black/10 tracking-widest">
            {rev.status}
          </span>
        </h3>
        <div className="flex gap-1 mb-4 text-[#C5A880]">
          {[1, 2, 3, 4, 5].map((star) => (
            <Icon key={star} icon={star <= rev.rating ? "ph:star-fill" : "ph:star"} width="18" />
          ))}
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">{rev.comment}</p>
        {rev.images?.length > 0 && (
          <div className="flex gap-4">
            {rev.images.map(img => (
              <img key={img.imagekitFileId} src={`${img.baseUrl}?tr=w-100,h-100,q-80`} alt="Review" className="w-16 h-16 object-cover border border-black/10" />
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- UI: WRITE REVIEW FORM ---
  return (
    <div className="bg-white border border-black/10 p-6 lg:p-8 mb-12">
      <h3 className="text-lg font-light tracking-wide uppercase mb-2">Write a Review</h3>
      <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-8">
        Purchasing: <span className="font-bold text-black">{eligibilityData?.colorName}</span>
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        
        {/* Star Rating */}
        <div>
          <label className="block text-[11px] uppercase tracking-widest text-gray-500 mb-3">Overall Rating</label>
          <div className="flex gap-1 cursor-pointer w-max">
            {[1, 2, 3, 4, 5].map((star) => (
              <Icon 
                key={star} 
                icon={star <= (hoverRating || rating) ? "ph:star-fill" : "ph:star"} 
                width="28" 
                className={`transition-colors ${star <= (hoverRating || rating) ? "text-[#C5A880]" : "text-gray-200"}`}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              />
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-[11px] uppercase tracking-widest text-gray-500 mb-3">Your Experience</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us what you loved about this piece..."
            className="w-full bg-white border border-black/10 p-4 text-sm focus:outline-none focus:border-black min-h-[120px] resize-y transition-colors"
            required
          />
        </div>

        {/* Native Image Upload */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-[11px] uppercase tracking-widest text-gray-500">
              Add Photos <span className="lowercase normal-case opacity-60">({selectedFiles.length}/{maxImages})</span>
            </label>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {/* Image Previews */}
            {selectedFiles.map((item) => (
              <div key={item.id} className="relative w-24 h-24 group border border-black/10 bg-[#f8f8f8]">
                <img src={item.preview} alt="Upload preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    type="button" 
                    onClick={() => removeFile(item.id)}
                    className="p-2 bg-white text-red-600 hover:bg-red-50 transition-colors shadow-sm"
                  >
                    <Icon icon="lucide:trash-2" width="16" />
                  </button>
                </div>
              </div>
            ))}

            {/* Upload Button */}
            {selectedFiles.length < maxImages && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 border border-dashed border-black/20 flex flex-col items-center justify-center text-gray-400 hover:text-black hover:border-black/40 transition-colors bg-[#f8f8f8]"
              >
                <Icon icon="ph:camera-plus-light" width="24" className="mb-1" />
                <span className="text-[10px] uppercase tracking-widest">Upload</span>
              </button>
            )}
            
            {/* Hidden Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept="image/jpeg, image/png, image/webp" 
              multiple 
              className="hidden" 
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isProcessing || isSubmittingReview}
          className="bg-[#1a1a1a] text-white py-4 text-xs font-bold tracking-[0.2em] uppercase hover:bg-black transition-colors disabled:opacity-50 mt-2 flex justify-center items-center gap-3 w-full sm:w-auto sm:px-12"
        >
          {(isProcessing || isSubmittingReview) ? (
            <>
              <Icon icon="ph:spinner-gap-bold" className="animate-spin" width="16" />
              Processing...
            </>
          ) : (
            "Submit Review"
          )}
        </button>
      </form>
    </div>
  );
};

export default WriteReview;