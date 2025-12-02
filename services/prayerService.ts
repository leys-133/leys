import { PrayerTimesData } from '../types';

export const getPrayerTimes = async (latitude: number, longitude: number): Promise<PrayerTimesData | null> => {
  try {
    const date = new Date();
    // Using Aladhan API which is free and reliable
    const response = await fetch(
      `https://api.aladhan.com/v1/timings/${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}?latitude=${latitude}&longitude=${longitude}&method=4` // Method 4 is Umm al-Qura
    );
    const data = await response.json();
    
    if (data && data.data && data.data.timings) {
      return data.data.timings;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch prayer times:", error);
    return null;
  }
};