import { 
  Home, 
  Bug, 
  Sparkles, 
  Wrench, 
  Settings, 
  Server, 
  Briefcase, 
  Coffee, 
  Heart,
  Hammer
} from 'lucide-react';
import { ServiceCategory, Booking, BookingStatus, Technician } from './types';

export const SERVICES: ServiceCategory[] = [
  { id: '1', label: 'House Maintenance', icon: Home, description: 'General repairs and upkeep.' },
  { id: '2', label: 'Pest Control', icon: Bug, description: 'Remove unwanted pests.' },
  { id: '3', label: 'Cleaning', icon: Sparkles, description: 'Deep cleaning services.' },
  { id: '4', label: 'Installation', icon: Hammer, description: 'Install appliances and fixtures.' }, 
  { id: '5', label: 'Motor Maintenance', icon: Settings, description: 'Vehicle and motor servicing.' },
  { id: '6', label: 'System Admin', icon: Server, description: 'IT and network support.' },
  { id: '7', label: 'Other Services', icon: Briefcase, description: 'Miscellaneous professional services.' },
  { id: '8', label: 'Food & Beverages', icon: Coffee, description: 'Catering and food delivery.' },
  { id: '9', label: 'Wellness', icon: Heart, description: 'Health and personal care.' },
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: '101',
    serviceId: '3', // Cleaning
    date: new Date(new Date().setDate(new Date().getDate() + 2)), // 2 days from now
    time: '10:00 AM',
    status: BookingStatus.UPCOMING,
    technicianName: 'Sarah Jenkins',
    address: '123 Main St, Springfield',
    description: 'Deep cleaning of living room and kitchen.',
    price: 85
  },
  {
    id: '102',
    serviceId: '1', // House Maintenance
    date: new Date(new Date().setDate(new Date().getDate() - 5)), // 5 days ago
    time: '02:00 PM',
    status: BookingStatus.COMPLETED,
    technicianName: 'Mike Reynolds',
    address: '123 Main St, Springfield',
    description: 'Fixing leaking pipe in the master bathroom.',
    price: 45
  },
  {
    id: '103',
    serviceId: '5', // Motor Maintenance
    date: new Date(new Date().setDate(new Date().getDate() - 20)), // 20 days ago
    time: '09:00 AM',
    status: BookingStatus.COMPLETED,
    technicianName: 'AutoFix Inc.',
    address: '456 Oak Rd, Springfield',
    description: 'Regular car servicing.',
    price: 120
  }
];

export const MOCK_TECHNICIAN: Technician = {
  id: 't1',
  name: 'Mike Reynolds',
  role: 'Senior Technician',
  rating: 4.9,
  reviewCount: 128,
  jobsCompleted: 342,
  experience: '8 Years',
  about: 'Certified professional with over 8 years of experience in home maintenance and repairs. Specialized in plumbing, electrical fixes, and smart home installations. I take pride in delivering high-quality work and ensuring customer satisfaction.',
  reviews: [
    { id: 'r1', userName: 'Alice Smith', rating: 5, comment: 'Mike was on time and fixed the leak quickly. Very professional!', date: '2 days ago' },
    { id: 'r2', userName: 'Bob Johnson', rating: 4, comment: 'Good job, but arrived a bit late due to traffic. Work was excellent though.', date: '1 week ago' },
    { id: 'r3', userName: 'Carol Williams', rating: 5, comment: 'Explained everything clearly and left the place clean. Highly recommend.', date: '2 weeks ago' }
  ],
  portfolio: [
    'https://images.unsplash.com/photo-1581578731117-104f2a863a18?q=80&w=300&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1621905476059-5f34604809b6?q=80&w=300&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1505798577917-a65157d3320a?q=80&w=300&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=300&auto=format&fit=crop'
  ]
};