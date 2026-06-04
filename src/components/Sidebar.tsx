import React from 'react';
import { Shield, Key, Settings, Moon, Sun, Lock, ShieldAlert, ListFilter, Globe } from 'lucide-react';
import { TabType } from '../types';
import { LanguageType, translations } from '../translations';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  selectedVault: string;
  onLock: () => void;
  isLightTheme: boolean;
  onToggleTheme: () => void;
  profileName: string;
  profilePhoto: string | null;
  lang: LanguageType;
  onToggleLang: (lang: LanguageType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  selectedVault,
  onLock,
  isLightTheme,
  onToggleTheme,
  profileName,
  profilePhoto,
  lang,
  onToggleLang
}) => {
  const t = translations[lang];

  const menuItems = [
    { id: 'vault' as TabType, label: t.vault, icon: <Key size={20} /> },
    { id: 'audit' as TabType, label: t.security, icon: <ShieldAlert size={20} /> },
    { id: 'activity' as TabType, label: t.activityLog, icon: <ListFilter size={20} /> },
    { id: 'settings' as TabType, label: t.settings, icon: <Settings size={20} /> }
  ];


  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800/80 p-5 flex flex-col h-full flex-shrink-0 select-none transition-colors">
      
      {/* Brand Badge */}
      <div className="flex items-center gap-3 px-1 mb-8">
        <div className="text-indigo-500">
          <Shield size={28} className="fill-indigo-500/10" />
        </div>
        <span className="font-sans font-extrabold text-xl tracking-wide bg-gradient-to-r from-slate-100 to-indigo-400 bg-clip-text text-transparent">
          PulVault
        </span>
      </div>

      {/* Primary Navigation Menu */}
      <nav className="flex-grow">
        <ul className="flex flex-col gap-1.5 list-none">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer text-left border ${
                  activeTab === item.id
                    ? 'bg-indigo-600/15 text-indigo-400 border-indigo-600/20'
                    : 'text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            </li>
          ))}

          {/* Theme custom toggle */}
          <li>
            <button
              onClick={onToggleTheme}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-semibold text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 transition-all cursor-pointer text-left border border-transparent"
            >
              {isLightTheme ? (
                <>
                  <Sun size={20} className="text-amber-400" />
                  {t.darkMode}
                </>
              ) : (
                <>
                  <Moon size={20} className="text-indigo-400" />
                  {t.lightMode}
                </>
              )}
            </button>
          </li>

          {/* Language custom toggle switcher inside sidebar list */}
          <li>
            <div className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold text-slate-400 border border-transparent">
              <span className="flex items-center gap-3.5 text-slate-400">
                <Globe size={20} className="text-indigo-400 flex-shrink-0" />
                <span className="truncate">Language</span>
              </span>
              <div className="flex bg-slate-950/60 p-0.5 rounded-lg border border-slate-800 flex-shrink-0">
                <button
                  onClick={() => onToggleLang('uz')}
                  className={`px-2 py-0.5 text-[10px] rounded-md font-bold transition-all cursor-pointer ${
                    lang === 'uz' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  UZ
                </button>
                <button
                  onClick={() => onToggleLang('en')}
                  className={`px-2 py-0.5 text-[10px] rounded-md font-bold transition-all cursor-pointer ${
                    lang === 'en' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>
          </li>
        </ul>
      </nav>

      {/* Safe Storage Feedback Banner matching Image 3 */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-850 bg-[#090d16]/30 mb-5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400/90 flex-shrink-0 shadow-lg shadow-emerald-500/5">
            <Lock size={18} className="fill-emerald-400/5 text-emerald-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold font-sans text-emerald-400 tracking-wide leading-none truncate">{t.storageEncrypted}</span>
            <span className="text-[10px] text-slate-450 font-medium tracking-wide leading-none mt-1 truncate">{t.aesEnabled}</span>
          </div>
        </div>
        
        {/* Lock button nested in the green storage banner */}
        <button
          onClick={onLock}
          title={t.secureLockout}
          className="w-8 h-8 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/15 hover:border-rose-500/40 text-rose-400 hover:text-rose-350 rounded-lg transition-all duration-150 flex items-center justify-center cursor-pointer select-none flex-shrink-0"
        >
          <Lock size={14} />
        </button>
      </div>

    </aside>
  );
};
