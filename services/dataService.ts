import { supabase } from '../lib/supabaseClient';
import { Booking, BookingStatus, Technician } from '../types';

export const fetchUserBookings = async (userId: string): Promise<Booking[]> => {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
      *,
      service:services(label),
      technician:technician_profiles(id)
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
        technicianName: 'Assigned Tech', // You might need to join profiles to get name
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
        technicianName: 'Pending Assignment'
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
