"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function ShuffleCarousel({ images }) {
    const [currentImages, setCurrentImages] = useState(
        () => (images || []).filter((img) => !img.is_deleted)
    );
    const [currentIndex, setCurrentIndex] = useState(0);

    // Re-sync whenever a new `images` prop comes in (e.g. the user focused a
    // different game). Without this, `currentImages` stayed pinned to
    // whatever game was focused first, since useState's initial value is
    // only used on mount.
    useEffect(() => {
        const validImages = (images || []).filter((img) => !img.is_deleted);
        setCurrentImages(validImages);
        setCurrentIndex(0);
    }, [images]);

    // Fallback if there are no images (or none left after filtering).
    if (!currentImages || currentImages.length === 0) {
        return <div className="p-4 text-center text-gray-500">No images available.</div>;
    }

    // Navigation handlers
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
                    key={activeImage.id}
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
