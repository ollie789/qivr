import { JSX } from 'react';
import { StaticImageData } from 'next/image';

export interface EventInfo {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  organizerName: string;
  location: string;
  mapLink: string;
}

export interface EventDescriptions {
  content: JSX.Element;
  image?: string | StaticImageData;
}

export interface EventScheduleType {
  info: {
    label: string;
    time: string;
  }[];
  image: {
    src: string | StaticImageData;
    alt: string;
  };
}
export interface EventPerformerList {
  performers: string[];
  image: {
    src: string | StaticImageData;
    alt: string;
  };
}

export interface organizerEventType {
  id: number;
  title: string;
  image: string | StaticImageData;
  priceRange: string;
  description: string;
  date: string;
  time: string;
  location: string;
}

export interface OrganizerInfoType {
  name: string;
  followers: number;
  phone: string;
  email: string;
  description: string;
}

export interface EventTermsConditions {
  terms: {
    id: number;
    description: string;
  }[];
  images: {
    id: number;
    src: string | StaticImageData;
    alt: string;
  }[];
}
