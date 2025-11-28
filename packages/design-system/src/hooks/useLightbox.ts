import { useState, useCallback } from 'react';

/**
 * Hook for managing lightbox/gallery state
 * Useful for image galleries, carousels, and modal image viewers
 * @returns Object with lightbox state and control functions
 */
const useLightbox = () => {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const openLightbox = useCallback((newIndex = 0) => {
    setOpen(true);
    setIndex(newIndex);
  }, []);

  const closeLightbox = useCallback(() => {
    setOpen(false);
  }, []);

  const goToNext = useCallback((totalItems: number) => {
    setIndex((prev) => (prev + 1) % totalItems);
  }, []);

  const goToPrevious = useCallback((totalItems: number) => {
    setIndex((prev) => (prev - 1 + totalItems) % totalItems);
  }, []);

  return {
    open,
    index,
    openLightbox,
    closeLightbox,
    goToNext,
    goToPrevious,
  };
};

export default useLightbox;
