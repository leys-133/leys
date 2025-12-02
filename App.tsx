import React, { useState, useEffect, useCallback } from 'react';
import { DailyProgress, PrayerKey, PRAYER_NAMES, PrayerTimesData, NotificationSettings } from './types';
import PrayerTimesCard from './components/PrayerTimesCard';
import GeminiMentor from './components/GeminiMentor';
import PrayerAlert from './components/PrayerAlert';
import QuranView from './components/QuranView';
import { Check, BookOpen, Moon, Sun, PenTool, Trash2, LayoutDashboard, Book } from 'lucide-react';

const INITIAL_STATE: DailyProgress = {
  date: new Date().toLocaleDateString('en-CA'),
  prayers: {
    fajr: { fard: false, sunnah: false },
    dhuhr: { fard: false, sunnah: false },
    asr: { fard: false, sunnah: false },
    maghrib: { fard: false, sunnah: false },
    isha: { fard: false, sunnah: false },
  },
  adhkar: {
    morning: false,
    evening: false,
  },
  study: {
    review: false,
    reading: false,
    notes: '',
  }
};

type ActiveTab = 'tracker' | 'quran';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('tracker');
  const [progress, setProgress] = useState<DailyProgress>(INITIAL_STATE);
  const [loaded, setLoaded] = useState(false);
  
  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    enabled: true,
    sound: true
  });
  
  // Lifted state for prayer times to share between Card and Alert
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesData | null>(null);

  // Load from LocalStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('dailyTracker');
    const savedSettings = localStorage.getItem('notificationSettings');
    const today = new Date().toLocaleDateString('en-CA');

    if (savedProgress) {
      const parsed: DailyProgress = JSON.parse(savedProgress);
      if (parsed.date === today) {
        setProgress(parsed);
      } else {
        setProgress({ ...INITIAL_STATE, date: today });
      }
    }

    if (savedSettings) {
      setNotificationSettings(JSON.parse(savedSettings));
    }
    
    setLoaded(true);
  }, []);

  // Save changes
  useEffect(() => {
    if (loaded) {
      localStorage.setItem('dailyTracker', JSON.stringify(progress));
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    }
  }, [progress, notificationSettings, loaded]);

  const togglePrayer = (prayer: PrayerKey, type: 'fard' | 'sunnah') => {
    setProgress(prev => ({
      ...prev,
      prayers: {
        ...prev.prayers,
        [prayer]: {
          ...prev.prayers[prayer],
          [type]: !prev.prayers[prayer][type]
        }
      }
    }));
  };

  const toggleAdhkar = (type: 'morning' | 'evening') => {
    setProgress(prev => ({
      ...prev,
      adhkar: {
        ...prev.adhkar,
        [type]: !prev.adhkar[type]
      }
    }));
  };

  const toggleStudy = (type: 'review' | 'reading') => {
    setProgress(prev => ({
      ...prev,
      study: {
        ...prev.study,
        [type]: !prev.study[type]
      }
    }));
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProgress(prev => ({
      ...prev,
      study: {
        ...prev.study,
        notes: e.target.value
      }
    }));
  };

  const resetData = () => {
    if (confirm("هل أنت متأكد من مسح جميع بيانات اليوم؟")) {
      const today = new Date().toLocaleDateString('en-CA');
      setProgress({ ...INITIAL_STATE, date: today });
    }
  };

  const handleTimesFetched = useCallback((times: PrayerTimesData) => {
    setPrayerTimes(times);
  }, []);

  const toggleNotification = () => {
    setNotificationSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  const toggleSound = () => {
    setNotificationSettings(prev => ({ ...prev, sound: !prev.sound }));
  };

  if (!loaded) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Alert System Component - Always Active */}
      <PrayerAlert prayerTimes={prayerTimes} settings={notificationSettings} />

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-extrabold text-emerald-700">روضة الطالب</h1>
            <p className="text-xs text-gray-500">{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          {activeTab === 'tracker' && (
            <button onClick={resetData} className="text-red-400 hover:bg-red-50 p-2 rounded-full transition-colors" title="مسح البيانات">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 mb-20">
        
        {activeTab === 'tracker' ? (
          <div className="space-y-6 animate-fade-in">
             {/* Prayer Times Widget */}
            <PrayerTimesCard 
              onTimesFetched={handleTimesFetched}
              settings={notificationSettings}
              onToggleSettings={toggleNotification}
              onToggleSound={toggleSound}
            />

            {/* Gemini Mentor Widget */}
            <GeminiMentor progress={progress} />

            {/* Prayer Tracking Section */}
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-1 h-6 bg-emerald-500 rounded-full inline-block"></span>
                الصلوات الخمس والسنن
              </h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-4 bg-gray-50 p-3 text-xs font-bold text-gray-500 border-b">
                  <div className="col-span-2">الصلاة</div>
                  <div className="text-center">الفرض</div>
                  <div className="text-center">السنة</div>
                </div>
                {(Object.keys(PRAYER_NAMES) as PrayerKey[]).map((key) => (
                  <div key={key} className="grid grid-cols-4 p-4 border-b last:border-0 items-center hover:bg-emerald-50/30 transition-colors">
                    <div className="col-span-2 font-bold text-gray-700">{PRAYER_NAMES[key]}</div>
                    
                    {/* Fard Checkbox */}
                    <div className="flex justify-center">
                      <label className="relative cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={progress.prayers[key].fard}
                          onChange={() => togglePrayer(key, 'fard')}
                        />
                        <div className="w-6 h-6 border-2 border-gray-300 rounded-md peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center text-white">
                          <Check className="w-4 h-4" />
                        </div>
                      </label>
                    </div>

                    {/* Sunnah Checkbox */}
                    <div className="flex justify-center">
                      <label className="relative cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={progress.prayers[key].sunnah}
                          onChange={() => togglePrayer(key, 'sunnah')}
                        />
                        <div className="w-6 h-6 border-2 border-gray-300 rounded-md peer-checked:bg-teal-400 peer-checked:border-teal-400 transition-all flex items-center justify-center text-white">
                          <Check className="w-4 h-4" />
                        </div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Adhkar Section */}
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-1 h-6 bg-amber-500 rounded-full inline-block"></span>
                الأذكار اليومية
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => toggleAdhkar('morning')}
                  className={`cursor-pointer rounded-2xl p-4 border transition-all ${progress.adhkar.morning ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-300' : 'bg-white border-gray-200 hover:border-amber-200'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-full ${progress.adhkar.morning ? 'bg-amber-200 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                      <Sun className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-700">أذكار الصباح</h3>
                  </div>
                  <div className={`text-xs ${progress.adhkar.morning ? 'text-amber-700' : 'text-gray-400'}`}>
                    {progress.adhkar.morning ? 'تمت القراءة، تقبل الله' : 'لم تقرأ بعد'}
                  </div>
                </div>

                <div 
                  onClick={() => toggleAdhkar('evening')}
                  className={`cursor-pointer rounded-2xl p-4 border transition-all ${progress.adhkar.evening ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300' : 'bg-white border-gray-200 hover:border-indigo-200'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-full ${progress.adhkar.evening ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>
                      <Moon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-700">أذكار المساء</h3>
                  </div>
                  <div className={`text-xs ${progress.adhkar.evening ? 'text-indigo-700' : 'text-gray-400'}`}>
                    {progress.adhkar.evening ? 'تمت القراءة، تقبل الله' : 'لم تقرأ بعد'}
                  </div>
                </div>
              </div>
            </section>

            {/* Study Section */}
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-500 rounded-full inline-block"></span>
                المهام الدراسية
              </h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
                
                <label className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={progress.study.review}
                      onChange={() => toggleStudy('review')}
                    />
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-full peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-gray-700 block group-hover:text-blue-700">مراجعة الدروس</span>
                    <span className="text-xs text-gray-500">مراجعة ما تم دراسته اليوم في المدرسة</span>
                  </div>
                  <PenTool className="w-5 h-5 text-gray-300 group-hover:text-blue-400" />
                </label>

                <label className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:bg-purple-50 cursor-pointer transition-colors group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={progress.study.reading}
                      onChange={() => toggleStudy('reading')}
                    />
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-full peer-checked:bg-purple-500 peer-checked:border-purple-500 transition-all flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-gray-700 block group-hover:text-purple-700">المطالعة الحرة</span>
                    <span className="text-xs text-gray-500">قراءة خارجية لتنمية المعرفة</span>
                  </div>
                  <BookOpen className="w-5 h-5 text-gray-300 group-hover:text-purple-400" />
                </label>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <label className="block text-sm font-bold text-gray-700 mb-2">ملاحظات وواجبات إضافية</label>
                  <textarea 
                    value={progress.study.notes}
                    onChange={handleNotesChange}
                    placeholder="اكتب هنا واجباتك أو ملاحظاتك لليوم..."
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none text-sm min-h-[80px]"
                  />
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="min-h-[80vh]">
            <QuranView />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-6 shadow-lg-up z-40">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-8">
          <button 
            onClick={() => setActiveTab('tracker')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'tracker' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <LayoutDashboard className={`w-6 h-6 ${activeTab === 'tracker' ? 'fill-emerald-100' : ''}`} />
            <span className="text-xs font-bold">الجدول اليومي</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('quran')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'quran' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Book className={`w-6 h-6 ${activeTab === 'quran' ? 'fill-emerald-100' : ''}`} />
            <span className="text-xs font-bold">المصحف الشريف</span>
          </button>
        </div>
      </nav>
      
      {/* Safe area padding for bottom nav */}
      <div className="h-16"></div>
    </div>
  );
};

export default App;