'use client';

import { Slide } from 'yet-another-react-lightbox';
import Box from '@mui/material/Box';
import useLightbox from 'hooks/useLightbox';
import { FileType, FolderType } from 'types/file-manager';
import Lightbox from 'components/base/Lightbox';
import FileGridItem from './FileGridItem';

interface GridViewProps {
  allFiles: (FileType | FolderType)[];
}

const GridView = ({ allFiles }: GridViewProps) => {
  const { openLightbox, ...lightboxProps } = useLightbox();

  const lightboxSlides: Slide[] = allFiles
    .map(({ extension, src, name }) => {
      if (!src) return null;

      const srcString = typeof src === 'string' ? src : src.src;

      switch (extension) {
        case 'png':
        case 'jpg':
        case 'jpeg':
          return {
            src: srcString,
            type: 'image',
            title: `${name}.${extension}`,
          } as Slide;
        case 'mp4':
          return {
            src: srcString,
            type: 'video',
            title: `${name}.${extension}`,
            sources: [{ src: srcString, type: 'video/mp4' }],
          } as Slide;
        default:
          return null;
      }
    })
    .filter(Boolean) as Slide[];

  const fileIdToMediaIndex = new Map<number, number>();
  allFiles
    .filter(({ extension }) => ['png', 'jpg', 'jpeg', 'mp4'].includes(extension as string))
    .forEach((file, index) => {
      fileIdToMediaIndex.set(file.id, index);
    });

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(auto-fill, minmax(175px, 1fr))',
            sm: 'repeat(auto-fill, minmax(205px, 1fr))',
            md: 'repeat(auto-fill, minmax(185px, 1fr))',
            xl: 'repeat(auto-fill, minmax(205px, 1fr))',
          },
          gap: 2,
        }}
      >
        {allFiles.map((file) => (
          <FileGridItem
            key={file.id}
            file={file}
            mediaIndex={fileIdToMediaIndex.get(file.id)}
            openLightbox={openLightbox}
          />
        ))}
      </Box>
      <Lightbox
        slides={lightboxSlides}
        extension={['caption', 'fullscreen', 'slideshow', 'thumbnails', 'video', 'zoom']}
        {...lightboxProps}
      />
    </>
  );
};

export default GridView;
