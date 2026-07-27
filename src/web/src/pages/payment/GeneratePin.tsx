import { useLocation, useNavigate } from 'react-router';

export default function GeneratePin() {
    const navigate = useNavigate();
    const location = useLocation();
    const pin = (location.state as { pin?: string })?.pin ?? '';
    const pinDigits = pin.padEnd(6, ' ').split('');

    const handleDone = () => {
        navigate('/buyer/reservations');
    };

    if (!pin) {
        return (
            <div className="min-h-screen flex items-center justify-center text-slate-500">
                No PIN available. Please complete payment first.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f1f1f1] flex flex-col justify-center items-center font-sans p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-100 p-12 md:p-16 flex flex-col items-center space-y-10">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 tracking-tight">
                        Transaction PIN
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">
                        Present this pin to the seller upon transaction completion.
                    </p>
                </div>

                <div className="flex justify-center gap-3 md:gap-4">
                    {pinDigits.map((digit, index) => (
                        <div
                            key={index}
                            className="w-12 h-16 flex items-center justify-center text-center text-2xl font-bold rounded-2xl border-2 border-[#00aaff]/60 transition-all duration-150"
                        >
                            {digit.trim()}
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleDone}
                    className="w-full max-w-xs py-4 bg-[#0d2a5c] hover:bg-[#081e42] active:scale-[0.99] text-white font-bold text-lg tracking-wide rounded-full shadow-md transition-all cursor-pointer"
                >
                    Done
                </button>
            </div>
        </div>
    );
}