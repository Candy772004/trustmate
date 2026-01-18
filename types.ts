import { LucideIcon } from 'lucide-react';

export enum ScreenState {
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  RESET_PASSWORD = 'RESET_PASSWORD',
  TECH_PROMPT = 'TECH_PROMPT',
  DASHBOARD = 'DASHBOARD',
  SERVICE_DETAIL = 'SERVICE_DETAIL',
  BOOKING = 'BOOKING',
  MY_BOOKINGS = 'MY_BOOKINGS',
  TECHNICIAN_ONBOARDING = 'TECHNICIAN_ONBOARDING',
  ALL_SERVICES = 'ALL_SERVICES',
  SETTINGS = 'SETTINGS',
  HELP_SUPPORT = 'HELP_SUPPORT',
  TECHNICIAN_PROFILE = 'TECHNICIAN_PROFILE',
  EDIT_PROFILE = 'EDIT_PROFILE',
  PAYMENT_METHODS = 'PAYMENT_METHODS',
  ADD_PAYMENT_METHOD = 'ADD_PAYMENT_METHOD',
  ADD_BANK_ACCOUNT = 'ADD_BANK_ACCOUNT',
  TRACKING = 'TRACKING',
  RATING = 'RATING',
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
  NOTIFICATIONS = 'NOTIFICATIONS'
}

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  TECHNICIAN = 'TECHNICIAN',
  ADMIN = 'ADMIN'
}

export enum BookingStatus {
  UPCOMING = 'UPCOMING',
  CONFIRMED = 'CONFIRMED',
  ON_THE_WAY = 'ON_THE_WAY',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface User {
  id: string;
  name: string;
  mobile: string;
  role: UserRole;
  email?: string;
  address?: string;
}

export interface ServiceCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export interface Booking {
  id: string;
  serviceId: string;
  date: Date;
  time: string;
  status: BookingStatus;
  technicianName?: string;
  address: string;
  description: string;
  price: number;
  rating?: number;
  review?: string;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Technician {
  id: string;
  name: string;
  role: string;
  rating: number;
  reviewCount: number;
  jobsCompleted: number;
  experience: string;
  about: string;
  reviews: Review[];
  portfolio: string[];
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'cash' | 'bank';
  brand?: 'visa' | 'mastercard' | 'amex';
  bankName?: string;
  last4?: string;
  expiry?: string;
  label: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: Date;
  read: boolean;
  type: 'status' | 'info' | 'promo';
}