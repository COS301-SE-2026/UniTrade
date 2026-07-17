export type MeetupStatus = 'pending' | 'accepted' | 'declined';

export type CheckInState = 'requesting' | 'success' | 'denied' | 'unsupported' | 'error';

export interface MeetupProposalPayload {
    LocationName: string;
    ProposedTime: string;
    Lat: number;
    Lng: number;
    //status: MeetupStatus;
    //proposedByUserId?: string;
}

export interface MeetupFormValues {
    date: string;
    time:string;
    location: {
        name: string;
        lat: number;
        lng: number;
    };
}

export function combineDateAndTime(date: string, time: string): string{
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    const dt = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    return dt.toISOString(); 
}

export const PRESET_MEETUP_LOCATIONS: readonly string[] = [
    'Meerensky Library - Main Entrance',
    'Lucky Bread - Piazza',
    'Law Library - Thuto Entrance',
    'IT Building',

] as const;