import { useRef } from 'react';
import { Box } from '@mui/material';
import HeroContent from './HeroContent';
import HeroMedia from './HeroMedia';
import { useHeroAnimation } from './useHeroAnimation';

const ShowcaseHero = () => {
  const refs = {
    section: useRef<HTMLDivElement>(null),
    media: useRef<HTMLDivElement>(null),
    text: useRef<HTMLDivElement>(null),
    techStack: useRef<HTMLDivElement>(null),
    buttons: useRef<HTMLDivElement>(null),
  };

  useHeroAnimation(refs);

  return (
    <Box ref={refs.section} sx={{ position: 'relative', overflow: 'hidden' }}>
      <HeroMedia ref={refs.media} />
      <HeroContent textRef={refs.text} techStackRef={refs.techStack} buttonsRef={refs.buttons} />
    </Box>
  );
};

export default ShowcaseHero;
