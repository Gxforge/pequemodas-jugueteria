import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface NavigatorConnection {
  effectiveType?: string;
  saveData?: boolean;
  rtt?: number;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

function getConnection(): NavigatorConnection | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return (navigator as Navigator & { connection?: NavigatorConnection }).connection;
}

function detectSlowNetwork(): {
  isSlowConnection: boolean;
  effectiveType: string;
  saveData: boolean;
} {
  const conn = getConnection();
  const effectiveType = conn?.effectiveType ?? '4g';
  const saveData = Boolean(conn?.saveData);
  const highRtt = typeof conn?.rtt === 'number' && conn.rtt > 650;
  const slowRadio =
    effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g';

  return {
    isSlowConnection: saveData || slowRadio || highRtt,
    effectiveType,
    saveData
  };
}

export function useNetworkQuality() {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const [netInfo, setNetInfo] = useState(detectSlowNetwork);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetInfo(detectSlowNetwork());
      void queryClient.invalidateQueries();
    };
    const handleOffline = () => setIsOnline(false);
    const handleConnChange = () => setNetInfo(detectSlowNetwork());

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const conn = getConnection();
    conn?.addEventListener?.('change', handleConnChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      conn?.removeEventListener?.('change', handleConnChange);
    };
  }, [queryClient]);

  const retryNow = useCallback(() => {
    void queryClient.invalidateQueries();
  }, [queryClient]);

  return {
    isOnline,
    isSlowConnection: netInfo.isSlowConnection,
    effectiveType: netInfo.effectiveType,
    saveData: netInfo.saveData,
    retryNow
  };
}
