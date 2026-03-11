import { useState, useCallback, useRef } from 'react';

interface PreloadResult {
    images: HTMLImageElement[];
    fallbackImage: HTMLImageElement | null;
    progress: number;
    isLoaded: boolean;
}

interface UsePreloadReturn extends PreloadResult {
    preloadFrames: (basePath: string, count: number, padLength?: number) => Promise<HTMLImageElement[]>;
}

// Fraction of total frames to load before unlocking scroll (0–1).
// 0.5 = 50% of the sequence, so the bar reaches exactly 50% at unlock.
const INITIAL_CHUNK_RATIO = 0.5;

// Background chunks – load in batches to avoid saturating the
// network with 800+ parallel requests.
const BG_CHUNK_SIZE = 40;

/**
 * Hook for preloading a sequence of frame images with progress tracking.
 *
 * Chunked strategy:
 *  0. Load frame 0 first in isolation → stored as fallbackImage.
 *     If any subsequent frame fails or is not yet available, the canvas
 *     will render frame 0 instead of going blank.
 *  1. Load frames 1…INITIAL_CHUNK-1 → set isLoaded=true so scroll unlocks.
 *  2. Continue loading remaining frames in BG_CHUNK_SIZE batches in background.
 *  3. The images array is updated progressively so canvas always has the latest.
 *
 * Supports cancellation via generation counter.
 */
export function usePreload(): UsePreloadReturn {
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const [fallbackImage, setFallbackImage] = useState<HTMLImageElement | null>(null);
    const [progress, setProgress] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    const generationRef = useRef(0);

    const preloadFrames = useCallback(
        async (basePath: string, count: number, padLength: number = 4): Promise<HTMLImageElement[]> => {
            const myGeneration = ++generationRef.current;

            setIsLoaded(false);
            setProgress(0);
            setImages([]);
            setFallbackImage(null);

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
                        // canvas will use the fallback image instead.
                        loadedImages[index] = img; // broken but present
                        loadedCount++;
                        resolve(img);
                    };
                });
            };

            const stale = () => generationRef.current !== myGeneration;

            try {
                // ── Priority phase: frame 0 in isolation → becomes fallback ──
                // This runs before everything else so the canvas always has a
                // valid image to render even if later frames haven't arrived yet.
                await loadImage(0);

                if (stale()) return loadedImages;

                const frame0 = loadedImages[0];
                if (frame0?.naturalWidth) {
                    setFallbackImage(frame0);
                }

                // ── Phase 1: initial chunk (blocks scroll) ──────────────────
                // Frame 0 is already loaded; start from index 1.
                const initialEnd = Math.floor(count * INITIAL_CHUNK_RATIO);
                const initialPromises = Array.from(
                    { length: initialEnd - 1 },
                    (_, i) => loadImage(i + 1)
                );
                await Promise.all(initialPromises);

                if (stale()) return loadedImages;

                // Publish what we have so far and unlock scroll
                setImages([...loadedImages]);
                setIsLoaded(true);

                // ── Phase 2: remaining frames in background chunks ──────────
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
        fallbackImage,
        progress,
        isLoaded,
        preloadFrames,
    };
}

export default usePreload;
