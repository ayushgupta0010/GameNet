"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function ShuffleCarousel({ images }) {
    console.log(images)
    // 1. Initial setup: Filter out deleted images immediately
    const validImages = images.filter((img) => !img.is_deleted);
    const [currentImages, setCurrentImages] = useState(validImages);
    const [currentIndex, setCurrentIndex] = useState(0);


    // 2. Fallback if the array is empty after filtering
    if (!currentImages || currentImages.length === 0) {
        return <div className="p-4 text-center text-gray-500">No images available.</div>;
    }

    // 3. Navigation handlers
    const handleNext = () => {
        setCurrentIndex((prev) => (prev === currentImages.length - 1 ? 0 : prev + 1));
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev === 0 ? currentImages.length - 1 : prev - 1));
    };

    const activeImage = currentImages[currentIndex];

    return (
        <div className="flex flex-col items-center w-full max-w-3xl mx-auto space-y-4 bg-blue-900/25 border-ink-700 border p-1">

            {/* Image Container */}
            <div className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-lg border-gray-500">
                <Image
                    src={activeImage.image}
                    alt={`Carousel image ${activeImage.id}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority
                />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-around w-full px-4 border-t border-gray-600 py-2 bg-black/50">
                <button
                    onClick={handlePrev}
                    className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
                >
                    Previous
                </button>

                <button
                    onClick={handleNext}
                    className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
                >
                    Next
                </button>
                {/* Indicator */}
                <div className="text-sm font-medium text-gray-500">
                    {currentIndex + 1} / {currentImages.length}
                </div>
            </div>

        </div>
    );
}