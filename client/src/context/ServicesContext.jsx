// גשר בין שירותי ה-OOP לבין רכיבי React.
// ServicesProvider עוטף את העץ ומחזיק את גרף השירותים.
// useServices() מאפשר לכל רכיב לגשת אליהם בלי לייבא אותם ישירות.
// useNotifyToasts() ממיר את הזרם של Notify למצב React לתצוגה.

import { createContext, useContext, useEffect, useState } from 'react';
import { getServices } from '../services/ServiceRegistry.js';

const ServicesContext = createContext(null);

export function ServicesProvider({ children }) {
  const services = getServices();
  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices() {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error('useServices must be used inside ServicesProvider');
  return ctx;
}

export function useNotifyToasts() {
  const { notify } = useServices();
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsub = notify.subscribe(toast => {
      setToasts(prev => [...prev, toast]);
      if (toast.timeoutMs > 0) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toast.id));
        }, toast.timeoutMs);
      }
    });
    return unsub;
  }, [notify]);

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));
  return { toasts, dismiss };
}
