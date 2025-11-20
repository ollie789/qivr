import { Slide } from 'yet-another-react-lightbox';
import Grid from '@mui/material/Grid';
import { profileData } from 'data/social';
import useLightbox from 'hooks/useLightbox';
import Lightbox from 'components/base/Lightbox';
import Media from '../common/Media';

const PhotosTabPanel = () => {
  const { openLightbox, ...lightboxProps } = useLightbox();

  const mediaPhotos = profileData.photos.map((photo) => ({
    type: 'image' as const,
    src: photo,
  }));

  const lightboxSlides: Slide[] = mediaPhotos.map(({ src }) => ({
    src: typeof src === 'string' ? src : src.src,
    type: 'image',
  }));

  return (
    <>
      <Grid container columns={12} spacing={1}>
        {mediaPhotos.map((photo, index) => (
          <Grid key={index} size={{ xs: 6, sm: 4, md: 3 }} sx={{ maxHeight: 184 }}>
            <Media item={photo} index={index} openLightbox={openLightbox} />
          </Grid>
        ))}
      </Grid>
      <Lightbox
        slides={lightboxSlides}
        extension={['caption', 'fullscreen', 'slideshow', 'thumbnails', 'video', 'zoom']}
        {...lightboxProps}
      />
    </>
  );
};

export default PhotosTabPanel;
