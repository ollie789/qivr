import { JSX } from 'react';

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
  image?: string;
}

export interface EventScheduleType {
  info: {
    label: string;
    time: string;
  }[];
  image: {
    src: string;
    alt: string;
  };
}
export interface EventPerformerList {
  performers: string[];
  image: {
    src: string;
    alt: string;
  };
}

export interface organizerEventType {
  id: number;
  title: string;
  image: string;
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
    src: string;
    alt: string;
  }[];
}
