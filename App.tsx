import React, { useState, useEffect } from 'react';
import {
  Wrench,
  ArrowRight,
  User as UserIcon,
  Lock,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Bell,
  LogOut,
  ChevronLeft,
  Calendar,
  Clock,
  FileText,
  Star,
  Check,
  DollarSign,
  CalendarCheck,
  Menu,
  X,
  Settings,
  HelpCircle,
  Home,
  Briefcase,
  Award,
  ThumbsUp,
  MessageSquare,
  Edit,
  CreditCard,
  Wallet,
  Plus,
  Trash2,
  Landmark,
  Shield,
  Info,
  AlertCircle,
  KeyRound,
  Navigation,
  PhoneCall,
  Zap
} from 'lucide-react';
import { ScreenState, User, UserRole, ServiceCategory, Booking, BookingStatus, Technician, PaymentMethod, Review, Notification } from './types';
import { SERVICES, MOCK_BOOKINGS, MOCK_TECHNICIAN } from './constants';
import { loginUser, registerUser, sendOtp, resetUserPassword, sendBookingConfirmationEmail } from './services/authService';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { ServiceCard } from './components/ServiceCard';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  direction: 'forward' | 'backward' | 'none';
  id?: string;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children, className = "", direction, id }) => {
  let animClass = "";
  if (direction === 'forward') animClass = "animate-enter-forward";
  else if (direction === 'backward') animClass = "animate-enter-backward";
  else animClass = "animate-scale-in"; // default initial load

  return (
    <div id={id} className={`w-full h-full flex flex-col overflow-hidden ${animClass} ${className}`}>
      {children}
    </div>
  );
};

// Helpers for Date Generation
const getNextDays = (days: number) => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      fullDate: d,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' })
    });
  }
  return dates;
};

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '01:00 PM', '02:00 PM',
  '03:00 PM', '04:00 PM', '05:00 PM'
];

