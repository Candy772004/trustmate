import { supabase } from '../lib/supabaseClient';
import { AuthResponse, User, UserRole } from '../types';

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    if (data.user) {
      // Fetch user profile from 'profiles' table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || data.user.user_metadata?.name || 'User',
        mobile: profile?.mobile || '',
        role: profile?.role || UserRole.CUSTOMER,
        address: profile?.address || ''
      };

      return { success: true, user };
    }

    return { success: false, message: 'Login failed due to unknown error.' };
  } catch (error: any) {
    return { success: false, message: error.message || 'An unexpected error occurred.' };
  }
};

export const registerUser = async (data: any): Promise<AuthResponse> => {
  try {
    // 1. Sign up with Supabase Auth
    // We pass all profile data as metadata so the Database Trigger can populate the profiles table
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password || '123456',
      options: {
        data: {
          name: data.name,
          mobile: data.mobile,
          address: data.address,
          role: UserRole.CUSTOMER
        }
      }
    });

    if (authError) return { success: false, message: authError.message };

    if (authData.user) {
      // Profile creation is now handled by the Postgres Trigger 'handle_new_user'
      const user: User = {
        id: authData.user.id,
        name: data.name,
        mobile: data.mobile,
        role: UserRole.CUSTOMER,
        email: data.email,
        address: data.address
      };

      return { success: true, user };
    }

    return { success: false, message: 'Registration failed.' };
  } catch (error: any) {
    console.error('Signup error:', error);
    let message = error.message || 'An unexpected error occurred.';
    if (message.includes('Failed to fetch')) {
      message = 'Unable to connect to the server. Please check your internet connection and ensure your Supabase URL and Key are correctly configured in .env.local.';
    }
    return { success: false, message };
  }
};

export const sendOtp = async (mobile: string): Promise<AuthResponse> => {
  // TODO: Implement Supabase OTP if needed 
  return new Promise((resolve) => {
    setTimeout(() => {
      if (mobile.length >= 10) {
        resolve({ success: true, message: 'OTP sent successfully (Simulated).' });
      } else {
        resolve({ success: false, message: 'Invalid mobile number.' });
      }
    }, 1000);
  });
};

export const resetUserPassword = async (mobile: string, otp: string, newPass: string): Promise<AuthResponse> => {
  // TODO: Implement actual Supabase password reset
  return new Promise((resolve) => {
    setTimeout(() => {
      if (otp === '1234') {
        resolve({ success: true, message: 'Password updated successfully (Simulated).' });
      } else {
        resolve({ success: false, message: 'Invalid OTP.' });
      }
    }, 1000);
  });
};

export const sendBookingConfirmationEmail = async (email: string, bookingDetails: any): Promise<boolean> => {
  console.log(`[Supabase Mock Email] Sending booking confirmation to ${email}`);
  return true;
};