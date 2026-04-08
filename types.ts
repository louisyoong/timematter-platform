
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  ORGANIZER = 'ORGANIZER',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isBlocked: boolean;
  joinedEvents: string[]; // Event IDs
}

export interface Event {
  id: string;
  title: string;
  description: string;
  bannerUrl: string;
  dateTime: string;
  location: string;
  category: string;
  organizerId: string;
  organizerName: string;
  isBlocked: boolean;
  joinedCount: number;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  author: string;
  claps: number;
  date: string;
}

export interface FAQ {
  question: string;
  answer: string;
}
