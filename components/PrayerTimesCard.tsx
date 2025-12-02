import React, { useEffect, useState } from 'react';
import { PrayerTimesData, NotificationSettings } from '../types';
import { getPrayerTimes } from '../services/prayerService';
import { MapPin, Clock, Bell, BellOff, Volume2, VolumeX } from 'lucide-react';

interface Props {
  onTimesFetched: (times: PrayerTimesData) => void;
  settings: NotificationSettings;
  onToggleSettings: () => void;
  onToggleSound: () => void;
}

const PrayerTimesCard: React.FC<Props> = ({ onTimesFetched, settings, onToggleSettings, onToggleSound }) => {
  const [times, setTimes] = useState<PrayerTimesData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("المتصفح لا يدعم تحديد الموقع");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const data = await getPrayerTimes(position.coords.latitude, position.coords.longitude);
        if (data) {
          setTimes(data);
          onTimesFetched(data); // Lift state up to App
        } else {
          setError("فشل جلب المواقيت");
        }
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("يرجى تفعيل الموقع لعرض المواقيت");
        setLoading(false);
      }
    );
  }, [onTimesFetched]);

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2 mb-6">
        <MapPin className="w-4 h-4" />
        {error}
      </div>
    );
  }

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded-xl w-full mb-6"></div>;
  }

  if (!times) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl p-4 shadow-lg mb-6 relative">
      <div className="flex items-center justify-between mb-4 border-b border-white/20 pb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          <h3 className="font-bold">مواقيت الصلاة اليوم</h3>
        </div>
        
        {/* Settings Controls */}
        <div className="flex gap-2">
          <button 
            onClick={onToggleSound}
            className={`p-1.5 rounded-lg transition-colors ${settings.sound ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500/20 hover:bg-red-500/30 text-white/70'}`}
            title={settings.sound ? "كتم الصوت" : "تشغيل الصوت"}
          >
            {settings.sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button 
            onClick={onToggleSettings}
            className={`p-1.5 rounded-lg transition-colors ${settings.enabled ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500/20 hover:bg-red-500/30 text-white/70'}`}
            title={settings.enabled ? "إيقاف التنبيهات" : "تفعيل التنبيهات"}
          >
            {settings.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 text-center text-sm">
        <div>
          <span className="block text-emerald-100 text-xs mb-1">الفجر</span>
          <span className="font-bold">{times.Fajr.split(' ')[0]}</span>
        </div>
        <div>
          <span className="block text-emerald-100 text-xs mb-1">الظهر</span>
          <span className="font-bold">{times.Dhuhr.split(' ')[0]}</span>
        </div>
        <div>
          <span className="block text-emerald-100 text-xs mb-1">العصر</span>
          <span className="font-bold">{times.Asr.split(' ')[0]}</span>
        </div>
        <div>
          <span className="block text-emerald-100 text-xs mb-1">المغرب</span>
          <span className="font-bold">{times.Maghrib.split(' ')[0]}</span>
        </div>
        <div>
          <span className="block text-emerald-100 text-xs mb-1">العشاء</span>
          <span className="font-bold">{times.Isha.split(' ')[0]}</span>
        </div>
      </div>
    </div>
  );
};

export default PrayerTimesCard;