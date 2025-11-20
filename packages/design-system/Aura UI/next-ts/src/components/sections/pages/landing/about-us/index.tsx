'use client';

import Hero from 'components/sections/pages/landing/about-us/Hero';
import OurMission from 'components/sections/pages/landing/about-us/OurMission';
import Overview from 'components/sections/pages/landing/about-us/Overview';
import Team from 'components/sections/pages/landing/about-us/Team';
import Clients from 'components/sections/pages/landing/homepage/Clients';

const AboutUs = () => {
  return (
    <>
      <Hero />
      <Overview />
      <OurMission />
      <Clients />
      <Team />
    </>
  );
};

export default AboutUs;
