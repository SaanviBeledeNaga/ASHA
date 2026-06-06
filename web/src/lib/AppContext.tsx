"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'English' | 'Hindi' | 'Telugu';

interface UserProfile {
  name: string;
  mobileNumber: string;
  departmentCategory: string;
  aadhaarDetails?: any;
  panDetails?: any;
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  isOffline: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('English');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Load from local storage
    const savedLang = localStorage.getItem('asha_lang');
    if (savedLang) setLanguage(savedLang as Language);

    const savedProfile = localStorage.getItem('asha_profile');
    if (savedProfile) setUserProfile(JSON.parse(savedProfile));

    // Offline status listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('asha_lang', lang);
  };

  const handleSetUserProfile = (profile: UserProfile | null) => {
    setUserProfile(profile);
    if (profile) {
      localStorage.setItem('asha_profile', JSON.stringify(profile));
    } else {
      localStorage.removeItem('asha_profile');
    }
  };

  return (
    <AppContext.Provider value={{
      language,
      setLanguage: handleSetLanguage,
      userProfile,
      setUserProfile: handleSetUserProfile,
      isOffline
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
