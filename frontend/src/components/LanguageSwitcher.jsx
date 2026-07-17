import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API_BASE = "http://127.0.0.1:8000";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleLanguageChange = async (e) => {
    const lang = e.target.value;
    setLoading(true);
    
    // Change React UI Language
    await i18n.changeLanguage(lang);
    
    // Update Backend Global Preference (for Reports)
    try {
      await axios.post(`${API_BASE}/localization/preference`, { language: lang });
    } catch (error) {
      console.error("Failed to sync language preference with backend", error);
    }
    setLoading(false);
  };

  return (
    <div className="mt-auto pt-6 border-t border-forest-900/30">
      <div className="flex items-center space-x-3 px-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-forest-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        <div className="relative w-full">
          <select
            value={i18n.language}
            onChange={handleLanguageChange}
            disabled={loading}
            className="w-full bg-forest-950/50 border border-forest-800/50 text-forest-200 text-sm rounded-lg focus:ring-forest-500 focus:border-forest-500 block p-2.5 outline-none appearance-none cursor-pointer"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="mr">मराठी (Marathi)</option>
            <option value="gu">ગુજરાતી (Gujarati)</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
            <option value="ml">മലയാളം (Malayalam)</option>
            <option value="bn">বাংলা (Bengali)</option>
            <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-forest-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>
    </div>
  );
}
