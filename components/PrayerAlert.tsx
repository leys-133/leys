import React, { useEffect, useState, useRef } from 'react';
import { PrayerTimesData, NotificationSettings, PRAYER_NAMES, PrayerKey } from '../types';
import { Bell, X, Volume2, VolumeX } from 'lucide-react';

interface Props {
  prayerTimes: PrayerTimesData | null;
  settings: NotificationSettings;
}

const PrayerAlert: React.FC<Props> = ({ prayerTimes, settings }) => {
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastCheckedTime = useRef<string>("");

  // Initialize audio
  useEffect(() => {
    // Using a gentle notification sound (hosted on a reliable CDN or use a local asset if available)
    // Here we use a generic placeholder sound URL. 
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  useEffect(() => {
    if (!prayerTimes || !settings.enabled) return;

    const checkTime = () => {
      const now = new Date();
      // Format current time to HH:MM (24-hour format to match API usually, but let's be careful with 0 padding)
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;

      // Prevent multiple alerts within the same minute
      if (currentTime === lastCheckedTime.current) return;
      lastCheckedTime.current = currentTime;

      // Map API keys to our readable keys
      // Note: API returns "Fajr", "Dhuhr"... Our logic uses 'fajr', 'dhuhr'...
      // Also need to clean up API times (sometimes they have timezone like "05:30 (EEST)")
      const mapping: Record<string, string> = {
        'Fajr': 'fajr',
        'Dhuhr': 'dhuhr',
        'Asr': 'asr',
        'Maghrib': 'maghrib',
        'Isha': 'isha'
      };

      Object.entries(prayerTimes).forEach(([apiKey, timeString]) => {
        // timeString might be "05:30" or "05:30 (EEST)"
        // Cast to string because Object.entries values can be inferred as unknown in some environments
        const cleanTime = (timeString as string).split(' ')[0]; 
        
        if (cleanTime === currentTime && mapping[apiKey]) {
          triggerAlert(mapping[apiKey]);
        }
      });
    };

    const interval = setInterval(checkTime, 5000); // Check every 5 seconds to be accurate
    return () => clearInterval(interval);
  }, [prayerTimes, settings]);

  const triggerAlert = (prayerKey: string) => {
    setActiveAlert(prayerKey);
    if (settings.sound && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log("Audio play failed (user interaction required):", e));
    }
  };

  const dismissAlert = () => {
    setActiveAlert(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  if (!activeAlert) return null;

  const prayerName = PRAYER_NAMES[activeAlert as PrayerKey];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-bounce-small">
        <div className="bg-emerald-600 p-6 text-center text-white relative">
          <Bell className="w-12 h-12 mx-auto mb-2 animate-pulse" />
          <h2 className="text-2xl font-bold">حان وقت الصلاة</h2>
          <p className="text-emerald-100 mt-1">حي على الصلاة، حي على الفلاح</p>
        </div>
        
        <div className="p-6 text-center">
          <p className="text-gray-500 mb-2">دخل وقت صلاة</p>
          <h3 className="text-3xl font-bold text-gray-800 mb-6">{prayerName}</h3>
          
          <div className="flex gap-3 justify-center">
            <button 
              onClick={dismissAlert}
              className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex-1"
            >
              تم، سأصلي الآن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrayerAlert;