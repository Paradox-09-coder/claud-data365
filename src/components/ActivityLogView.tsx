import React from 'react';
import { ActivityLogEntry } from '../types';
import { Key, Shield, HardDrive, FileUp, Plus, Edit, Trash, Download } from 'lucide-react';
import { LanguageType, translations } from '../translations';

interface ActivityLogViewProps {
  logs: ActivityLogEntry[];
  lang: LanguageType;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ logs, lang }) => {
  const t = translations[lang];
  const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getIcon = (action: string) => {
    switch (action) {
      case 'create_cred':
        return {
          icon: <Plus size={16} />,
          bgColor: 'bg-rose-500/10 border-rose-500/20 text-rose-450',
        };
      case 'update_cred':
        return {
          icon: <Edit size={16} />,
          bgColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        };
      case 'delete_cred':
        return {
          icon: <Trash size={16} />,
          bgColor: 'bg-red-500/10 border-red-500/20 text-red-400',
        };
      case 'export_backup':
        return {
          icon: <Download size={16} />,
          bgColor: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
        };
      case 'import_backup':
        return {
          icon: <FileUp size={16} />,
          bgColor: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
        };
      case 'change_password':
        return {
          icon: <Key size={16} />,
          bgColor: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        };
      default:
        return {
          icon: <Shield size={16} />,
          bgColor: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
        };
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString(lang === 'uz' ? 'uz-UZ' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '12:00 PM';
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'May 6, 2014';
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl select-none font-sans">
      <div className="flex items-center justify-between border-b border-slate-800/65 pb-4">
        <div>
          <h2 className="font-sans font-bold text-xl text-slate-100">{t.activityLog}</h2>
          <p className="text-slate-400 text-xs mt-1">
            {lang === 'uz' 
              ? "Tizim voqealari, parollar yangilanishi va import-eksport harakatlari tarixi." 
              : "Audit log of system events, credentials registration, and backup activities."}
          </p>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/5 px-2.5 py-1 rounded border border-emerald-500/10 uppercase tracking-widest font-bold">
          {lang === 'uz' ? "TIZIM FAOL" : "LIVE AUDITING"}
        </span>
      </div>

      <div className="bg-slate-900/35 border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
        {sortedLogs.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center gap-3">
            <HardDrive className="text-slate-600 animate-pulse" size={40} />
            <span className="text-xs text-slate-500 font-medium">{t.noActivityYet}</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-850/60">
            {sortedLogs.map((log) => {
              const style = getIcon(log.action);
              // Simple Uzbek localization mappings for default logs titles
              let translatedTitle = log.title;
              let translatedSubtitle = log.subtitle;
              if (lang === 'uz') {
                if (log.title.toLowerCase().includes('credential')) {
                  translatedTitle = log.title.replace(/credential/gi, 'Ma\'lumotlar').replace(/registered/gi, 'ro\'yxatga olindi').replace(/modified/gi, 'o\'zgartirildi').replace(/removed/gi, 'o\'chirildi');
                } else if (log.title.toLowerCase().includes('backup')) {
                  translatedTitle = log.title.replace(/backup/gi, 'Zaxira nusxasi').replace(/exported/gi, 'eksport qilindi').replace(/imported/gi, 'import qilindi');
                } else if (log.title.toLowerCase().includes('master password')) {
                  translatedTitle = log.title.replace(/master password/gi, 'Master paroli').replace(/changed/gi, 'tahrirlandi').replace(/re-encrypted/gi, 'qayta shifrlindi');
                }
              }

              return (
                <div key={log.id} className="flex items-center justify-between p-4.5 hover:bg-slate-850/20 transition-all duration-150">
                  <div className="flex items-center gap-4.5">
                    {/* Visual status badge */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-sans font-extrabold shadow-md ${style.bgColor}`}>
                      {style.icon}
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-200">
                        {translatedTitle}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {translatedSubtitle}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end text-right">
                    <span className="text-xs font-semibold text-slate-350 font-mono">
                      {formatTime(log.timestamp)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-medium mt-0.5">
                      {formatDate(log.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

