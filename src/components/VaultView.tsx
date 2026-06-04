import React, { useState } from 'react';
import { CredentialType } from '../types';
import { BrandLogo } from './BrandLogo';
import { Copy, Eye, EyeOff, MoreVertical, Search, Edit2, Trash2, KeyRound } from 'lucide-react';
import { LanguageType, translations } from '../translations';

interface VaultViewProps {
  credentials: CredentialType[];
  onEdit: (cred: CredentialType) => void;
  onDelete: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  onOpenDrawer: () => void;
  showToast: (text: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  categories: string[];
  lang: LanguageType;
  onImport?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const VaultView: React.FC<VaultViewProps> = ({
  credentials,
  onEdit,
  onDelete,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  onOpenDrawer,
  showToast,
  categories,
  lang,
  onImport
}) => {
  const t = translations[lang];
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);



  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard securely!`, 'success');
  };

  // Filter logic
  const filteredCredentials = credentials.filter((cred) => {
    const sQuery = searchQuery.toLowerCase().trim();
    const serviceMatch = cred.service.toLowerCase().includes(sQuery);
    const userMatch = cred.username.toLowerCase().includes(sQuery);
    const urlMatch = cred.url ? cred.url.toLowerCase().includes(sQuery) : false;
    
    const matchesSearch = serviceMatch || userMatch || urlMatch || sQuery === '';
    const matchesCategory = selectedCategory === 'All' || cred.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getBadgeClass = (category: string) => {
    const maps: Record<string, string> = {
      Development: 'text-indigo-400 bg-indigo-500/10 border-indigo-550/20',
      Backend: 'text-amber-400 bg-amber-500/10 border-amber-550/20',
      Design: 'text-pink-400 bg-pink-500/10 border-pink-550/20',
      Marketing: 'text-cyan-400 bg-cyan-500/10 border-cyan-550/20',
      Communication: 'text-emerald-400 bg-emerald-500/10 border-emerald-550/20',
      Productivity: 'text-violet-400 bg-violet-500/10 border-violet-550/20'
    };
    return maps[category] || 'text-slate-400 bg-slate-500/10 border-slate-550/20';
  };

  return (
    <div className="flex flex-col gap-5 select-none relative h-full">
      <div className="flex items-center justify-between gap-4 flex-wrap bg-slate-900/40 p-4 border border-slate-800/60 rounded-xl">
        <div className="flex items-center gap-3 flex-grow max-w-md">
          {/* Search bar inputs */}
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 text-xs py-2.5 pl-10 pr-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans transition-all placeholder:text-slate-500 font-medium"
            />
          </div>
        </div>

        {/* Category filters inside list headers */}
        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-lg text-slate-300 text-xs py-2.5 px-3.5 focus:outline-none focus:border-indigo-500 font-sans transition-all cursor-pointer font-semibold"
          >
            <option value="All">{t.allProjects}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {onImport && (
            <label className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all duration-155 flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:shadow-emerald-650/15">
              <span>{lang === 'uz' ? 'Import (JSON)' : 'Import (JSON)'}</span>
              <input
                type="file"
                accept=".json"
                onChange={onImport}
                className="hidden"
              />
            </label>
          )}

          <button
            onClick={onOpenDrawer}
            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all duration-155 hover:shadow-lg hover:shadow-indigo-650/15 cursor-pointer"
          >
            {t.addCredentialsBtn}
          </button>
        </div>
      </div>

      {filteredCredentials.length === 0 ? (
        /* Empty states rendering */
        <div className="flex-grow flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl py-16 px-4 bg-slate-950/20">
          <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-slate-500 mb-4 shadow-xl">
            <KeyRound size={26} />
          </div>
          <h3 className="text-slate-200 font-bold text-lg">{t.noCredentialsFound}</h3>
          <p className="text-slate-550 text-xs text-center max-w-xs mt-1 leading-relaxed">
            {searchQuery 
              ? t.noRecordsMatch 
              : t.keepClean}
          </p>
          {!searchQuery && (
            <button
              onClick={onOpenDrawer}
              className="py-2 px-4 bg-indigo-600/15 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg text-xs font-bold transition-all border border-indigo-600/20 mt-4 cursor-pointer"
            >
              {t.addFirstRecord}
            </button>
          )}
        </div>
      ) : (
        /* Aligned Table Columns list */
        <div className="bg-slate-900/20 border border-slate-800/80 rounded-xl shadow-xl overflow-hidden">
          
          {/* Table headers */}
          <div className="hidden lg:flex items-center px-6 py-3.5 bg-slate-900 border-b border-slate-800/80 gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans select-none">
            <span className="w-[30%]">{t.serviceUrlCol}</span>
            <span className="w-[15%]">{t.tagCol}</span>
            <span className="w-[20%]">{t.usernameCol}</span>
            <span className="w-[20%]">{t.encryptionKeyCol}</span>
            <span className="w-[15%] text-right">{t.actionsCol}</span>
          </div>


          <div className="divide-y divide-slate-850">
            {filteredCredentials.map((cred) => (
              <div
                key={cred.id}
                className="group flex flex-col lg:flex-row items-stretch lg:items-center px-6 py-4 hover:bg-slate-900/60 transition-all gap-3 lg:gap-4 relative text-sm text-slate-300"
              >
                {/* Column: Service Details */}
                <div className="w-full lg:w-[30%] flex items-center gap-3.5 pr-2">
                  <div className="w-9 h-9 border border-slate-800 rounded-lg flex items-center justify-center bg-slate-950 flex-shrink-0 relative overflow-hidden group-hover:border-indigo-500/20 transition-colors">
                    <BrandLogo name={cred.logo} size={18} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-bold text-slate-200 truncate leading-tight group-hover:text-indigo-400 transition-colors">
                      {cred.service}
                    </span>
                    {cred.url ? (
                      <a
                        href={cred.url}
                        target="_blank"
                        rel="noreferrer referrer"
                        className="text-xs text-slate-500 hover:text-indigo-400 hover:underline truncate mt-1 tracking-wide font-sans cursor-pointer"
                      >
                        {cred.url.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-600 tracking-wide mt-1">{t.noUrlSpecified}</span>
                    )}
                  </div>
                </div>

                {/* Column: Tag Badges */}
                <div className="w-full lg:w-[15%] flex items-center">
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${getBadgeClass(cred.category)}`}>
                    {cred.category}
                  </span>
                </div>

