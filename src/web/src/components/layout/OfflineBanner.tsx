import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { IconWifiOff } from "@tabler/icons-react";

export default function OfflineBanner() {
    const isOnline = useOnlineStatus();

    if(isOnline) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100000] bg-rose-600 text-white text-sm font-semibold py-2 px-4 flex items-center gap-2 shadow-md">
            <IconWifiOff size={16} />
            There is no internet connection, Please turn on your data or connect to wifi to continue!
        </div>
    );
}