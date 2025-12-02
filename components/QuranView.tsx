import React, { useState, useEffect, useRef } from 'react';
import { Surah, SurahDetail } from '../types';
import { getAllSurahs, getSurahDetails, getAudioUrl } from '../services/quranService';
import { Search, ChevronLeft, Play, Pause, BookOpen, Volume2, ArrowRight } from 'lucide-react';

const QuranView: React.FC = () => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurah, setSelectedSurah] = useState<SurahDetail | null>(null);
  const [loadingSurah, setLoadingSurah] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchSurahs = async () => {
      const data = await getAllSurahs();
      setSurahs(data);
      setLoading(false);
    };
    fetchSurahs();
  }, []);

  // Stop audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleSelectSurah = async (surah: Surah) => {
    setLoadingSurah(true);
    // Stop previous audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    
    const details = await getSurahDetails(surah.number);
    setSelectedSurah(details);
    setLoadingSurah(false);

    // Initialize new audio
    audioRef.current = new Audio(getAudioUrl(surah.number));
    audioRef.current.onended = () => setIsPlaying(false);
  };

  const handleBack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setSelectedSurah(null);
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Audio play error:", e));
    }
    setIsPlaying(!isPlaying);
  };

  const filteredSurahs = surahs.filter(s => 
    s.name.includes(searchQuery) || 
    s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.number.toString().includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-emerald-600">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p>جاري تحميل المصحف الشريف...</p>
      </div>
    );
  }

  // --- Reading View ---
  if (selectedSurah) {
    return (
      <div className="animate-fade-in pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-gray-50/95 backdrop-blur py-2 z-10 border-b border-gray-200">
          <button onClick={handleBack} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowRight className="w-6 h-6 text-gray-700" />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-emerald-800">{selectedSurah.name}</h2>
            <p className="text-xs text-gray-500">{selectedSurah.englishName}</p>
          </div>
          <div className="w-10"></div> {/* Spacer for alignment */}
        </div>

        {/* Audio Player Bar */}
        <div className="bg-emerald-600 text-white p-3 rounded-xl mb-6 flex items-center justify-between shadow-lg sticky top-20 z-10 mx-1">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white/20 rounded-full">
               <Volume2 className="w-5 h-5" />
             </div>
             <div className="text-sm">
               <p className="font-bold">تلاوة بصوت</p>
               <p className="text-emerald-100 text-xs">مشاري العفاسي</p>
             </div>
          </div>
          <button 
            onClick={toggleAudio}
            className="w-10 h-10 bg-white text-emerald-600 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-md"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>
        </div>

        {/* Bismillah */}
        {selectedSurah.number !== 1 && selectedSurah.number !== 9 && (
          <div className="text-center mb-8 font-quran text-2xl text-emerald-800">
            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </div>
        )}

        {/* Ayahs */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="font-quran text-2xl text-gray-800 text-justify leading-loose" dir="rtl">
            {selectedSurah.ayahs.map((ayah, index) => (
              <span key={ayah.number}>
                {ayah.text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '').trim()} 
                <span className="inline-flex items-center justify-center w-8 h-8 mx-2 text-sm border border-emerald-500 rounded-full text-emerald-600 font-sans number-font bg-emerald-50 align-middle">
                  {ayah.numberInSurah}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- List View ---
  return (
    <div className="animate-fade-in pb-20">
      <div className="relative mb-6">
        <input 
          type="text" 
          placeholder="ابحث عن سورة..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-4 pr-12 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none shadow-sm"
        />
        <Search className="w-5 h-5 text-gray-400 absolute top-1/2 right-4 -translate-y-1/2" />
      </div>

      <div className="grid gap-3">
        {loadingSurah ? (
           <div className="text-center py-12 text-gray-500">جاري تحميل السورة...</div>
        ) : (
          filteredSurahs.map((surah) => (
            <div 
              key={surah.number}
              onClick={() => handleSelectSurah(surah)}
              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-bold text-sm border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  {surah.number}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{surah.name}</h3>
                  <p className="text-xs text-gray-500">{surah.englishNameTranslation} • {surah.numberOfAyahs} آية</p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuranView;