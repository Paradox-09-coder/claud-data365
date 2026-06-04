import React, { useMemo } from 'react';
import { CredentialType } from '../types';
import { getPasswordScore, getPasswordStrengthInfo } from '../utils';
import { ShieldAlert, AlertTriangle, Lightbulb, CheckCircle, ChevronRight } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { LanguageType, translations } from '../translations';

interface SecurityViewProps {
  credentials: CredentialType[];
  onEdit: (cred: CredentialType) => void;
  showToast: (text: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  lang: LanguageType;
}

export const SecurityView: React.FC<SecurityViewProps> = ({ credentials, onEdit, showToast, lang }) => {
  const t = translations[lang];
  // Precompute stats

  const stats = useMemo(() => {
    let totalCount = credentials.length;
    let strongCount = 0;
    let fairCount = 0;
    let weakCount = 0;
    
    // Track password frequencies for reuse checking
    const passMap = new Map<string, CredentialType[]>();
    credentials.forEach(cred => {
      const list = passMap.get(cred.password) || [];
      list.push(cred);
      passMap.set(cred.password, list);
    });

    let sumScores = 0;
    const weakList: CredentialType[] = [];
    const reusedList: CredentialType[] = [];

    credentials.forEach(cred => {
      const score = getPasswordScore(cred.password, credentials);
      sumScores += score;
      
      const strength = getPasswordStrengthInfo(score);
      if (strength.label === 'Strong') strongCount++;
      else if (strength.label === 'Fair') fairCount++;
      else {
        weakCount++;
        weakList.push(cred);
      }

      const duplicates = passMap.get(cred.password);
      if (duplicates && duplicates.length > 1) {
        reusedList.push(cred);
      }
    });

    const averageScore = totalCount > 0 ? Math.round(sumScores / totalCount) : 100;

    return {
      totalCount,
      averageScore,
      strongCount,
      fairCount,
      weakCount,
      weakList,
      reusedList,
      reusedCount: reusedList.length
    };
  }, [credentials]);

  // SVG Calculations for Segments
  const strokeCircumference = 339.29; // 2 * pi * r (r = 54)
  const radius = 54;
  const strokeDashoffset = useMemo(() => {
    return strokeCircumference - (stats.averageScore / 100) * strokeCircumference;
  }, [stats.averageScore]);

  // Stacked segments calculations
  const segmentedProps = useMemo(() => {
    const total = stats.totalCount || 1;
    const strongPct = stats.strongCount / total;
    const fairPct = stats.fairCount / total;
    const weakPct = stats.weakCount / total;

    const strongDash = strongPct * strokeCircumference;
    const fairDash = fairPct * strokeCircumference;
    const weakDash = weakPct * strokeCircumference;

    return {
      strong: {
        strokeDasharray: `${strongDash} ${strokeCircumference}`,
        strokeDashoffset: 0
      },
      fair: {
        strokeDasharray: `${fairDash} ${strokeCircumference}`,
        strokeDashoffset: -strongDash
      },
      weak: {
        strokeDasharray: `${weakDash} ${strokeCircumference}`,
        strokeDashoffset: -(strongDash + fairDash)
      }
    };
  }, [stats]);

  const scoreLabel = stats.averageScore >= 80 ? t.secure : stats.averageScore >= 50 ? t.medium : t.weak;
  const scoreColor = stats.averageScore >= 80 ? 'text-emerald-400' : stats.averageScore >= 50 ? 'text-amber-400' : 'text-rose-400';
  const scoreStroke = stats.averageScore >= 80 ? 'stroke-emerald-500' : stats.averageScore >= 50 ? 'stroke-amber-500' : 'stroke-rose-500';

  return (
    <div className="flex flex-col gap-6 select-none">
      
      <div>
        <h2 className="font-sans font-bold text-xl text-slate-100">{t.passwordHealthMetrics}</h2>
        <p className="text-slate-405 text-xs mt-1">{t.analyzingVault}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* CARD 1: Corporate Security Score */}
        <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-xl flex flex-col items-center shadow-lg">
          <h3 className="text-sm font-bold text-slate-350 self-start mb-4">{t.securityScore}</h3>
          
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg width="150" height="150" viewBox="0 0 120 120" className="-rotate-90">
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="fill-none stroke-slate-800"
                strokeWidth="8"
              />
              {stats.totalCount > 0 && (
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className={`fill-none ${scoreStroke} donut-segment`}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={strokeCircumference}
                  strokeDashoffset={strokeDashoffset}
                />
              )}
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-slate-50">{stats.averageScore}%</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${scoreColor}`}>
                {scoreLabel}
              </span>
            </div>
          </div>
          <p className="text-slate-550 text-xs text-center mt-4">
            {stats.averageScore >= 80 
              ? t.goodJob 
              : t.highRiskAlert}
          </p>
        </div>

        {/* CARD 2: Password Strength proportions */}
        <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-xl flex flex-col items-center justify-between shadow-lg">
          <h3 className="text-sm font-bold text-slate-350 self-start mb-4">{t.passwordHealthMetrics}</h3>

          <div className="flex items-center gap-6 w-full justify-center flex-col sm:flex-row">
            
            <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
              <svg width="150" height="150" viewBox="0 0 120 120" className="-rotate-90">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="fill-none stroke-slate-800/60"
                  strokeWidth="8"
                />
                {stats.totalCount > 0 && (
                  <>
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      className="fill-none stroke-emerald-500 donut-segment"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={segmentedProps.strong.strokeDasharray}
                      strokeDashoffset={segmentedProps.strong.strokeDashoffset}
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      className="fill-none stroke-amber-500 donut-segment"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={segmentedProps.fair.strokeDasharray}
                      strokeDashoffset={segmentedProps.fair.strokeDashoffset}
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      className="fill-none stroke-rose-500 donut-segment"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={segmentedProps.weak.strokeDasharray}
                      strokeDashoffset={segmentedProps.weak.strokeDashoffset}
                    />
                  </>
                )}
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-extrabold text-slate-50">{stats.totalCount}</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mt-0.5">{t.totalAnalyzed}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-[120px]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded" />
                <span className="text-slate-400 text-xs font-semibold">{t.strong}</span>
                <span className="font-mono text-xs text-slate-350 ml-auto font-bold">{stats.strongCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-amber-500 rounded" />
                <span className="text-slate-400 text-xs font-semibold">{t.medium}</span>
                <span className="font-mono text-xs text-slate-350 ml-auto font-bold">{stats.fairCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-rose-500 rounded" />
                <span className="text-slate-400 text-xs font-semibold">{t.weak}</span>
                <span className="font-mono text-xs text-slate-350 ml-auto font-bold">{stats.weakCount}</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Metrics mini grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/20 border border-slate-800/60 p-4 rounded-xl flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 font-sans">{t.totalAnalyzed}</span>
          <span className="font-mono text-2xl font-extrabold text-slate-200">{stats.totalCount}</span>
        </div>
        <div className="bg-slate-900/20 border border-slate-800/60 p-4 rounded-xl flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 font-sans">{t.strong}</span>
          <span className="font-mono text-2xl font-extrabold text-emerald-400">{stats.strongCount}</span>
        </div>
        <div className="bg-slate-900/20 border border-slate-800/60 p-4 rounded-xl flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-rose-450 font-sans">{t.weak}</span>
          <span className="font-mono text-2xl font-extrabold text-rose-400">{stats.weakCount}</span>
        </div>
        <div className="bg-slate-900/20 border border-slate-800/60 p-4 rounded-xl flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-450 font-sans">{t.redundantKeys}</span>
          <span className="font-mono text-2xl font-extrabold text-amber-400">{stats.reusedCount}</span>
        </div>
      </div>

      {/* Alert reuse duplicate passwords list */}
      {stats.reusedCount > 0 && (
        <div className="bg-slate-900/40 border-l-4 border-l-amber-500 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-amber-500 flex-shrink-0" size={18} />
            <span className="text-sm font-bold text-amber-400 block font-sans uppercase tracking-wide">{t.redundantKeys}</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            {lang === 'uz' 
              ? 'Ushbu parol guruhlari bir nechta joyda ishlatilgan. Agar bitta tizim buzilsa, begonalar hamma hisobingizga kira oladi.' 
              : 'The same password is shared across multiple sites. Hackers can compromise all systems if one site experiences a breach.'}
          </p>
          <div className="flex flex-col gap-2">
            {stats.reusedList.map((cred) => (
              <div key={cred.id + '-reuse'} className="flex items-center justify-between gap-3 p-3 bg-slate-950/60 border border-slate-850 rounded-lg text-xs">
                <div className="flex items-center gap-2 overflow-hidden truncate">
                  <div className="w-6 h-6 bg-slate-900/60 border border-slate-800 rounded flex items-center justify-center">
                    <BrandLogo name={cred.logo} size={12} />
                  </div>
                  <span className="font-bold text-slate-200 truncate">{cred.service}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({cred.username})</span>
                </div>
                <button
                  onClick={() => onEdit(cred)}
                  className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 text-amber-400 border border-amber-500/15 font-bold rounded flex items-center gap-1 cursor-pointer select-none"
                >
                  {lang === 'uz' ? 'Yangilash' : 'Update'} <ChevronRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weak passwords list */}
      {stats.weakCount > 0 && (
        <div className="bg-slate-900/40 border-l-4 border-l-rose-500 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="text-rose-500 flex-shrink-0" size={18} />
            <span className="text-sm font-bold text-rose-450 block font-sans uppercase tracking-wide">{t.weak}</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            {lang === 'uz'
              ? 'Ushbu parollar juda kuchsiz baholandi va ularni buzgʻunchi dasturlar bir necha soniyada osongina topa oladi.'
              : 'These credentials score extremely low. They can be solved via automated brute-force scripts very easily.'}
          </p>
          <div className="flex flex-col gap-2">
            {stats.weakList.map((cred) => (
              <div key={cred.id + '-weak'} className="flex items-center justify-between gap-3 p-3 bg-slate-950/60 border border-slate-850 rounded-lg text-xs">
                <div className="flex items-center gap-2 overflow-hidden truncate">
                  <div className="w-6 h-6 bg-slate-900/60 border border-slate-800 rounded flex items-center justify-center">
                    <BrandLogo name={cred.logo} size={12} />
                  </div>
                  <span className="font-bold text-slate-200 truncate">{cred.service}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({cred.username})</span>
                </div>
                <button
                  onClick={() => onEdit(cred)}
                  className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-550 hover:text-white text-rose-400 border border-rose-500/15 font-bold rounded flex items-center gap-1 cursor-pointer select-none"
                >
                  {lang === 'uz' ? 'Yaxshilash' : 'Upgrade'} <ChevronRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security tips list */}
      <div className="bg-slate-900/20 border border-slate-800/80 p-5 rounded-xl">
        <h3 className="text-sm font-bold text-slate-350 mb-3.5">{t.actionRecommended}</h3>
        <div className="flex flex-col gap-3 font-sans">
          <div className="flex gap-3 text-xs">
            <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
            <div>
              <span className="font-bold text-slate-300 block">{lang === 'uz' ? "Master parolingizni mutlaqo sir saqlang" : "Keep your Master Password strictly secret"}</span>
              <p className="text-slate-500 leading-relaxed mt-0.5">{lang === 'uz' ? "Sizning barcha ma'lumotlaringiz shifrlangan. Master kalit ularga kirishning yagona yo'lidir." : "All credentials inside the cabinet are securely hashed. Your master password is the only key."}</p>
            </div>
          </div>
          <div className="flex gap-3 text-xs">
            <Lightbulb size={16} className="text-indigo-400 flex-shrink-0" />
            <div>
              <span className="font-bold text-slate-300 block">{lang === 'uz' ? "Kamida 14 belgili parollar yarating" : "Enforce Minimum 14-Character Length"}</span>
              <p className="text-slate-500 leading-relaxed mt-0.5">{lang === 'uz' ? "Avtomatlashgan xakerlik tizimlari qisqa parollarni tezroq topa oladi. Uzunlik sizning eng katta himoyangizdir!" : "Automated cracker tools can brute-force short alphanumeric sequences. Length remains your finest defense."}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
