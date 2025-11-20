import React, { ReactElement, ReactNode, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { Box } from '@mui/material';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface RevealImageProps {
  children: ReactNode;
  animateOnScroll?: boolean;
  delay?: number;
  start?: string;
  duration?: number;
  initialBlur?: number;
  initialScale?: number;
  initialOpacity?: number;
}

export default function RevealImage({
  children,
  animateOnScroll = true,
  delay = 0,
  start = 'top 75%',
  duration = 1.2,
  initialBlur = 40,
  initialScale = 1.1,
  initialOpacity = 0,
}: RevealImageProps) {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const images = containerRef.current.querySelectorAll('img');
      const elements = images.length > 0 ? Array.from(images) : [containerRef.current];
      const isImage = images.length > 0;

      gsap.set(elements, {
        filter: `blur(${isImage ? initialBlur : Math.min(initialBlur / 2, 20)}px)`,
        scale: isImage ? initialScale : Math.min(initialScale, 1.05),
        opacity: isImage ? initialOpacity : Math.max(initialOpacity, 0.3),
      });

      const animation = {
        filter: 'blur(0px)',
        scale: 1,
        opacity: 1,
        duration,
        ease: 'power2.out',
        delay,
        stagger: elements.length > 1 ? 0.2 : 0,
      };

      if (animateOnScroll) {
        gsap.to(elements, {
          ...animation,
          scrollTrigger: {
            trigger: containerRef.current,
            start,
            once: true,
          },
        });
      } else {
        gsap.to(elements, animation);
      }
    },
    {
      scope: containerRef,
      dependencies: [
        animateOnScroll,
        delay,
        start,
        duration,
        initialBlur,
        initialScale,
        initialOpacity,
      ],
    },
  );

  if (React.Children.count(children) === 1) {
    const child = React.Children.only(children) as ReactElement<any>;

    return React.cloneElement(child, {
      ref: containerRef,
      style: {
        ...(child.props?.style || {}),
        willChange: 'filter, transform, opacity',
      },
    });
  }

  return (
    <Box ref={containerRef} sx={{ willChange: 'filter, transform, opacity' }}>
      {children}
    </Box>
  );
}
