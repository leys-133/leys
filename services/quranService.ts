import { Surah, SurahDetail } from '../types';

const BASE_URL = 'https://api.alquran.cloud/v1';

export const getAllSurahs = async (): Promise<Surah[]> => {
  try {
    const response = await fetch(`${BASE_URL}/surah`);
    const data = await response.json();
    if (data.code === 200) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch surahs:", error);
    return [];
  }
};

export const getSurahDetails = async (surahNumber: number): Promise<SurahDetail | null> => {
  try {
    // Fetching simple arabic text
    const response = await fetch(`${BASE_URL}/surah/${surahNumber}`);
    const data = await response.json();
    if (data.code === 200) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch surah details:", error);
    return null;
  }
};

export const getAudioUrl = (surahNumber: number): string => {
  // Using Mishary Alafasy as a high quality default
  // Pad the number to 3 digits (e.g., 001, 012, 114) for some CDNs, but Islamic Network handles integers well.
  return `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${surahNumber}.mp3`;
};