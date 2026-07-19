import { useEffect, useState } from 'react'
import { connectionManager } from '../services/realtime/connectionManager'

export function useOnlineStatus(): boolean {
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            connectionManager.connect().catch(() => { });
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}