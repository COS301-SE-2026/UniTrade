import {useState} from 'react';
import { IconCalendar, IconClock, IconMapPin, IconX } from '@tabler/icons-react';
import { PRESET_MEETUP_LOCATIONS, type MeetupFormValues } from '../../types/meetup';


interface MeetupProposalFormProps {
    onCancel : () => void;
    onSubmit: (values: MeetupFormValues) => void;
    isSubmitting?: boolean;
}


function todayISODate (): string {
    return new Date().toISOString().split('T')[0];
}

export default function MeetupProposalForm({onCancel, onSubmit, isSubmitting} : MeetupProposalFormProps) {
    const [date, setDate] = useState(todayISODate());
    const [time, setTime] = useState('12:00');
    const [location, setLocation] = useState<string>(PRESET_MEETUP_LOCATIONS[0]);

    const canSubmit = !!date && !!time && !!location;

    const handleSubmit = () => {
        if(!canSubmit) return;
        onSubmit({date, time, location});
    };

    return (
        <div 
        className = "fixed inset-0 z-50 flex items-end justify-center bg-black/40"
        onClick = {onCancel}
        >
            <div 
            className = "w-full max-w-md bg-white rounded-t-3xl p-5 pb-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            >
                <div className = "flex items-center justify-between mb-5">
                    <h2 className = "text-lg font-bold text-gray-900">
                        Propose a Meetup
                    </h2>
                    <button type = "button" onClick={onCancel} className = "text-gray-400 p-1" aria-label="Close">
                        <IconX size = {20} />
                    </button>
                </div>

                <label className = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Date
                </label>
                <div className = "relative mb-4">
                    <IconCalendar size={18} className = "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                    type = "date"
                    value={date}
                    min = {todayISODate()}
                    onChange={(e) => setDate(e.target.value)}
                    className = "w-full bg-gray-100 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                    />
                </div>

                <label className = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Time
                </label>
                <div className="relative mb-4">
                    <IconClock size ={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                    type = "time"
                    value = {time}
                    onChange = {(e) => setTime(e.target.value)}
                    className="w-full bg-gray-100 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                    />
                </div>

                <label className = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Meetup Location
                </label>
                <div className = "flex flex-col gap-2 mb-6">
                    {PRESET_MEETUP_LOCATIONS.map((preset) => {
                        const selected = preset === location;
                        return (
                            <button 
                            key = {preset}
                            type = "button"
                            onClick = {() => setLocation(preset)}
                            className = {`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-left border transition-colors ${
                                selected
                                ? 'bg-[#003366] text-white border-[#003366]'
                                : 'bg-gray-50 text-gray-700 border-transparent hover:bg-gray-100'
                            }`}
                            >
                                <IconMapPin size = {16} className = {selected? 'text-white' : 'text-gray-400'} />
                                {preset}
                            </button>
                        );
                    })}
                </div>

                <button
                type = "button"
                disabled = {!canSubmit || isSubmitting}
                onClick = {handleSubmit}
                className="w-full py-3 bg-[#003366] text-white font-bold text-sm tracking-widest rounded-2xl hover:bg-[#002244] transition-colors disabled:opacity-50"
                >
                    {isSubmitting ? 'SENDING...' : 'SEND PROPOSAL'}
                </button>
            </div>
        </div>
    );
} 