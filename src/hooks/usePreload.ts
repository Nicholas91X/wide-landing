import { useState, useCallback } from 'react';

interface PreloadResult {
    images: HTMLImageElement[];
    progress: number;
    isLoaded: boolean;
}

interface UsePreloadReturn extends PreloadResult {
    preloadFrames: (basePath: string, count: number, padLength?: number) => Promise<HTMLImageElement[]>;
}

/**
 * Hook for preloading a sequence of frame images with progress tracking.
 * Optimized for scroll-driven canvas animations.
 */
export function usePreload(): UsePreloadReturn {
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const [progress, setProgress] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    const preloadFrames = useCallback(
        async (basePath: string, count: number, padLength: number = 4): Promise<HTMLImageElement[]> => {
            setIsLoaded(false);
            setProgress(0);

            let loadedCount = 0;
            const loadedImages: HTMLImageElement[] = new Array(count);

            const loadImage = (index: number): Promise<HTMLImageElement> => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    const frameNumber = String(index + 1).padStart(padLength, '0');
                    img.src = `${basePath}/frame_${frameNumber}.webp`;

                    img.onload = () => {
                        loadedCount++;
                        setProgress(Math.round((loadedCount / count) * 100));
                        loadedImages[index] = img;
                        resolve(img);
                    };

                    img.onerror = () => {
                        console.error(`Failed to load frame: ${img.src}`);
                        reject(new Error(`Failed to load frame: ${img.src}`));
                    };
                });
            };

            try {
                // Load all frames in parallel
                const promises = Array.from({ length: count }, (_, i) => loadImage(i));
                await Promise.all(promises);

                setImages(loadedImages);
                setIsLoaded(true);
                return loadedImages;
            } catch (error) {
                console.error('Preloading failed:', error);
                throw error;
            }
        },
        []
    );

    return {
        images,
        progress,
        isLoaded,
        preloadFrames,
    };
}

export default usePreload;
