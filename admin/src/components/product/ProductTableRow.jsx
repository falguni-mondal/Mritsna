import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

const ProductTableRow = ({ product, onStatusToggle }) => {
  return (
    <tr className="gsap-row hover:bg-gray-50/50 transition-colors group opacity-0">
      {/* Product Identity */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200 flex items-center justify-center">
            {product.image ? (
              <img 
                src={`${product.image.baseUrl}?tr=w-100,h-100,q-80`} 
                alt={product.image.altText} 
                className="h-full w-full object-cover"
              />
            ) : (
              <Icon icon="lucide:package" className="text-gray-300 text-2xl" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900 group-hover:text-black transition-colors">
              {product.title}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{product.category}</p>
          </div>
        </div>
      </td>

      {/* Status Badge */}
      <td className="px-6 py-4">
        <button 
          onClick={() => onStatusToggle(product._id, product.status)}
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-colors border ${
            product.status === 'active' 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
              : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${product.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
          {product.status}
        </button>
      </td>

      {/* Inventory */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-900 font-medium">{product.stock} in stock</span>
          {product.lowStock && (
            <Icon icon="lucide:alert-circle" className="text-amber-500" width="14" />
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">SKU: {product.sku}</p>
      </td>

      {/* Price */}
      <td className="px-6 py-4">
        <span className="font-medium text-gray-900">
          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(product.price)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link 
            to={`/admin/products/edit/${product._id}`}
            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors inline-flex"
          >
            <Icon icon="lucide:edit-2" width="16" />
          </Link>
          <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex">
            <Icon icon="lucide:trash-2" width="16" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ProductTableRow;