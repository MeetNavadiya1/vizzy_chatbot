import React, { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

export default function ImageGrid({ images = [] }) {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!images || images.length === 0) return null;

  // Grid layout class based on number of images
  const getGridLayoutClass = (count) => {
    switch (count) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-3';
      case 4:
        return 'grid-cols-2';
      default:
        return 'grid-cols-2 sm:grid-cols-3';
    }
  };

  return (
    <div className="mt-4 w-full">
      <div className={`grid gap-3 ${getGridLayoutClass(images.length)}`}>
        {images.map((img, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedImage(img)}
            className="group relative cursor-zoom-in overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 pb-[100%] transition-all hover:border-neutral-300 hover:shadow-sm"
          >
            <img
              src={img.url}
              alt={img.alt || `AI generated ${idx + 1}`}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-103"
              loading="lazy"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex items-center justify-center">
              <span className="rounded-full bg-white/90 p-2 shadow-xs text-neutral-800 transition-transform duration-200 group-hover:scale-110">
                <ZoomIn className="h-4 w-4" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-fade-in">
          {/* Close Area */}
          <div
            className="absolute inset-0 cursor-zoom-out"
            onClick={() => setSelectedImage(null)}
          />

          {/* Image Container */}
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl z-10 flex flex-col items-center">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition-colors focus:outline-hidden"
              aria-label="Close image modal"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={selectedImage.url}
              alt={selectedImage.alt || 'AI generated full resolution'}
              className="max-h-[85vh] object-contain"
            />
            {selectedImage.alt && (
              <div className="w-full bg-black/60 px-6 py-4 text-center text-sm text-neutral-200 backdrop-blur-xs">
                {selectedImage.alt}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