                {/* Column: Username Copy link */}
                <div className="w-full lg:w-[20%] flex items-center pr-2">
                  <div className="flex items-center gap-1.5 overflow-hidden w-full">
                    <span className="text-slate-300 truncate font-sans text-xs font-semibold select-all">
                      {cred.username}
                    </span>
                    <button
                      onClick={() => copyToClipboard(cred.username, t.usernameCol)}
                      className="text-slate-550 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-800 rounded flex-shrink-0 cursor-pointer"
                      title={t.copyUsername}
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>

                {/* Column: Passwords copy/switch eyes */}
                <div className="w-full lg:w-[20%] flex items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-xs tracking-widest text-slate-400 min-w-[70px]">
                      {visiblePasswords[cred.id] ? (
                        <span className="font-sans font-semibold tracking-normal text-slate-300 select-all">
                          {cred.password}
                        </span>
                      ) : (
                        '••••••••'
                      )}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => togglePasswordVisibility(cred.id)}
                        className="text-slate-500 hover:text-slate-300 p-1 hover:bg-slate-800 rounded cursor-pointer"
                        title={visiblePasswords[cred.id] ? t.maskPassword : t.showPassword}
                      >
                        {visiblePasswords[cred.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(cred.password, t.encryptionKeyCol)}
                        className="text-slate-500 hover:text-indigo-400 p-1 hover:bg-slate-800 rounded cursor-pointer"
                        title={t.copyPassword}
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Column: Trigger Action dialog */}
                <div className="w-full lg:w-[15%] flex justify-start lg:justify-end items-center gap-2 mt-2 lg:mt-0 pt-2.5 lg:pt-0 border-t border-slate-800/40 lg:border-t-0">
                  <button
                    onClick={() => onEdit(cred)}
                    className="text-slate-450 hover:text-indigo-400 p-1.5 hover:bg-slate-800 rounded cursor-pointer transition-colors"
                    title={t.editRecord}
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(t.deleteConfirm.replace('{service}', cred.service))) {
                        onDelete(cred.id);
                      }
                    }}
                    className="text-slate-450 hover:text-rose-500 p-1.5 hover:bg-slate-800 rounded cursor-pointer transition-colors"
                    title={t.deleteRecord}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
};
