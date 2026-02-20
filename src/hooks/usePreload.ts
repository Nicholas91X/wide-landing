import { useState, useCallback, useRef } from 'react';

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
 * Supports cancellation: when preloadFrames is called again while a previous
 * load is still in flight, the old results are discarded.
 */
export function usePreload(): UsePreloadReturn {
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const [progress, setProgress] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    // Monotonically increasing generation counter — lets us discard
    // results from a superseded (cancelled) load.
    const generationRef = useRef(0);

    const preloadFrames = useCallback(
        async (basePath: string, count: number, padLength: number = 4): Promise<HTMLImageElement[]> => {
            // Bump the generation so any in-flight load knows it's stale.
            const myGeneration = ++generationRef.current;

            setIsLoaded(false);
            setProgress(0);
            setImages([]);

            let loadedCount = 0;
            const loadedImages: HTMLImageElement[] = new Array(count);

            const loadImage = (index: number): Promise<HTMLImageElement> => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    const frameNumber = String(index + 1).padStart(padLength, '0');
                    img.src = `${basePath}/frame_${frameNumber}.webp`;

                    img.onload = () => {
                        // If a newer load has started, stop updating state.
                        if (generationRef.current !== myGeneration) {
                            resolve(img); // still resolve so Promise.all settles
                            return;
                        }
                        loadedCount++;
                        setProgress(Math.round((loadedCount / count) * 100));
                        loadedImages[index] = img;
                        resolve(img);
                    };

                    img.onerror = () => {
                        reject(new Error(`Failed to load frame: ${img.src}`));
                    };
                });
            };

            try {
                const promises = Array.from({ length: count }, (_, i) => loadImage(i));
                await Promise.all(promises);

                // Only apply results if this is still the current generation.
                if (generationRef.current === myGeneration) {
                    setImages(loadedImages);
                    setIsLoaded(true);
                }
                return loadedImages;
            } catch (error) {
                if (generationRef.current === myGeneration) {
                    console.error('Preloading failed:', error);
                }
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
