import { useState, useCallback, useRef } from 'react';

interface PreloadResult {
    images: HTMLImageElement[];
    progress: number;
    isLoaded: boolean;
}

interface UsePreloadReturn extends PreloadResult {
    preloadFrames: (basePath: string, count: number, padLength?: number) => Promise<HTMLImageElement[]>;
}

// How many frames to load before unlocking scroll.
// ~80 frames covers the first fast+slow segment so the user can
// start scrolling immediately while the rest loads in background.
const INITIAL_CHUNK = 80;

// Background chunks – load in batches to avoid saturating the
// network with 800+ parallel requests.
const BG_CHUNK_SIZE = 40;

/**
 * Hook for preloading a sequence of frame images with progress tracking.
 *
 * Chunked strategy:
 *  1. Load the first INITIAL_CHUNK frames → set isLoaded=true so scroll unlocks
 *  2. Continue loading remaining frames in BG_CHUNK_SIZE batches in background
 *  3. The images array is updated progressively so canvas always has the latest
 *
 * Supports cancellation via generation counter.
 */
export function usePreload(): UsePreloadReturn {
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const [progress, setProgress] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    const generationRef = useRef(0);

    const preloadFrames = useCallback(
        async (basePath: string, count: number, padLength: number = 4): Promise<HTMLImageElement[]> => {
            const myGeneration = ++generationRef.current;

            setIsLoaded(false);
            setProgress(0);
            setImages([]);

            const loadedImages: HTMLImageElement[] = new Array(count);
            let loadedCount = 0;

            const loadImage = (index: number): Promise<HTMLImageElement> => {
                return new Promise((resolve) => {
                    const img = new Image();
                    const frameNumber = String(index + 1).padStart(padLength, '0');
                    img.src = `${basePath}/frame_${frameNumber}.webp`;

                    img.onload = () => {
                        if (generationRef.current !== myGeneration) {
                            resolve(img);
                            return;
                        }
                        loadedImages[index] = img;
                        loadedCount++;
                        setProgress(Math.round((loadedCount / count) * 100));
                        resolve(img);
                    };

                    img.onerror = () => {
                        // Don't reject the whole chain for a single frame –
                        // just leave a gap (canvas will skip it gracefully).
                        loadedImages[index] = img; // broken but present
                        loadedCount++;
                        resolve(img);
                    };
                });
            };

            const stale = () => generationRef.current !== myGeneration;

            try {
                // ── Phase 1: initial chunk (blocks scroll) ──────────────
                const initialEnd = Math.min(INITIAL_CHUNK, count);
                const initialPromises = Array.from({ length: initialEnd }, (_, i) => loadImage(i));
                await Promise.all(initialPromises);

                if (stale()) return loadedImages;

                // Publish what we have so far and unlock scroll
                setImages([...loadedImages]);
                setIsLoaded(true);

                // ── Phase 2: remaining frames in background chunks ──────
                let cursor = initialEnd;
                while (cursor < count) {
                    if (stale()) return loadedImages;

                    const chunkEnd = Math.min(cursor + BG_CHUNK_SIZE, count);
                    const chunkPromises: Promise<HTMLImageElement>[] = [];
                    for (let i = cursor; i < chunkEnd; i++) {
                        chunkPromises.push(loadImage(i));
                    }
                    await Promise.all(chunkPromises);

                    if (stale()) return loadedImages;

                    // Publish updated array so canvas can use new frames
                    setImages([...loadedImages]);
                    cursor = chunkEnd;
                }

                return loadedImages;
            } catch (error) {
                if (!stale()) {
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
