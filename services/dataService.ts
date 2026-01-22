import { supabase } from '../lib/supabaseClient';
import { Booking, BookingStatus, Technician } from '../types';


export const fetchServices = async (): Promise<any[]> => {
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('id');

    if (error) {
        console.error('Error fetching services:', error);
        return [];
    }
    return data;
};

export const fetchTechnicianProfile = async (userId: string): Promise<Technician | null> => {
    const { data, error } = await supabase
        .from('technician_profiles')
        .select(`
            *,
            profile:profiles(name, role)
        `)
        .eq('id', userId)
        .single();

    if (error) return null;

    return {
        id: data.id,
        name: data.profile?.name || 'Technician',
        role: data.profile?.role || 'TECHNICIAN',
        rating: data.rating,
        reviewCount: data.review_count,
        jobsCompleted: data.jobs_completed,
        experience: data.experience,
        about: data.about,
        reviews: [], // Fetching separate reviews table if needed
        portfolio: data.portfolio || []
    };
};

export const createTechnicianProfile = async (profileData: any, userId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('technician_profiles')
        .upsert({
            id: userId,
            experience: profileData.experience,
            about: profileData.bio,
            // hourly_rate: profileData.hourlyRate // Add column to schema if needed
        });

    if (error) {
        console.error('Error creating technician profile:', error);
        return false;
    }
    return true;
};

export const fetchUserBookings = async (userId: string): Promise<Booking[]> => {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
      *,
      service:services(label),
      technician:profiles!bookings_technician_id_fkey(name)
    `)
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching bookings:', error);
        throw error;
    }

    return data.map((b: any) => ({
        id: b.id,
        serviceId: b.service_id,
        date: new Date(b.date),
        time: b.time,
        status: b.status as BookingStatus,
        technicianName: b.technician?.name || 'Pending',
        address: b.address,
        description: b.description,
        price: b.price,
        rating: b.rating,
        review: b.review
    }));
};

export const createBooking = async (
    booking: {
        serviceId: string;
        date: Date;
        time: string;
        address: string;
        description: string;
        price: number;
    },
    userId: string
): Promise<Booking | null> => {
    const { data, error } = await supabase
        .from('bookings')
        .insert([
            {
                user_id: userId,
                service_id: booking.serviceId,
                date: booking.date.toISOString(),
                time: booking.time,
                address: booking.address,
                description: booking.description,
                price: booking.price,
                status: BookingStatus.UPCOMING
            }
        ])
        .select()
        .single();

    if (error) {
        console.error('Error creating booking:', error);
        return null;
    }

    return {
        ...data,
        serviceId: data.service_id,
        date: new Date(data.date),
        technicianName: 'Pending Assignment' // Backend logic would assign this
    } as Booking;
};

export const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

    if (error) console.error('Error updating booking:', error);
    return !error;
};

export const submitBookingReview = async (bookingId: string, rating: number, comment: string) => {
    const { error } = await supabase
        .from('bookings')
        .update({
            rating: rating,
            review: comment,
            status: BookingStatus.COMPLETED
        })
        .eq('id', bookingId);

    if (error) {
        console.error('Error submitting review:', error);
        return false;
    }
    return true;
};