const App: React.FC = () => {
  // Navigation State
  const [history, setHistory] = useState<ScreenState[]>([ScreenState.LOGIN]);
  const [direction, setDirection] = useState<'forward' | 'backward' | 'none'>('none');

  const currentScreen = history[history.length - 1];

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Notifications State
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'n1',
      title: 'Welcome to TrustMate!',
      message: 'Find the best technicians for your home needs.',
      date: new Date(),
      read: false,
      type: 'promo'
    }
  ]);

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Forgot Password State
  const [forgotData, setForgotData] = useState({
    mobile: '',
    otp: '',
    newPass: '',
    confirmPass: ''
  });

  // Change Password State
  const [changePassData, setChangePassData] = useState({
    currentPass: '',
    newPass: '',
    confirmPass: ''
  });

  // Signup State
  const [signupData, setSignupData] = useState({
    name: '',
    mobile: '',
    confirmMobile: '',
    email: '',
    password: '',
    address: '',
    countryCode: '+91'
  });

  // Technician Onboarding State
  const [techFormData, setTechFormData] = useState({
    specialization: '',
    experience: '',
    hourlyRate: '',
    serviceArea: '',
    bio: ''
  });

  // Notification Preferences State
  const [notificationPrefs, setNotificationPrefs] = useState({
    push: true,
    email: true,
    sms: false
  });

  // Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: 'cash', type: 'cash', label: 'Cash on Delivery' },
    { id: 'c1', type: 'card', brand: 'visa', last4: '4242', expiry: '12/25', label: 'Visa ending in 4242' }
  ]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('cash');
  const [cardFormData, setCardFormData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });
  const [bankFormData, setBankFormData] = useState({
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    routingNumber: ''
  });

  // Booking Flow State
  const [selectedService, setSelectedService] = useState<ServiceCategory | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(MOCK_TECHNICIAN);
  const [bookingStep, setBookingStep] = useState(0);
  const [bookingData, setBookingData] = useState({
    date: null as Date | null,
    time: '',
    description: '',
    address: ''
  });
  const [bookingComplete, setBookingComplete] = useState(false);

  // Tracking State
  const [trackingBooking, setTrackingBooking] = useState<Booking | null>(null);
  const [trackingProgress, setTrackingProgress] = useState(0);

  // Cancel Booking State
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);

  // Rating State
  const [ratingData, setRatingData] = useState({
    bookingId: '',
    rating: 0,
    comment: ''
  });

  // Profile Edit State
  const [editProfileData, setEditProfileData] = useState({
    name: '',
    role: '',
    experience: '',
    about: ''
  });

  // User Bookings State
  const [userBookings, setUserBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [activeBookingTab, setActiveBookingTab] = useState<'upcoming' | 'past'>('upcoming');

  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Effects
  useEffect(() => {
    setError('');
    setFormErrors({});
  }, [currentScreen]);

  useEffect(() => {
    let interval: any;
    if (currentScreen === ScreenState.TRACKING) {
      setTrackingProgress(0);
      interval = setInterval(() => {
        setTrackingProgress(prev => (prev < 100 ? prev + 0.2 : prev));
      }, 50);
    }
    return () => clearInterval(interval);
  }, [currentScreen]);

  // --- Helpers for formatting ---
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\D/g, '').substring(0, 16);
    const parts = [];
    for (let i = 0; i < v.length; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    return parts.join(' ');
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2)}`;
    }
    return v;
  };

  const formatNumeric = (value: string) => {
    return value.replace(/\D/g, '');
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // --- Navigation Helpers ---

  const pushScreen = (screen: ScreenState) => {
    setDirection('forward');
    setHistory(prev => [...prev, screen]);
  };

  const popScreen = () => {
    if (history.length > 1) {
      setDirection('backward');
      setHistory(prev => prev.slice(0, -1));
    }
  };

  const resetStack = (screen: ScreenState) => {
    setDirection('forward');
    setHistory([screen]);
  };

  const navigateFromSidebar = (screen: ScreenState) => {
    setIsSidebarOpen(false);
    if (currentScreen === screen) return;

    // If we're going to dashboard, reset stack to clean history
    if (screen === ScreenState.DASHBOARD) {
      resetStack(ScreenState.DASHBOARD);
    } else {
      pushScreen(screen);
    }
  };

  // --- Notification Helper ---
  const addNotification = (title: string, message: string, type: 'status' | 'info' | 'promo' = 'status') => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      title,
      message,
      date: new Date(),
      read: false,
      type
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const startBookingStatusSimulation = (booking: Booking) => {
    const serviceName = SERVICES.find(s => s.id === booking.serviceId)?.label || 'Service';

    // 1. Technician Assigned (approx 5-8s after booking)
    setTimeout(() => {
      addNotification(
        'Technician Assigned',
        `Mike Reynolds has been assigned to your ${serviceName} request. He will arrive at ${booking.time}.`,
        'status'
      );
    }, 8000);

    // 2. Job Started (approx 15-20s after booking)
    setTimeout(() => {
      addNotification(
        'Job Started',
        `Technician has started working on your ${serviceName} at ${booking.address}.`,
        'status'
      );
    }, 20000);

    // 3. Job Completed (approx 30s after booking)
    setTimeout(() => {
      addNotification(
        'Job Completed',
        `Your ${serviceName} service has been completed successfully. Total amount: $${booking.price}. Tap to rate!`,
        'status'
      );
      // Update local booking status if we can find it
      setUserBookings(prev => prev.map(b =>
        b.id === booking.id ? { ...b, status: BookingStatus.COMPLETED } : b
      ));
    }, 35000);
  };

  // --- Handlers ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!loginEmail.trim()) {
      setFormErrors({ email: 'Email is required' });
      return;
    }
    if (!loginPass.trim()) {
      setFormErrors({ password: 'Password is required' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginUser(loginEmail, loginPass);
      if (response.success && response.user) {
        setCurrentUser(response.user);
        resetStack(ScreenState.DASHBOARD);
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setError('');

    if (!forgotData.mobile.trim() || forgotData.mobile.length < 10) {
      setFormErrors({ mobile: 'Valid mobile number is required' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await sendOtp(forgotData.mobile);
      if (response.success) {
        pushScreen(ScreenState.RESET_PASSWORD);
      } else {
        setError(response.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setError('');

    const errors: Record<string, string> = {};
    if (!forgotData.otp.trim()) errors.otp = 'OTP is required';
    if (!forgotData.newPass.trim()) errors.newPass = 'New password is required';
    if (forgotData.newPass !== forgotData.confirmPass) errors.confirmPass = 'Passwords do not match';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await resetUserPassword(forgotData.mobile, forgotData.otp, forgotData.newPass);
      if (response.success) {
        // Show success logic or direct navigation
        setError(''); // Clear any errors
        setLoginEmail(''); // Was setLoginMobile(forgotData.mobile); cleared for email login
        setLoginPass('');
        // Brief success feedback could be added here
        resetStack(ScreenState.LOGIN);
      } else {
        setError(response.message || 'Reset failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setError('');

    const errors: Record<string, string> = {};
    if (!changePassData.currentPass) errors.currentPass = 'Current password is required';
    if (!changePassData.newPass) errors.newPass = 'New password is required';
    if (changePassData.newPass !== changePassData.confirmPass) errors.confirmPass = 'Passwords do not match';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setChangePassData({ currentPass: '', newPass: '', confirmPass: '' });
      popScreen();
    }, 1500);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormErrors({});

    const errors: Record<string, string> = {};
    if (!signupData.name.trim()) errors.name = "Full Name is required";
    if (!signupData.mobile.trim() || signupData.mobile.length < 10) errors.mobile = "Valid mobile number is required (min 10 digits)";
    if (signupData.mobile !== signupData.confirmMobile) errors.confirmMobile = "Mobile numbers do not match";
    if (!signupData.address.trim()) errors.address = "Address is required";
    if (!signupData.email || !validateEmail(signupData.email)) errors.email = "Valid email is required";
    if (!signupData.password || signupData.password.length < 6) errors.password = "Password must be at least 6 characters";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setError("Please fix the errors below.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await registerUser(signupData);
      if (response.success && response.user) {
        setCurrentUser(response.user);
        // Reset stack so back button doesn't go to auth forms
        resetStack(ScreenState.TECH_PROMPT);
      } else {
        setError(response.message || 'Signup failed');
      }
    } catch (err) {
      setError('Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTechnicianSelection = (isTechnician: boolean) => {
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        role: isTechnician ? UserRole.TECHNICIAN : UserRole.CUSTOMER
      };
      setCurrentUser(updatedUser);
    }

    if (isTechnician) {
      pushScreen(ScreenState.TECHNICIAN_ONBOARDING);
    } else {
      resetStack(ScreenState.DASHBOARD);
    }
  };

  const handleTechOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call to save technician details
    setTimeout(() => {
      setIsLoading(false);
      resetStack(ScreenState.DASHBOARD);
    }, 1500);
  };

  const handleLogout = () => {
    setIsSidebarOpen(false);
    setCurrentUser(null);
    setLoginEmail('');
    setLoginPass('');
    resetStack(ScreenState.LOGIN);
  };

  const handleServiceClick = (service: ServiceCategory) => {
    setSelectedService(service);
    pushScreen(ScreenState.SERVICE_DETAIL);
  };

  const handleTechnicianClick = () => {
    // In a real app, you would pass the ID or object of the clicked technician.
    // Here we use the mock data for Mike Reynolds.
    setSelectedTechnician(MOCK_TECHNICIAN);
    pushScreen(ScreenState.TECHNICIAN_PROFILE);
  };

  const handleProfileClick = () => {
    setIsSidebarOpen(false);
    if (currentUser?.role === UserRole.TECHNICIAN) {
      // Simulate loading own profile for technician
      setSelectedTechnician(MOCK_TECHNICIAN);
      pushScreen(ScreenState.TECHNICIAN_PROFILE);
    } else {
      // For customer, normally go to customer profile, but we'll just log or show dashboard for now
      // as the request is focused on technician profile
      pushScreen(ScreenState.DASHBOARD);
    }
  };

  const startBooking = () => {
    setBookingStep(0);
    setBookingComplete(false);
    setBookingData({
      date: getNextDays(1)[0].fullDate, // Default to today
      time: '',
      description: '',
      address: currentUser?.address || ''
    });
    pushScreen(ScreenState.BOOKING);
  };

  const confirmBooking = () => {
    if (!selectedService || !bookingData.date) return;

    setIsLoading(true);

    // Create new booking object
    const newBooking: Booking = {
      id: Date.now().toString(),
      serviceId: selectedService.id,
      date: bookingData.date,
      time: bookingData.time,
      status: BookingStatus.UPCOMING,
      technicianName: 'Mike Reynolds', // Mock assigned technician
      address: bookingData.address,
      description: bookingData.description,
      price: 32 // Mock price
    };

    // Simulate API call
    setTimeout(async () => {
      setIsLoading(false);
      setBookingComplete(true);
      setUserBookings(prev => [newBooking, ...prev]);

      // Mock sending email
      if (currentUser?.email) {
        await sendBookingConfirmationEmail(currentUser.email, {
          serviceName: selectedService.label,
          technicianName: newBooking.technicianName,
          date: newBooking.date.toLocaleDateString(),
          time: newBooking.time,
          address: newBooking.address,
          price: newBooking.price
        });
      } else if (currentUser) {
        // Fallback if no email in user object but user exists (e.g. from simplistic mockup)
        await sendBookingConfirmationEmail('user@example.com', {
          serviceName: selectedService.label,
          technicianName: newBooking.technicianName,
          date: newBooking.date.toLocaleDateString(),
          time: newBooking.time,
          address: newBooking.address,
          price: newBooking.price
        });
      }

      // After 3 seconds (slightly longer to read), go back to dashboard
      setTimeout(() => {
        resetStack(ScreenState.DASHBOARD);
        startBookingStatusSimulation(newBooking);
      }, 4000);
    }, 1500);
  };

  const handleCancelBooking = () => {
    if (cancelBookingId) {
      setUserBookings(prev => prev.map(b =>
        b.id === cancelBookingId ? { ...b, status: BookingStatus.CANCELLED } : b
      ));
      setCancelBookingId(null);
    }
  };

  const openRating = (booking: Booking) => {
    setRatingData({
      bookingId: booking.id,
      rating: 0,
      comment: ''
    });
    pushScreen(ScreenState.RATING);
  };

  const submitRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (ratingData.rating === 0) return;

    setIsLoading(true);

    setTimeout(() => {
      // 1. Update Booking
      setUserBookings(prev => prev.map(b =>
        b.id === ratingData.bookingId ? { ...b, rating: ratingData.rating, review: ratingData.comment } : b
      ));

      // 2. Update Technician Reviews (Simulated)
      if (selectedTechnician) {
        const newReview: Review = {
          id: `r-${Date.now()}`,
          userName: currentUser?.name || 'User',
          rating: ratingData.rating,
          comment: ratingData.comment,
          date: 'Just now'
        };

        const updatedReviews = [newReview, ...selectedTechnician.reviews];
        const newAverage = updatedReviews.reduce((acc, curr) => acc + curr.rating, 0) / updatedReviews.length;

        const updatedTech = {
          ...selectedTechnician,
          reviews: updatedReviews,
          rating: Number(newAverage.toFixed(1)),
          reviewCount: selectedTechnician.reviewCount + 1
        };

        setSelectedTechnician(updatedTech);
        // Also update constant if needed for persistence in this session
        Object.assign(MOCK_TECHNICIAN, updatedTech);
      }

      setIsLoading(false);
      popScreen(); // Go back to history
    }, 1000);
  };

  const startEditProfile = () => {
    if (selectedTechnician) {
      setEditProfileData({
        name: selectedTechnician.name,
        role: selectedTechnician.role,
        experience: selectedTechnician.experience,
        about: selectedTechnician.about
      });
      pushScreen(ScreenState.EDIT_PROFILE);
    }
  };

  const saveProfileChanges = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      if (selectedTechnician) {
        const updatedTech = {
          ...selectedTechnician,
          ...editProfileData
        };
        setSelectedTechnician(updatedTech);
        // Also update MOCK_TECHNICIAN in a real app to persist, but state is enough here
        Object.assign(MOCK_TECHNICIAN, updatedTech);
      }
      setIsLoading(false);
      popScreen(); // Go back to profile view
    }, 1000);
  };

  const handleAddPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const errors: Record<string, string> = {};
    const cleanNumber = cardFormData.number.replace(/\D/g, '');
    if (cleanNumber.length !== 16) errors.number = "Card number must be 16 digits";

    if (!/^\d{2}\/\d{2}$/.test(cardFormData.expiry)) {
      errors.expiry = "Format must be MM/YY";
    } else {
      const [month, year] = cardFormData.expiry.split('/').map(Number);
      if (month < 1 || month > 12) errors.expiry = "Invalid month";
    }

    if (cardFormData.cvc.length !== 3) errors.cvc = "CVC must be 3 digits";
    if (!cardFormData.name.trim()) errors.name = "Cardholder name is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const newMethod: PaymentMethod = {
        id: `card-${Date.now()}`,
        type: 'card',
        brand: 'visa', // mocking detection
        last4: cleanNumber.slice(-4) || '1234',
        expiry: cardFormData.expiry,
        label: `Visa ending in ${cleanNumber.slice(-4) || '1234'}`
      };

      setPaymentMethods(prev => [...prev, newMethod]);
      setCardFormData({ number: '', expiry: '', cvc: '', name: '' });
      setIsLoading(false);
      popScreen(); // Go back to list
    }, 1000);
  };

  const handleAddBankAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const errors: Record<string, string> = {};
    if (!bankFormData.bankName.trim()) errors.bankName = "Bank Name is required";
    if (!bankFormData.accountHolder.trim()) errors.accountHolder = "Account Holder Name is required";
    if (bankFormData.routingNumber.length !== 9) errors.routingNumber = "Routing number must be 9 digits";
    if (bankFormData.accountNumber.length < 10) errors.accountNumber = "Account number must be at least 10 digits";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const newMethod: PaymentMethod = {
        id: `bank-${Date.now()}`,
        type: 'bank',
        bankName: bankFormData.bankName,
        last4: bankFormData.accountNumber.slice(-4) || '0000',
        label: `${bankFormData.bankName} ••••${bankFormData.accountNumber.slice(-4) || '0000'}`
      };

      setPaymentMethods(prev => [...prev, newMethod]);
      setBankFormData({ bankName: '', accountHolder: '', accountNumber: '', routingNumber: '' });
      setIsLoading(false);
      popScreen();
    }, 1000);
  };

  const deletePaymentMethod = (id: string) => {
    if (id === 'cash') return; // Cannot delete default
    setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
    if (selectedPaymentMethodId === id) {
      setSelectedPaymentMethodId('cash');
    }
  };

  const toggleNotification = (key: keyof typeof notificationPrefs) => {
    setNotificationPrefs(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const startTracking = (booking: Booking) => {
    setTrackingBooking(booking);
    pushScreen(ScreenState.TRACKING);
  };

  // --- Render Functions ---

  const renderSidebar = () => {
    if (!currentUser) return null;

    return (
      <div
        className={`absolute inset-0 z-50 transition-all duration-300 ${isSidebarOpen ? 'visible' : 'invisible'}`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* Drawer */}
        <div
          className={`
            absolute top-0 left-0 bottom-0 w-[80%] max-w-[300px] bg-white shadow-2xl 
            transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1)
            flex flex-col
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {/* Header */}
          <div className="bg-brand-dark p-8 pb-10 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/10 rounded-full translate-x-10 -translate-y-10"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-brand-yellow rounded-2xl flex items-center justify-center text-brand-dark font-bold text-2xl shadow-lg">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">{currentUser.name}</h3>
              <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                {currentUser.mobile}
              </p>
            </div>
          </div>

          {/* Nav Items */}
          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            <button
              onClick={() => navigateFromSidebar(ScreenState.DASHBOARD)}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors"
            >
              <Home size={22} className="text-slate-400" />
              Home
            </button>
            <button
              onClick={() => navigateFromSidebar(ScreenState.MY_BOOKINGS)}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors"
            >
              <CalendarCheck size={22} className="text-slate-400" />
              My Bookings
            </button>
            <button
              onClick={handleProfileClick}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors"
            >
              <UserIcon size={22} className="text-slate-400" />
              Profile
            </button>
            <button
              onClick={() => navigateFromSidebar(ScreenState.PAYMENT_METHODS)}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors"
            >
              <Wallet size={22} className="text-slate-400" />
              Payment Methods
            </button>
            <button
              onClick={() => navigateFromSidebar(ScreenState.SETTINGS)}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors"
            >
              <Settings size={22} className="text-slate-400" />
              Settings
            </button>
            <button
              onClick={() => navigateFromSidebar(ScreenState.HELP_SUPPORT)}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors"
            >
              <HelpCircle size={22} className="text-slate-400" />
              Help & Support
            </button>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-4 rounded-xl text-red-500 bg-red-50 hover:bg-red-100 font-semibold transition-colors"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderLogin = () => (
    <PageTransition direction={direction} className="bg-brand-dark">
      <div className="flex-1 overflow-y-auto no-scrollbar flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md mx-auto space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-brand-yellow rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-brand-yellow/20">
              <Wrench size={40} className="text-brand-dark" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">TrustMate</h1>
            <p className="text-slate-400 mt-2">Your trusted service partner</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl space-y-6">
            <Input
              label="Email Address"
              placeholder="john@example.com"
              type="email"
              leftIcon={<Mail size={18} />}
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              error={formErrors.email}
              className="text-white placeholder:text-slate-500"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', borderColor: formErrors.email ? 'rgb(239 68 68)' : 'rgba(255,255,255,0.1)' }}
            />
            <div className="space-y-1">
              <Input
                label="Password"
                placeholder="••••••"
                type="password"
                leftIcon={<Lock size={18} />}
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                error={formErrors.password}
                className="text-white placeholder:text-slate-500"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', borderColor: formErrors.password ? 'rgb(239 68 68)' : 'rgba(255,255,255,0.1)' }}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => pushScreen(ScreenState.FORGOT_PASSWORD)}
                  className="text-xs text-brand-yellow hover:text-yellow-300 font-medium pt-1"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <Button type="submit" fullWidth isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          <div className="text-center">
            <p className="text-slate-400 text-sm">
              Don't have an account?{' '}
              <button
                onClick={() => pushScreen(ScreenState.SIGNUP)}
                className="text-brand-yellow font-bold hover:underline"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );

  const renderForgotPassword = () => (
    <PageTransition direction={direction} className="bg-slate-50">
      <div className="flex-1 overflow-y-auto no-scrollbar py-8 px-6">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={popScreen}
              className="p-2 -ml-2 rounded-full hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-2xl font-bold text-slate-900">Forgot Password</h2>
          </div>

          <p className="text-slate-500 mb-6 -mt-2">
            Enter your registered mobile number. We will send you a One-Time Password (OTP) to reset your password.
          </p>

          <form onSubmit={handleSendOtp} className="space-y-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <Input
              label="Mobile Number"
              placeholder="9876543210"
              type="tel"
              leftIcon={<Phone size={18} />}
              value={forgotData.mobile}
              onChange={(e) => setForgotData({ ...forgotData, mobile: e.target.value })}
              error={formErrors.mobile}
              required
            />

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
                <AlertCircle size={18} className="text-red-500" />
                {error}
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" fullWidth isLoading={isLoading}>
                Send OTP
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PageTransition>
  );

  const renderResetPassword = () => (
    <PageTransition direction={direction} className="bg-slate-50">
      <div className="flex-1 overflow-y-auto no-scrollbar py-8 px-6">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={popScreen}
              className="p-2 -ml-2 rounded-full hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
          </div>

          <p className="text-slate-500 mb-6 -mt-2">
            Enter the OTP sent to <span className="font-bold text-slate-800">{forgotData.mobile}</span> and set your new password.
            <br /><span className="text-xs text-brand-dark/50">(Use '1234' as OTP)</span>
          </p>

          <form onSubmit={handleResetPassword} className="space-y-5 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">

            <Input
              label="OTP"
              placeholder="1234"
              type="number"
              leftIcon={<KeyRound size={18} />}
              value={forgotData.otp}
              onChange={(e) => setForgotData({ ...forgotData, otp: e.target.value })}
              error={formErrors.otp}
              required
              maxLength={4}
            />

            <Input
              label="New Password"
              placeholder="••••••"
              type="password"
              leftIcon={<Lock size={18} />}
              value={forgotData.newPass}
              onChange={(e) => setForgotData({ ...forgotData, newPass: e.target.value })}
              error={formErrors.newPass}
              required
            />

            <Input
              label="Confirm Password"
              placeholder="••••••"
              type="password"
              leftIcon={<Lock size={18} />}
              value={forgotData.confirmPass}
              onChange={(e) => setForgotData({ ...forgotData, confirmPass: e.target.value })}
              error={formErrors.confirmPass}
              required
            />

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
                <AlertCircle size={18} className="text-red-500" />
                {error}
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" fullWidth isLoading={isLoading}>
                Reset Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PageTransition>
  );

  const renderSignup = () => (
    <PageTransition direction={direction} className="bg-slate-50">
      <div className="flex-1 overflow-y-auto no-scrollbar py-8 px-6">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={popScreen}
              className="p-2 -ml-2 rounded-full hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
          </div>

          <form onSubmit={handleSignup} className="space-y-5 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
                <AlertCircle size={18} className="text-red-500" />
                {error}
              </div>
            )}

            <Input
              label="Full Name"
              placeholder="John Doe"
              leftIcon={<UserIcon size={18} />}
              value={signupData.name}
              onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
              error={formErrors.name}
              required
            />

            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Code</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-2 py-3.5 focus:ring-2 focus:ring-brand-yellow outline-none appearance-none text-center"
                  value={signupData.countryCode}
                  onChange={(e) => setSignupData({ ...signupData, countryCode: e.target.value })}
                >
                  <option value="+91">+91</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                </select>
              </div>
              <div className="col-span-3">
                <Input
                  label="Mobile Number"
                  placeholder="9876543210"
                  type="tel"
                  leftIcon={<Phone size={18} />}
                  value={signupData.mobile}
                  onChange={(e) => setSignupData({ ...signupData, mobile: e.target.value })}
                  error={formErrors.mobile}
                  required
                />
              </div>
            </div>

            <Input
              label="Confirm Mobile"
              placeholder="9876543210"
              type="tel"
              leftIcon={<CheckCircle2 size={18} />}
              value={signupData.confirmMobile}
              onChange={(e) => setSignupData({ ...signupData, confirmMobile: e.target.value })}
              error={formErrors.confirmMobile}
              required
            />

            <Input
              label="Email Address"
              placeholder="john@example.com"
              type="email"
              leftIcon={<Mail size={18} />}
              value={signupData.email}
              onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
              error={formErrors.email}
              required
            />

            <Input
              label="Password"
              placeholder="••••••"
              type="password"
              leftIcon={<Lock size={18} />}
              value={signupData.password}
              onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
              error={formErrors.password}
              required
            />

            <Input
              label="Address"
              placeholder="House No, Street, City"
              leftIcon={<MapPin size={18} />}
              value={signupData.address}
              onChange={(e) => setSignupData({ ...signupData, address: e.target.value })}
              error={formErrors.address}
              required
            />

            <div className="pt-2">
              <Button type="submit" fullWidth isLoading={isLoading}>
                Sign Up
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PageTransition>
  );

  const renderTechnicianPrompt = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center space-y-6 shadow-2xl animate-scale-in">
        <div className="w-24 h-24 bg-brand-yellow/20 rounded-full flex items-center justify-center mx-auto text-brand-yellow">
          <Wrench size={48} />
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-slate-900">Are you a Technician?</h3>
          <p className="text-slate-500">Join our network of professionals to get leads and grow your business.</p>
        </div>

        <div className="space-y-3 pt-2">
          <Button fullWidth onClick={() => handleTechnicianSelection(true)}>
            Register as Technician <ArrowRight size={18} />
          </Button>
          <Button fullWidth variant="ghost" onClick={() => handleTechnicianSelection(false)}>
            No Thanks, I'm a Customer
          </Button>
        </div>
      </div>
    </div>
  );

  const renderTechnicianOnboarding = () => (
    <PageTransition direction={direction} className="bg-slate-50">
      <div className="flex-1 overflow-y-auto no-scrollbar py-8 px-6">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={popScreen}
              className="p-2 -ml-2 rounded-full hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-2xl font-bold text-slate-900">Technician Profile</h2>
          </div>

          <p className="text-slate-500 -mt-2 mb-4">
            Complete your profile to start receiving service requests.
          </p>

          <form onSubmit={handleTechOnboardingSubmit} className="space-y-5 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">

            {/* Specialization Dropdown */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Specialization</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Briefcase size={18} />
                </div>
                <select
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl pl-10 pr-4 py-3.5 focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none appearance-none"
                  value={techFormData.specialization}
                  onChange={(e) => setTechFormData({ ...techFormData, specialization: e.target.value })}
                  required
                >
                  <option value="" disabled>Select a category</option>
                  {SERVICES.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <ChevronLeft size={16} className="-rotate-90" />
                </div>
              </div>
            </div>

            <Input
              label="Years of Experience"
              placeholder="e.g. 5"
              type="number"
              min="0"
              leftIcon={<Star size={18} />}
              value={techFormData.experience}
              onChange={(e) => setTechFormData({ ...techFormData, experience: e.target.value })}
              required
            />

            <Input
              label="Hourly Rate ($)"
              placeholder="e.g. 45"
              type="number"
              min="0"
              leftIcon={<DollarSign size={18} />}
              value={techFormData.hourlyRate}
              onChange={(e) => setTechFormData({ ...techFormData, hourlyRate: e.target.value })}
              required
            />

            <Input
              label="Service Area"
              placeholder="e.g. Downtown, Queens, Brooklyn"
              leftIcon={<MapPin size={18} />}
              value={techFormData.serviceArea}
              onChange={(e) => setTechFormData({ ...techFormData, serviceArea: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio / Description</label>
              <textarea
                placeholder="Describe your skills and expertise..."
                className="w-full bg-white border border-slate-200 rounded-xl p-4 h-32 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none resize-none"
                value={techFormData.bio}
                onChange={(e) => setTechFormData({ ...techFormData, bio: e.target.value })}
                required
              ></textarea>
            </div>

            <div className="pt-2">
              <Button type="submit" fullWidth isLoading={isLoading}>
                Complete Setup
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PageTransition>
  );

  const renderDashboard = () => (
    <PageTransition direction={direction} className="bg-slate-50">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Header */}
        <header className="bg-brand-dark text-white px-6 pt-12 pb-8 rounded-b-[2.5rem] shadow-lg relative z-10">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              {/* Sidebar Toggle */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white transition-colors"
              >
                <Menu size={28} />
              </button>

              <div>
                <h1 className="font-bold text-lg leading-tight">TrustMate</h1>
                <p className="text-xs text-slate-300">
                  Welcome, <span className="capitalize">{currentUser?.name?.split(' ')[0]}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => pushScreen(ScreenState.NOTIFICATIONS)}
                className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <Bell size={22} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-brand-dark animate-pulse"></span>
                )}
              </button>
            </div>
          </div>

          {/* Promo Card */}
          <div className="bg-gradient-to-r from-brand-yellow to-yellow-300 p-5 rounded-2xl shadow-lg flex justify-between items-center text-brand-dark">
            <div>
              <p className="font-bold text-lg mb-1">20% Off</p>
              <p className="text-sm font-medium opacity-80">On your first cleaning</p>
            </div>
            <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-xs font-bold transition-colors">
              Book Now
            </button>
          </div>
        </header>

        {/* Content */}
        {/* Changed from -mt-4 to mt-6 to ensure content is below the header */}
        <main className="px-6 mt-6 relative z-20 pb-20">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Our Services</h2>
            <button
              onClick={() => pushScreen(ScreenState.ALL_SERVICES)}
              className="text-brand-dark text-xs font-semibold hover:underline"
            >
              See All
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {SERVICES.map((service) => (
              <ServiceCard
                key={service.id}
                label={service.label}
                icon={service.icon}
                onClick={() => handleServiceClick(service)}
              />
            ))}
          </div>
        </main>
      </div>

      {/* Role Badge - Float above scroll */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-md border border-slate-100 flex items-center gap-2 text-xs font-medium text-slate-600 z-30">
        <div className={`w-2 h-2 rounded-full ${currentUser?.role === UserRole.TECHNICIAN ? 'bg-green-500' : 'bg-blue-500'}`}></div>
        Mode: {currentUser?.role}
      </div>
    </PageTransition>
  );

  const renderNotifications = () => {
    return (
      <PageTransition direction={direction} className="bg-slate-50 flex flex-col h-full">
        <div className="bg-white px-6 pt-12 pb-4 border-b border-slate-100 z-10 shrink-0 sticky top-0">
          <div className="flex items-center gap-4">
            <button
              onClick={popScreen}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-800 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center pb-20 opacity-50">
              <Bell size={48} className="text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div key={notif.id} className={`bg-white p-4 rounded-2xl border ${notif.read ? 'border-slate-100' : 'border-brand-yellow/30 bg-yellow-50/30'} shadow-sm flex items-start gap-4`}>
                <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 
                    ${notif.type === 'status' ? 'bg-blue-50 text-blue-600' :
                    notif.type === 'promo' ? 'bg-yellow-50 text-yellow-600' :
                      'bg-slate-100 text-slate-600'}`}>
                  {notif.type === 'status' ? <Zap size={20} /> : notif.type === 'promo' ? <Star size={20} /> : <Info size={20} />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-bold text-slate-900 text-sm ${!notif.read ? 'text-brand-dark' : ''}`}>{notif.title}</h3>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                      {new Date().getTime() - notif.date.getTime() < 60000 ? 'Just now' :
                        notif.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{notif.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </PageTransition>
    );
  };

  const renderAllServices = () => (
    <PageTransition direction={direction} className="bg-slate-50 flex flex-col h-full">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-4 border-b border-slate-100 z-10 shrink-0 sticky top-0">
        <div className="flex items-center gap-4">
          <button
            onClick={popScreen}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-800 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-slate-900">All Services</h2>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
        {SERVICES.map((service) => (
          <button
            key={service.id}
            onClick={() => handleServiceClick(service)}
            className="w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-brand-yellow/50 transition-all duration-200 text-left group"
          >
            <div className="w-14 h-14 bg-brand-light rounded-xl flex items-center justify-center text-brand-dark group-hover:bg-brand-yellow group-hover:text-brand-dark transition-colors shrink-0">
              <service.icon size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 text-lg">{service.label}</h3>
              <p className="text-sm text-slate-500 leading-snug line-clamp-2">{service.description}</p>
            </div>
            <div className="text-slate-300 group-hover:text-brand-yellow transition-colors">
              <ArrowRight size={20} />
            </div>
          </button>
        ))}
      </div>
    </PageTransition>
  );

  const renderServiceDetail = () => {
    if (!selectedService) return null;
    const Icon = selectedService.icon;

    return (
      <PageTransition direction={direction} className="bg-white">
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Detail Header */}
          <div className="relative bg-brand-light pb-8 rounded-b-[3rem] overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-64 bg-brand-dark/5 rounded-b-[3rem]"></div>
            <div className="relative px-6 pt-12">
              <div className="flex justify-between items-start mb-8">
                <button onClick={popScreen} className="p-2 -ml-2 rounded-full hover:bg-white text-slate-800 transition-colors">
                  <ChevronLeft size={28} />
                </button>
                <button className="p-2 rounded-full hover:bg-white text-slate-800 transition-colors">
                  <Star size={24} className="text-brand-yellow fill-brand-yellow" />
                </button>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center text-brand-dark mb-6">
                  <Icon size={48} strokeWidth={1.5} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 text-center">{selectedService.label}</h1>
                <p className="text-slate-500 mt-2 text-center max-w-xs">{selectedService.description}</p>
              </div>
            </div>
          </div>

          {/* Detail Body */}
          <div className="px-6 mt-8 space-y-8 pb-10">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-center flex-1 border-r border-slate-200">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Price</p>
                <p className="text-lg font-bold text-brand-dark mt-1 flex items-center justify-center gap-0.5">
                  <span className="text-xs text-slate-400">$</span>30<span className="text-xs text-slate-400">/hr</span>
                </p>
              </div>
              <div className="text-center flex-1">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Rating</p>
                <p className="text-lg font-bold text-brand-dark mt-1 flex items-center justify-center gap-1">
                  4.8 <Star size={14} className="fill-brand-yellow text-brand-yellow" />
                </p>
              </div>
            </div>

            {/* Top Technician Section */}
            <div>
              <h3 className="font-bold text-slate-900 mb-3">Top Professional</h3>
              <button
                onClick={handleTechnicianClick}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer text-left"
              >
                <div className="w-14 h-14 rounded-full bg-brand-dark text-white flex items-center justify-center text-lg font-bold shadow-md shadow-brand-dark/20 relative shrink-0">
                  MR
                  <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white">
                    <Check size={10} className="text-white" strokeWidth={4} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-slate-900 text-lg leading-tight truncate pr-2">Mike Reynolds</p>
                    <div className="bg-brand-yellow/10 text-brand-dark/80 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0">
                      Top Rated
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 mb-1.5">{selectedService.label} Specialist</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="fill-brand-yellow text-brand-yellow" />
                      <span className="text-sm font-bold text-slate-800">4.9</span>
                    </div>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-medium">128 Jobs Completed</span>
                  </div>
                </div>
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-900">About Service</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Professional {selectedService.label.toLowerCase()} services provided by verified experts.
                Includes inspection, basic repairs, and maintenance. Parts charged separately if required.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Action - Static Footer */}
        <div className="p-6 bg-white border-t border-slate-100">
          <Button fullWidth onClick={startBooking}>
            Book Service
          </Button>
        </div>
      </PageTransition>
    );
  };

  const renderTechnicianProfile = () => {
    if (!selectedTechnician) return null;

    return (
      <PageTransition direction={direction} className="bg-slate-50 flex flex-col h-full">
        {/* Header */}
        <div className="bg-white px-6 pt-12 pb-4 border-b border-slate-100 z-10 shrink-0 sticky top-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={popScreen}
                className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-800 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-xl font-bold text-slate-900">Technician Profile</h2>
            </div>
            {/* Show Edit button only if user is technician */}
            {currentUser?.role === UserRole.TECHNICIAN && (
              <button
                onClick={startEditProfile}
                className="p-2 rounded-full hover:bg-slate-100 text-brand-dark transition-colors flex items-center gap-2"
              >
                <span className="text-xs font-bold">Edit</span>
                <Edit size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
          {/* Hero Section */}
          <div className="bg-white pb-8 px-6 pt-6 mb-2">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-brand-dark text-white flex items-center justify-center text-3xl font-bold shadow-xl shadow-brand-dark/20 mb-4 border-4 border-white ring-2 ring-slate-100">
                  {selectedTechnician.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="absolute bottom-4 right-0 bg-green-500 rounded-full p-1.5 border-4 border-white">
                  <Check size={16} className="text-white" strokeWidth={3} />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-1">{selectedTechnician.name}</h2>
              <p className="text-slate-500 font-medium">{selectedTechnician.role}</p>

              <div className="flex items-center gap-2 mt-3 bg-brand-light px-3 py-1.5 rounded-full border border-slate-100">
                <MapPin size={14} className="text-brand-dark" />
                <span className="text-xs font-semibold text-slate-700">Springfield, IL</span>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-center gap-1 text-brand-dark font-bold text-lg">
                  {selectedTechnician.rating} <Star size={16} className="fill-brand-yellow text-brand-yellow" />
                </div>
                <p className="text-xs text-slate-500 mt-1">Rating</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-center gap-1 text-brand-dark font-bold text-lg">
                  {selectedTechnician.jobsCompleted}
                </div>
                <p className="text-xs text-slate-500 mt-1">Jobs</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-center gap-1 text-brand-dark font-bold text-lg">
                  {selectedTechnician.experience}
                </div>
                <p className="text-xs text-slate-500 mt-1">Experience</p>
              </div>
            </div>
          </div>

          <div className="px-6 space-y-6 mt-4">
            {/* About Section */}
            <section>
              <h3 className="font-bold text-slate-900 mb-3 text-lg">About Me</h3>
              <p className="text-slate-600 leading-relaxed text-sm bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                {selectedTechnician.about}
              </p>
            </section>

            {/* Portfolio Section */}
            <section>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-slate-900 text-lg">Portfolio</h3>
                <span className="text-xs font-semibold text-brand-dark bg-brand-light px-2 py-1 rounded-lg">
                  {selectedTechnician.portfolio.length} Projects
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {selectedTechnician.portfolio.map((img, idx) => (
                  <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-slate-200 relative group">
                    <img
                      src={img}
                      alt={`Project ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                  </div>
                ))}
              </div>
            </section>

            {/* Reviews Section */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900 text-lg">Reviews ({selectedTechnician.reviews.length})</h3>
                <button className="text-xs font-bold text-brand-dark hover:underline">View All</button>
              </div>
              <div className="space-y-3">
                {selectedTechnician.reviews.map((review) => (
                  <div key={review.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
                          {review.userName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{review.userName}</p>
                          <p className="text-[10px] text-slate-400">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                        <Star size={10} className="fill-brand-yellow text-brand-yellow" />
                        <span className="text-xs font-bold text-yellow-700">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-snug">{review.comment}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-6 bg-white border-t border-slate-100 z-10 shrink-0">
          <Button fullWidth onClick={startBooking}>
            Hire {selectedTechnician.name.split(' ')[0]}
          </Button>
        </div>
      </PageTransition>
    );
  };

  const renderEditProfile = () => (
    <PageTransition direction={direction} className="bg-slate-50 flex flex-col h-full">
      <div className="bg-white px-6 pt-12 pb-4 border-b border-slate-100 z-10 shrink-0 sticky top-0">
        <div className="flex items-center gap-4">
          <button
            onClick={popScreen}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-800 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-slate-900">Edit Profile</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar py-6 px-6">
        <form onSubmit={saveProfileChanges} className="space-y-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-brand-dark text-white flex items-center justify-center text-3xl font-bold shadow-lg">
                {editProfileData.name ? editProfileData.name.split(' ').map(n => n[0]).join('') : 'U'}
              </div>
              <button type="button" className="absolute bottom-0 right-0 bg-brand-yellow text-brand-dark p-2 rounded-full border-4 border-slate-50 shadow-sm">
                <Edit size={14} />
              </button>
            </div>
          </div>

          <Input
            label="Full Name"
            value={editProfileData.name}
            onChange={(e) => setEditProfileData({ ...editProfileData, name: e.target.value })}
            required
          />

          <Input
            label="Role / Title"
            placeholder="e.g. Senior Technician"
            value={editProfileData.role}
            onChange={(e) => setEditProfileData({ ...editProfileData, role: e.target.value })}
            required
          />

          <Input
            label="Experience"
            placeholder="e.g. 5 Years"
            value={editProfileData.experience}
            onChange={(e) => setEditProfileData({ ...editProfileData, experience: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">About Me</label>
            <textarea
              className="w-full bg-white border border-slate-200 rounded-xl p-4 h-40 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none resize-none"
              value={editProfileData.about}
              onChange={(e) => setEditProfileData({ ...editProfileData, about: e.target.value })}
              required
            ></textarea>
          </div>

          <div className="pt-4">
            <Button type="submit" fullWidth isLoading={isLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </PageTransition>
  );

  const renderPaymentMethods = () => (
    <PageTransition direction={direction} className="bg-slate-50 flex flex-col h-full" id="payment-methods-screen">
      <div className="bg-white px-6 pt-12 pb-4 border-b border-slate-100 z-10 shrink-0 sticky top-0">
        <div className="flex items-center gap-4">
          <button
            onClick={popScreen}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-800 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-slate-900">Payment Methods</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
        {paymentMethods.map((method) => (
          <div key={method.id} className="relative bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${method.type === 'cash' ? 'bg-green-50 text-green-600' : method.type === 'bank' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                {method.type === 'cash' ? <DollarSign size={24} /> : method.type === 'bank' ? <Landmark size={24} /> : <CreditCard size={24} />}
              </div>
              <div>
                <p className="font-bold text-slate-900">{method.label}</p>
                <p className="text-xs text-slate-500">
                  {method.type === 'card' ? `Expires ${method.expiry}` : method.type === 'bank' ? `Bank Account` : 'Default Method'}
                </p>
              </div>
            </div>
            {method.id !== 'cash' && (
              <button
                onClick={() => deletePaymentMethod(method.id)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        ))}

        <div className="flex gap-4">
          <button
            onClick={() => pushScreen(ScreenState.ADD_PAYMENT_METHOD)}
            className="flex-1 py-4 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500 font-semibold hover:border-brand-yellow hover:text-brand-dark hover:bg-brand-yellow/5 transition-all"
          >
            <CreditCard size={24} />
            <span className="text-sm">Add Card</span>
          </button>

          <button
            onClick={() => pushScreen(ScreenState.ADD_BANK_ACCOUNT)}
            className="flex-1 py-4 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500 font-semibold hover:border-brand-yellow hover:text-brand-dark hover:bg-brand-yellow/5 transition-all"
          >
            <Landmark size={24} />
            <span className="text-sm">Add Bank</span>
          </button>
        </div>
      </div>
    </PageTransition>
  );

  const renderAddPaymentMethod = () => (
    <PageTransition direction={direction} className="bg-slate-50 flex flex-col h-full">
      <div className="bg-white px-6 pt-12 pb-4 border-b border-slate-100 z-10 shrink-0 sticky top-0">
        <div className="flex items-center gap-4">
          <button
            onClick={popScreen}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-800 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-slate-900">Add Card</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl mb-8 aspect-video flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-10 h-6 bg-yellow-400/20 rounded flex overflow-hidden">
              <div className="w-1/2 h-full bg-yellow-400/50"></div>
            </div>
            <span className="font-mono text-lg italic font-bold opacity-80">VISA</span>
          </div>
          <div>
            <p className="font-mono text-xl tracking-widest mb-4">
              {cardFormData.number || '•••• •••• •••• ••••'}
            </p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Card Holder</p>
                <p className="font-medium tracking-wide uppercase">{cardFormData.name || 'YOUR NAME'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 text-right">Expires</p>
                <p className="font-medium tracking-wide">{cardFormData.expiry || 'MM/YY'}</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleAddPaymentMethod} className="space-y-5">
          <Input
            label="Card Number"
            placeholder="0000 0000 0000 0000"
            value={cardFormData.number}
            onChange={(e) => setCardFormData({ ...cardFormData, number: formatCardNumber(e.target.value) })}
            maxLength={19}
            leftIcon={<CreditCard size={18} />}
            error={formErrors.number}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Expiry Date"
              placeholder="MM/YY"
              value={cardFormData.expiry}
              onChange={(e) => setCardFormData({ ...cardFormData, expiry: formatExpiry(e.target.value) })}
              maxLength={5}
              error={formErrors.expiry}
              required
            />
            <Input
              label="CVC"
              placeholder="123"
              value={cardFormData.cvc}
              onChange={(e) => setCardFormData({ ...cardFormData, cvc: formatNumeric(e.target.value) })}
              maxLength={3}
              type="password"
              error={formErrors.cvc}
              required
            />
          </div>

          <Input
            label="Cardholder Name"
            placeholder="John Doe"
            value={cardFormData.name}
            onChange={(e) => setCardFormData({ ...cardFormData, name: e.target.value })}
            leftIcon={<UserIcon size={18} />}
            error={formErrors.name}
            required
          />

          <div className="pt-4">
            <Button type="submit" fullWidth isLoading={isLoading}>
              Save Card
            </Button>
          </div>
        </form>
      </div>
    </PageTransition>
  );

  const renderAddBankAccount = () => (
    <PageTransition direction={direction} className="bg-slate-50 flex flex-col h-full">
      <div className="bg-white px-6 pt-12 pb-4 border-b border-slate-100 z-10 shrink-0 sticky top-0">
        <div className="flex items-center gap-4">
          <button
            onClick={popScreen}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-800 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-slate-900">Add Bank Account</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl mb-8 flex flex-col justify-between h-48 relative overflow-hidden">
          {/* Bank decoration */}
          <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <Landmark size={32} className="mb-4 text-slate-300" />
            <p className="font-medium text-lg opacity-90">{bankFormData.bankName || 'Bank Name'}</p>
            <p className="text-sm text-slate-400 mt-1">{bankFormData.accountHolder || 'Account Holder'}</p>
          </div>
          <div className="relative z-10 font-mono tracking-widest text-xl">
            •••• •••• {bankFormData.accountNumber.slice(-4) || '0000'}
          </div>
        </div>

        <form onSubmit={handleAddBankAccount} className="space-y-5">
          <Input
            label="Bank Name"
            placeholder="e.g. Chase, Bank of America"
            value={bankFormData.bankName}
            onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
            leftIcon={<Landmark size={18} />}
            error={formErrors.bankName}
            required
          />
          <Input
            label="Account Holder Name"
            placeholder="e.g. John Doe"
            value={bankFormData.accountHolder}
            onChange={(e) => setBankFormData({ ...bankFormData, accountHolder: e.target.value })}
            leftIcon={<UserIcon size={18} />}
            error={formErrors.accountHolder}
            required
          />
          <Input
            label="Routing Number"
            placeholder="000000000"
            value={bankFormData.routingNumber}
            onChange={(e) => setBankFormData({ ...bankFormData, routingNumber: formatNumeric(e.target.value) })}
            type="text"
            inputMode="numeric"
            error={formErrors.routingNumber}
            required
          />
          <Input
            label="Account Number"
            placeholder="000000000000"
            value={bankFormData.accountNumber}
            onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: formatNumeric(e.target.value) })}
            type="password"
            inputMode="numeric"
            error={formErrors.accountNumber}
            required
          />
          <div className="pt-4">
            <Button type="submit" fullWidth isLoading={isLoading}>
              Save Bank Account
            </Button>
          </div>
        </form>
      </div>
    </PageTransition>
  );

  const renderRating = () => (
    <PageTransition direction={direction} className="bg-slate-50 flex flex-col h-full">
      <div className="bg-white px-6 pt-12 pb-4 border-b border-slate-100 z-10 shrink-0 sticky top-0">
        <div className="flex items-center gap-4">
          <button
            onClick={popScreen}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-800 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-slate-900">Rate Service</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-slate-200 mb-6 relative shadow-lg">
          <div className="absolute inset-0 flex items-center justify-center font-bold text-slate-500 text-2xl">
            {selectedTechnician?.name.split(' ').map(n => n[0]).join('') || 'T'}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 border-4 border-slate-50">
            <Check size={16} className="text-white" strokeWidth={3} />
          </div>
        </div>

        <h3 className="text-2xl font-bold text-slate-900 mb-1">{selectedTechnician?.name}</h3>
        <p className="text-slate-500 mb-8">{selectedTechnician?.role}</p>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 w-full mb-6">
          <p className="text-center font-bold text-slate-700 mb-6 text-lg">How was your experience?</p>
          <div className="flex justify-center gap-3 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRatingData({ ...ratingData, rating: star })}
                className="transition-transform active:scale-90 focus:outline-none"
              >
                <Star
                  size={40}
                  className={`transition-colors duration-200 ${ratingData.rating >= star ? 'fill-brand-yellow text-brand-yellow' : 'text-slate-200'}`}
                  strokeWidth={ratingData.rating >= star ? 0 : 1.5}
                />
              </button>
            ))}
          </div>
          <p className="text-center text-sm font-medium text-brand-yellow h-5">
            {ratingData.rating === 1 ? 'Poor' :
              ratingData.rating === 2 ? 'Fair' :
                ratingData.rating === 3 ? 'Good' :
                  ratingData.rating === 4 ? 'Very Good' :
                    ratingData.rating === 5 ? 'Excellent!' : ''}
          </p>
        </div>

        <div className="w-full">
          <label className="block text-sm font-bold text-slate-700 mb-2">Write a Review</label>
          <textarea
            className="w-full bg-white border border-slate-200 rounded-2xl p-4 h-32 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none resize-none shadow-sm"
            placeholder="Tell us what you liked..."
            value={ratingData.comment}
            onChange={(e) => setRatingData({ ...ratingData, comment: e.target.value })}
          ></textarea>
        </div>
      </div>

      <div className="p-6 bg-white border-t border-slate-100 z-10 shrink-0">
        <Button fullWidth onClick={submitRating} disabled={ratingData.rating === 0} isLoading={isLoading}>
          Submit Review
        </Button>
      </div>
    </PageTransition>
  );

  const renderChangePassword = () => (
    <PageTransition direction={direction} className="bg-slate-50 flex flex-col h-full">
      <div className="bg-white px-6 pt-12 pb-4 border-b border-slate-100 z-10 shrink-0 sticky top-0">
        <div className="flex items-center gap-4">
          <button
            onClick={popScreen}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-800 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-slate-900">Change Password</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        <form onSubmit={handleChangePasswordSubmit} className="space-y-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <Input
            label="Current Password"
            placeholder="••••••"
            type="password"
            leftIcon={<Lock size={18} />}
            value={changePassData.currentPass}
            onChange={(e) => setChangePassData({ ...changePassData, currentPass: e.target.value })}
            error={formErrors.currentPass}
            required
          />

          <div className="border-t border-slate-100 my-2"></div>

          <Input
            label="New Password"
            placeholder="••••••"
            type="password"
            leftIcon={<KeyRound size={18} />}
            value={changePassData.newPass}
            onChange={(e) => setChangePassData({ ...changePassData, newPass: e.target.value })}
            error={formErrors.newPass}
            required
          />

          <Input
            label="Confirm New Password"
            placeholder="••••••"
            type="password"
            leftIcon={<CheckCircle2 size={18} />}
            value={changePassData.confirmPass}
            onChange={(e) => setChangePassData({ ...changePassData, confirmPass: e.target.value })}
            error={formErrors.confirmPass}
            required
          />

          <div className="pt-4">
            <Button type="submit" fullWidth isLoading={isLoading}>
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </PageTransition>
  );

  const renderBooking = () => {
    if (bookingComplete) {
      return (
        <div className="w-full h-full bg-brand-dark flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-green-500/30 animate-[scale-in_0.5s_ease-out]">
            <Check size={48} className="text-white" strokeWidth={4} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Booking Confirmed!</h2>
          <p className="text-slate-400 max-w-xs mb-8">
            Your request has been sent successfully.
          </p>
          {/* Technician Detail Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 w-full max-w-xs border border-white/10 shadow-xl">
            <div className="flex items-center gap-4 mb-4 border-b border-white/10 pb-4">
              <div className="w-12 h-12 bg-brand-yellow rounded-full flex items-center justify-center text-brand-dark font-bold text-xl">
                M
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Technician</p>
                <p className="text-white font-bold text-lg">Mike Reynolds</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star size={12} className="text-brand-yellow fill-brand-yellow" />
                  <span className="text-xs text-slate-300">4.9 (124 reviews)</span>
                </div>
              </div>
            </div>
            <div className="text-left">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Estimated Arrival</p>
              <div className="flex items-end gap-2">
                <p className="text-white font-bold text-2xl leading-none">
                  {bookingData.time}
                </p>
                <p className="text-slate-400 text-sm mb-0.5">
                  {bookingData.date?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
          <p className="mt-8 text-slate-500 text-sm animate-pulse">Redirecting to dashboard...</p>
        </div>
      );
    }

    const nextDays = getNextDays(14);
    const selectedPaymentMethod = paymentMethods.find(pm => pm.id === selectedPaymentMethodId) || paymentMethods[0];

    return (
      <PageTransition direction={direction} className="bg-slate-50 flex flex-col h-full">
        {/* Header */}
        <div className="bg-white px-6 pt-12 pb-4 border-b border-slate-100 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (bookingStep > 0) setBookingStep(bookingStep - 1);
                else popScreen();
              }}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-800 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900 leading-none">
                {bookingStep === 0 ? 'Select Date & Time' : bookingStep === 1 ? 'Details' : 'Review'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">Step {bookingStep + 1} of 3</p>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="flex gap-2 mt-4">
            {[0, 1, 2].map(step => (
              <div
                key={step}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step <= bookingStep ? 'bg-brand-yellow' : 'bg-slate-200'}`}
              ></div>
            ))}
          </div>
        </div>

        {/* Sliding Scrollable Content */}
        <div className="flex-1 overflow-hidden relative">
          <div
            className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{ transform: `translateX(-${bookingStep * 100}%)` }}
          >
            {/* STEP 0: DATE & TIME */}
            <div className="w-full flex-shrink-0 h-full overflow-y-auto p-6 no-scrollbar">
              <div className="space-y-8 pb-6">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Calendar size={18} /> Select Date
                  </label>
                  <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
                    {nextDays.map((dateItem, idx) => {
                      const isSelected = bookingData.date?.getDate() === dateItem.dayNumber;
                      return (
                        <button
                          key={idx}
                          onClick={() => setBookingData({ ...bookingData, date: dateItem.fullDate })}
                          className={`
                              flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center border transition-all duration-200
                              ${isSelected
                              ? 'bg-brand-dark border-brand-dark text-white shadow-lg shadow-brand-dark/20 scale-105'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-brand-yellow'}
                            `}
                        >
                          <span className="text-xs font-medium opacity-60">{dateItem.dayName}</span>
                          <span className="text-xl font-bold">{dateItem.dayNumber}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Clock size={18} /> Select Time
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {TIME_SLOTS.map((time, idx) => (
                      <button
                        key={idx}
                        onClick={() => setBookingData({ ...bookingData, time: time })}
                        className={`
                            py-3 px-2 rounded-xl text-xs font-bold border transition-all duration-200
                            ${bookingData.time === time
                            ? 'bg-brand-yellow border-brand-yellow text-brand-dark shadow-md'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}
                          `}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 1: DETAILS */}
            <div className="w-full flex-shrink-0 h-full overflow-y-auto p-6 no-scrollbar">
              <div className="space-y-6 pb-6">
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText size={18} /> Description
                  </label>
                  <textarea
                    placeholder="Describe the issue briefly (e.g., Leaking tap in kitchen)..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-4 h-32 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none resize-none"
                    value={bookingData.description}
                    onChange={(e) => setBookingData({ ...bookingData, description: e.target.value })}
                  ></textarea>
                </div>

                <Input
                  label="Service Address"
                  leftIcon={<MapPin size={18} />}
                  value={bookingData.address}
                  onChange={(e) => setBookingData({ ...bookingData, address: e.target.value })}
                />

                <div className="bg-blue-50 p-4 rounded-xl flex gap-3 text-sm text-blue-800 border border-blue-100">
                  <div className="mt-0.5"><CheckCircle2 size={16} /></div>
                  <p>Technician will bring basic tools. Replacement parts will be charged extra.</p>
                </div>
              </div>
            </div>

            {/* STEP 2: REVIEW */}
            <div className="w-full flex-shrink-0 h-full overflow-y-auto p-6 no-scrollbar">
              <div className="space-y-6 pb-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-50">
                    <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center text-brand-dark">
                      {selectedService?.icon && <selectedService.icon size={24} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{selectedService?.label}</h3>
                      <p className="text-xs text-slate-500">Standard Service</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date</span>
                      <span className="font-medium text-slate-900">
                        {bookingData.date?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Time</span>
                      <span className="font-medium text-slate-900">{bookingData.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Location</span>
                      <span className="font-medium text-slate-900 text-right max-w-[150px] truncate">{bookingData.address}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm">Payment Method</h3>
                  <div className="space-y-2">
                    {paymentMethods.map(pm => (
                      <button
                        key={pm.id}
                        onClick={() => setSelectedPaymentMethodId(pm.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedPaymentMethodId === pm.id
                          ? 'border-brand-yellow bg-brand-yellow/5'
                          : 'border-slate-100 hover:border-slate-300'
                          }`}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedPaymentMethodId === pm.id ? 'border-brand-yellow bg-brand-yellow' : 'border-slate-300'}`}>
                          {selectedPaymentMethodId === pm.id && <div className="w-2 h-2 bg-brand-dark rounded-full"></div>}
                        </div>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${pm.type === 'cash' ? 'bg-green-50 text-green-600' : pm.type === 'bank' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                          {pm.type === 'cash' ? <DollarSign size={16} /> : pm.type === 'bank' ? <Landmark size={16} /> : <CreditCard size={16} />}
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-sm font-semibold text-slate-900">{pm.label}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Estimated Rate</span>
                    <span className="font-medium text-slate-900">$30.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Booking Fee</span>
                    <span className="font-medium text-slate-900">$2.00</span>
                  </div>
                  <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-lg text-slate-900">
                    <span>Total</span>
                    <span>$32.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white p-6 border-t border-slate-100 z-10 shrink-0">
          {bookingStep === 0 && (
            <Button fullWidth onClick={() => setBookingStep(1)} disabled={!bookingData.time}>
              Next Step
            </Button>
          )}
          {bookingStep === 1 && (
            <Button fullWidth onClick={() => setBookingStep(2)} disabled={!bookingData.address || !bookingData.description}>
              Review Booking
            </Button>
          )}
          {bookingStep === 2 && (
            <Button fullWidth onClick={confirmBooking} isLoading={isLoading}>
              Confirm Payment & Book
            </Button>
          )}
        </div>
      </PageTransition>
    );
  };

  const renderMyBookings = () => {
    const filteredBookings = userBookings.filter(booking => {
      if (activeBookingTab === 'upcoming') {
        return booking.status === BookingStatus.UPCOMING;
      } else {
        return booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED;
      }
    });

    return (
      <PageTransition direction={direction} className="bg-slate-50 flex flex-col h-full relative">
        <div className="bg-white px-6 pt-12 pb-4 border-b border-slate-100 z-10 shrink-0">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={popScreen}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-800 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-xl font-bold text-slate-900">My Bookings</h2>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveBookingTab('upcoming')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeBookingTab === 'upcoming' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveBookingTab('past')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeBookingTab === 'past' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              History
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center pb-20 opacity-50">
              <Calendar size={48} className="text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">No bookings found</p>
            </div>
          ) : (
            filteredBookings.map((booking) => {
              const service = SERVICES.find(s => s.id === booking.serviceId);
              const ServiceIcon = service?.icon || Wrench;

              return (
                <div key={booking.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col gap-4 active:scale-[0.99] transition-transform">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-light rounded-full flex items-center justify-center text-brand-dark">
                        <ServiceIcon size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 leading-tight">{service?.label || 'Service'}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{booking.id}</p>
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${booking.status === BookingStatus.UPCOMING ? 'bg-blue-50 text-blue-600' :
                      booking.status === BookingStatus.COMPLETED ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                      {booking.status}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Calendar size={14} className="text-slate-400" />
                      <span className="font-semibold">{booking.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="w-px h-4 bg-slate-300"></div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock size={14} className="text-slate-400" />
                      <span className="font-semibold">{booking.time}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
                        <UserIcon size={12} className="text-slate-500" />
                      </div>
                      <span className="text-xs font-medium text-slate-600">{booking.technicianName || 'Assigning...'}</span>
                    </div>
                    <span className="font-bold text-slate-900">${booking.price}</span>
                  </div>

                  {booking.status === BookingStatus.UPCOMING && (
                    <div className="grid grid-cols-2 gap-3 mt-1">
                      <Button
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          startTracking(booking);
                        }}
                        className="text-sm py-2.5"
                      >
                        <Navigation size={16} /> Track
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCancelBookingId(booking.id);
                        }}
                        className="bg-red-50 text-red-600 hover:bg-red-100 text-sm py-2.5"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {booking.status === BookingStatus.COMPLETED && (
                    <div className="mt-1">
                      {booking.rating ? (
                        <div className="bg-yellow-50 text-yellow-800 p-3 rounded-xl flex items-center justify-between">
                          <span className="text-sm font-semibold">You rated this service:</span>
                          <div className="flex items-center gap-1 font-bold">
                            {booking.rating} <Star size={16} className="fill-brand-yellow text-brand-yellow" />
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          fullWidth
                          className="bg-brand-dark text-white hover:bg-slate-800 shadow-md py-2.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            openRating(booking);
                          }}
                        >
                          <Star size={16} className="text-brand-yellow fill-brand-yellow" /> Rate Service
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Cancel Confirmation Modal */}
        {cancelBookingId && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-500 mb-2">
                <AlertCircle size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Cancel Booking?</h3>
                <p className="text-slate-500 text-sm mt-2">
                  Are you sure you want to cancel this booking? This action cannot be undone.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button variant="ghost" onClick={() => setCancelBookingId(null)}>
                  Keep it
                </Button>
                <Button
                  className="bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-200"
                  onClick={handleCancelBooking}
                >
                  Yes, Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </PageTransition>
    );
  };

  const renderTracking = () => {
    // Determine technician position based on simulated progress
    // Start from top-left (10,10) to center (50,50)
    const startX = 10;
    const startY = 10;
    const endX = 50;
    const endY = 50;

    const currentX = startX + (endX - startX) * (trackingProgress / 100);
    const currentY = startY + (endY - startY) * (trackingProgress / 100);

    return (
      <PageTransition direction={direction} className="bg-slate-50 flex flex-col h-full relative">
        {/* Map Layer (Simulated) */}
        <div className="absolute inset-0 bg-[#e5e7eb] z-0 overflow-hidden">
          {/* Grid Pattern to simulate blocks */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'linear-gradient(#9ca3af 1px, transparent 1px), linear-gradient(90deg, #9ca3af 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
          </div>

          {/* Roads (Simulated SVG) */}
          <svg className="absolute inset-0 w-full h-full text-white pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <path d="M-100 100 L500 400" stroke="currentColor" strokeWidth="20" fill="none" />
            <path d="M100 -100 L200 800" stroke="currentColor" strokeWidth="20" fill="none" />
            <path d="M-50 300 L600 200" stroke="currentColor" strokeWidth="15" fill="none" />
          </svg>

          {/* Destination Marker (Home) - Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
            <div className="w-10 h-10 bg-brand-dark rounded-full flex items-center justify-center border-4 border-white shadow-lg animate-bounce">
              <Home size={18} className="text-white" />
            </div>
          </div>

          {/* Technician Marker (Moving) */}
          <div
            className="absolute z-20 flex flex-col items-center transition-all duration-75 ease-linear"
            style={{ top: `${currentY}%`, left: `${currentX}%`, transform: 'translate(-50%, -100%)' }}
          >
            <div className="bg-white px-2 py-1 rounded-lg shadow-md mb-1 whitespace-nowrap">
              <p className="text-[10px] font-bold text-slate-800">15 min</p>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-white shadow-xl overflow-hidden relative bg-brand-yellow">
              <div className="absolute inset-0 flex items-center justify-center font-bold text-brand-dark">MR</div>
              {/* Simulate pulsing ring */}
              <div className="absolute inset-0 rounded-full animate-ping bg-brand-yellow opacity-75"></div>
            </div>
          </div>
        </div>

        {/* Overlay Controls */}
        <div className="relative z-30 p-6 pt-12 flex justify-between items-start pointer-events-none">
          <button
            onClick={popScreen}
            className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-800 pointer-events-auto active:scale-95 transition-transform"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-md text-xs font-bold text-slate-800 border border-white/50">
            <span className="w-2 h-2 bg-green-500 rounded-full inline-block mr-1.5 animate-pulse"></span>
            Live Tracking
          </div>
        </div>

        {/* Bottom Sheet Info Card */}
        <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-30 p-6 animate-enter-forward">
          {/* Handle Bar */}
          <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6"></div>

          {/* Status Timeline */}
          <div className="flex items-center justify-between mb-8 px-2 relative">
            {/* Progress Line */}
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-100 -z-10"></div>
            <div className="absolute top-1/2 left-4 h-0.5 bg-brand-yellow -z-10 transition-all duration-1000" style={{ width: '60%' }}></div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand-yellow flex items-center justify-center text-brand-dark shadow-sm">
                <Check size={12} strokeWidth={3} />
              </div>
              <span className="text-[10px] font-bold text-slate-800">Confirmed</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand-yellow flex items-center justify-center text-brand-dark shadow-sm ring-4 ring-yellow-50">
                <div className="w-2 h-2 bg-brand-dark rounded-full animate-pulse"></div>
              </div>
              <span className="text-[10px] font-bold text-slate-800">On the way</span>
            </div>
            <div className="flex flex-col items-center gap-2 opacity-50">
              <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
              </div>
              <span className="text-[10px] font-bold text-slate-500">Working</span>
            </div>
            <div className="flex flex-col items-center gap-2 opacity-50">
              <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
              </div>
              <span className="text-[10px] font-bold text-slate-500">Done</span>
            </div>
          </div>

          {/* Technician Info */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-slate-200 relative">
              {/* Avatar Placeholder */}
              <div className="absolute inset-0 flex items-center justify-center font-bold text-slate-500 text-lg">MR</div>
              <div className="absolute -bottom-1 -right-1 bg-brand-dark text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white flex items-center gap-0.5">
                <Star size={8} className="fill-brand-yellow text-brand-yellow" /> 4.9
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 text-lg">Mike Reynolds</h3>
              <p className="text-sm text-slate-500">{trackingBooking?.id ? `Order #${trackingBooking.id}` : 'Plumbing Service'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">Est. Arrival</p>
              <p className="text-xl font-bold text-brand-dark">10:45 AM</p>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button variant="secondary" className="bg-slate-100 text-slate-900 hover:bg-slate-200 border-0 shadow-none">
              <MessageSquare size={18} /> Message
            </Button>
            <Button>
              <PhoneCall size={18} /> Call Now
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  };

  const renderSettings = () => (
    <PageTransition direction={direction} className="bg-slate-50 flex flex-col h-full">
      <div className="bg-white px-6 pt-12 pb-4 border-b border-slate-100 z-10 shrink-0 sticky top-0">
        <div className="flex items-center gap-4">
          <button
            onClick={popScreen}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-800 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-slate-900">Settings</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        {/* Notification Preferences */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Notifications</h3>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Push */}
            <div className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Bell size={20} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Push Notifications</p>
                  <p className="text-xs text-slate-500">Receive alerts on your device</p>
                </div>
              </div>
              <button
                onClick={() => toggleNotification('push')}
                className={`w-12 h-7 rounded-full transition-colors duration-200 relative ${notificationPrefs.push ? 'bg-brand-yellow' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${notificationPrefs.push ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Email Updates</p>
                  <p className="text-xs text-slate-500">Booking confirmations & offers</p>
                </div>
              </div>
              <button
                onClick={() => toggleNotification('email')}
                className={`w-12 h-7 rounded-full transition-colors duration-200 relative ${notificationPrefs.email ? 'bg-brand-yellow' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${notificationPrefs.email ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
            </div>

            {/* SMS */}
            <div className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">SMS Alerts</p>
                  <p className="text-xs text-slate-500">Important updates via text</p>
                </div>
              </div>
              <button
                onClick={() => toggleNotification('sms')}
                className={`w-12 h-7 rounded-full transition-colors duration-200 relative ${notificationPrefs.sms ? 'bg-brand-yellow' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${notificationPrefs.sms ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* Account & Security */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Security</h3>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button
              onClick={() => pushScreen(ScreenState.CHANGE_PASSWORD)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Lock size={20} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Change Password</p>
                  <p className="text-xs text-slate-500">Update your security credentials</p>
                </div>
              </div>
              <ChevronLeft size={16} className="rotate-180 text-slate-400" />
            </button>
          </div>
        </div>

        {/* About */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">About</h3>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Info size={20} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Version</p>
                  <p className="text-xs text-slate-500">v1.0.2</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );

  const renderHelpSupport = () => (
    <PageTransition direction={direction} className="bg-slate-50 flex flex-col h-full">
      <div className="bg-white px-6 pt-12 pb-4 border-b border-slate-100 z-10 shrink-0 sticky top-0">
        <div className="flex items-center gap-4">
          <button
            onClick={popScreen}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-800 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-slate-900">Help & Support</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        {/* Contact Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Contact Us</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:border-brand-yellow/50 transition-colors">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <Phone size={20} />
              </div>
              <span className="font-semibold text-slate-900 text-sm">Call Us</span>
            </button>
            <button className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:border-brand-yellow/50 transition-colors">
              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center">
                <Mail size={20} />
              </div>
              <span className="font-semibold text-slate-900 text-sm">Email Us</span>
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Frequently Asked Questions</h3>
          <div className="space-y-3">
            {[
              { q: "How do I book a service?", a: "Select a service from the dashboard, choose a date and time, and confirm your booking details." },
              { q: "Can I cancel my booking?", a: "Yes, you can cancel your booking from the 'My Bookings' section up to 2 hours before the scheduled time." },
              { q: "What payment methods are accepted?", a: "We accept cash, credit cards, and digital wallets upon completion of service." },
              { q: "How are technicians verified?", a: "All our technicians undergo a strict background check and skills assessment process." }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="font-semibold text-slate-900 text-sm mb-2">{item.q}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );

  // --- Main Switch ---

  return (
    <div className="antialiased text-slate-900 font-sans max-w-lg mx-auto bg-slate-50 h-[100dvh] relative shadow-2xl overflow-hidden flex flex-col">
      {/* Sidebar Overlay - Rendered globally but visible only when open */}
      {renderSidebar()}

      {/* We render based on currentScreen but logic for history is handled above */}
      {currentScreen === ScreenState.LOGIN && renderLogin()}
      {currentScreen === ScreenState.SIGNUP && renderSignup()}
      {currentScreen === ScreenState.FORGOT_PASSWORD && renderForgotPassword()}
      {currentScreen === ScreenState.RESET_PASSWORD && renderResetPassword()}
      {currentScreen === ScreenState.TECH_PROMPT && renderTechnicianPrompt()}
      {currentScreen === ScreenState.TECHNICIAN_ONBOARDING && renderTechnicianOnboarding()}
      {currentScreen === ScreenState.DASHBOARD && renderDashboard()}
      {currentScreen === ScreenState.ALL_SERVICES && renderAllServices()}
      {currentScreen === ScreenState.SERVICE_DETAIL && renderServiceDetail()}
      {currentScreen === ScreenState.BOOKING && renderBooking()}
      {currentScreen === ScreenState.MY_BOOKINGS && renderMyBookings()}
      {currentScreen === ScreenState.TRACKING && renderTracking()}
      {currentScreen === ScreenState.RATING && renderRating()}
      {currentScreen === ScreenState.SETTINGS && renderSettings()}
      {currentScreen === ScreenState.HELP_SUPPORT && renderHelpSupport()}
      {currentScreen === ScreenState.TECHNICIAN_PROFILE && renderTechnicianProfile()}
      {currentScreen === ScreenState.EDIT_PROFILE && renderEditProfile()}
      {currentScreen === ScreenState.PAYMENT_METHODS && renderPaymentMethods()}
      {currentScreen === ScreenState.ADD_PAYMENT_METHOD && renderAddPaymentMethod()}
      {currentScreen === ScreenState.ADD_BANK_ACCOUNT && renderAddBankAccount()}
      {currentScreen === ScreenState.CHANGE_PASSWORD && renderChangePassword()}
      {currentScreen === ScreenState.NOTIFICATIONS && renderNotifications()}
    </div>
  );
};

export default App;