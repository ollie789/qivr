import { type Theme } from '@mui/material';
import 'swiper/css';
import 'swiper/css/pagination';

const swiper = ({ vars, spacing }: Theme) => ({
  '& .swiper': {
    '& .swiper-pagination': {
      '& .swiper-pagination-bullet': {
        backgroundColor: vars.palette.common.white,
        opacity: 0.5,

        '&.swiper-pagination-bullet-active': {
          backgroundColor: vars.palette.primary.main,
          width: spacing(3),
          borderRadius: spacing(0.5),
          opacity: 1,
        },
      },
    },
  },
  '& .swiper-button-disabled': {
    opacity: 0.5,
    pointerEvents: 'none',
  },
});
export default swiper;
