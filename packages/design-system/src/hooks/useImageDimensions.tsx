import { SyntheticEvent, useState } from 'react';

interface Dimensions {
  width: number;
  height: number;
}

const useImageDimensions = (defaultMaxWidth: number) => {
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);

  const handleImageLoad = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    setDimensions({ width: naturalWidth, height: naturalHeight });
  };

  const maxWidth = dimensions ? Math.min(defaultMaxWidth, dimensions.width) : defaultMaxWidth;
  const aspectRatio = dimensions ? dimensions.width / dimensions.height : 1;

  return { handleImageLoad, maxWidth, aspectRatio };
};

export default useImageDimensions;
