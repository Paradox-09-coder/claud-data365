import React, { useState, useEffect } from 'react';
import { CredentialType, CATEGORIES, LOGO_PRESETS } from '../types';
import { generateRandomPassword, getPasswordScore, getPasswordStrengthInfo, generateUUID } from '../utils';
import { X, Globe, User, Lock, Settings, LayoutGrid, FileText, Sparkles, RefreshCw } from 'lucide-react';

interface CredentialDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cred: Omit<CredentialType, 'updatedAt'>) => void;
  editCredential?: CredentialType | null;
  credentialsList: CredentialType[];
  showToast: (text: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const CredentialDrawer: React.FC<CredentialDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  editCredential,
  credentialsList,
  showToast
}) => {
  // Input fields state
  const [service, setService] = useState('');
  const [logoPreset, setLogoPreset] = useState('generic');
  const [customLogoBase64, setCustomLogoBase64] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');

  // Password Generator States
  const [genLength, setGenLength] = useState(16);
  const [genUpper, setGenUpper] = useState(true);
  const [genLower, setGenLower] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);

  // Strength details computed
  const score = getPasswordScore(password, credentialsList);
  const strengthInfo = getPasswordStrengthInfo(score);

  // Sync edits if editing existing records
  useEffect(() => {
    if (editCredential) {
      setService(editCredential.service);
      setUrl(editCredential.url || '');
      setUsername(editCredential.username);
      setPassword(editCredential.password);
      setCategory(editCredential.category);
      setNotes(editCredential.notes || '');
      
      if (editCredential.logo && editCredential.logo.startsWith('data:image/')) {
        setLogoPreset('custom');
        setCustomLogoBase64(editCredential.logo);
      } else {
        setLogoPreset(editCredential.logo || 'generic');
        setCustomLogoBase64(null);
      }
    } else {
      // Add record presets
      setService('');
      setLogoPreset('generic');
      setCustomLogoBase64(null);
      setUrl('');
      setUsername('');
      setPassword('');
      setCategory('Development');
      setNotes('');
    }
  }, [editCredential, isOpen]);

  if (!isOpen) return null;

  const handleCustomLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      setCustomLogoBase64(b64);
      showToast('Custom logo uploaded successfully.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleGeneratePasswordTrigger = () => {
    if (!genUpper && !genLower && !genNumbers && !genSymbols) {
      showToast('Pick at least one generator character constraint option!', 'warning');
      return;
    }
    const gen = generateRandomPassword(genLength, genUpper, genLower, genNumbers, genSymbols);
    setPassword(gen);
    showToast('Secure high-entropy password generated successfully!', 'success');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!service.trim() || !username.trim() || !password.trim()) {
      showToast('Please check required service credentials.', 'error');
      return;
    }

    const finalLogo = logoPreset === 'custom' && customLogoBase64 ? customLogoBase64 : logoPreset;

    onSave({
      id: editCredential ? editCredential.id : generateUUID(),
      service: service.trim(),
      logo: finalLogo,
      url: url.trim() || undefined,
      username: username.trim(),
      password,
      category,
      notes: notes.trim() || undefined
    });
  };

  return (
    <>
      {/* Dim/Fade backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
      />

      {/* Drawer Panel Sliding Column */}
      <div className="fixed top-0 right-0 h-screen w-full max-w-[460px] bg-slate-900 border-l border-slate-800/80 z-50 flex flex-col shadow-2xl overflow-hidden font-sans animation-slide-in select-none">
        
        {/* Draw Header */}
        <div className="px-6 h-20 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
          <h3 className="font-sans font-bold text-base text-slate-150">
            {editCredential ? 'Edit Corporate Credentials' : 'Add Account Silo'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Draw Body form */}
        <form onSubmit={handleFormSubmit} className="flex-grow overflow-y-auto px-6 py-5 flex flex-col gap-4 font-sans">
          
          {/* Service Name */}
          <div className="flex flex-col gap-1.5 focus-within:text-indigo-400 text-slate-450 transition-colors">
            <span className="text-[10px] uppercase font-bold tracking-wider font-sans">Service Name *</span>
            <div className="relative">
              <LayoutGrid size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="e.g. AWS Operational Node, Telegram CEO, Notion CRM"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs py-2.5 pl-10 pr-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans"
              />
            </div>
          </div>

          {/* Logo Brands Selecting (Preset SVGs / Custom upload file base64) */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 font-sans">Service Brand / Icon</span>
            <select
              value={logoPreset}
              onChange={(e) => setLogoPreset(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs py-2.5 px-3 focus:outline-none focus:border-indigo-500 font-sans font-semibold appearance-none cursor-pointer"
            >
              {LOGO_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
            {logoPreset === 'custom' && (
              <div className="mt-1 bg-slate-950/60 p-3 border border-slate-850 rounded-lg flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCustomLogoFileChange}
                  className="w-full text-[10px] file:py-1 file:px-2.5 file:rounded file:border file:border-slate-800 file:bg-slate-900 file:text-slate-300 file:cursor-pointer cursor-pointer text-slate-500"
                />
                {customLogoBase64 && (
                  <div className="flex items-center gap-2 mt-1 bg-slate-905 p-1.5 rounded border border-slate-850">
                    <span className="text-[10px] text-slate-505 font-sans font-medium">Render Quality Preview:</span>
                    <img
                      src={customLogoBase64}
                      alt="loaded Base64 brand avatar icon"
                      className="w-7 h-7 object-contain rounded border border-slate-800"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Website URL */}
          <div className="flex flex-col gap-1.5 focus-within:text-indigo-400 text-slate-450 transition-colors">
            <span className="text-[10px] uppercase font-bold tracking-wider font-sans">Silo URL Link</span>
            <div className="relative">
              <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g. https://aws.amazon.com/console/"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs py-2.5 pl-10 pr-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans"
              />
            </div>
          </div>

          {/* Username / Account Email */}
          <div className="flex flex-col gap-1.5 focus-within:text-indigo-400 text-slate-450 transition-colors">
            <span className="text-[10px] uppercase font-bold tracking-wider font-sans">Username / Email *</span>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="CEO_Account_Email"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs py-2.5 pl-10 pr-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans"
              />
            </div>
          </div>

          {/* Passwords Inputs with real eyes */}
          <div className="flex flex-col gap-1.5 focus-within:text-indigo-400 text-slate-450 transition-colors">
            <span className="text-[10px] uppercase font-bold tracking-wider font-sans">Key Secret *</span>
            <div className="relative text-slate-300">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450" />
              <input
                type="text" // Show in plain-text while editing for precision
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Secret Key Plaintext"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs py-2.5 pl-10 pr-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans font-medium"
              />
            </div>

            {/* Real strength gauge indicator */}
            <div className="mt-1 flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px] uppercase tracking-wide font-bold">
                <span className="text-slate-500">Key Score Strength</span>
                <span className={strengthInfo.colorClass.split(' ')[0]}>{strengthInfo.label} ({score}%)</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 h-1.5">
                <div className={`rounded-full h-full transition-all duration-300 ${score > 0 ? (strengthInfo.scoreVal >= 1 ? 'bg-rose-500' : 'bg-slate-800') : 'bg-slate-800'}`} />
                <div className={`rounded-full h-full transition-all duration-300 ${score > 0 ? (strengthInfo.scoreVal >= 2 ? 'bg-amber-500' : 'bg-slate-800') : 'bg-slate-800'}`} />
                <div className={`rounded-full h-full transition-all duration-300 ${score > 0 ? (strengthInfo.scoreVal >= 3 ? 'bg-emerald-500' : 'bg-slate-800') : 'bg-slate-800'}`} />
              </div>
            </div>
          </div>

          {/* Tag project tag */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 font-sans">Tag Tag / Department *</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs py-2.5 px-3 focus:outline-none focus:border-indigo-500 font-sans font-semibold appearance-none cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Notes area */}
          <div className="flex flex-col gap-1.5 focus-within:text-indigo-400 text-slate-450 transition-colors">
            <span className="text-[10px] uppercase font-bold tracking-wider font-sans">Service Notes (Optional)</span>
            <div className="relative">
              <FileText size={15} className="absolute left-3.5 top-3 text-slate-450" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Access credentials details, hints, or security reminders..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs py-2.5 pl-10 pr-3 min-h-[70px] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans resize-y"
              />
            </div>
          </div>

          {/* DYNAMIC PASSWORD GENERATOR EXPANDED SHELF (Image 3 section) */}
          <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between gap-2 mb-3 border-b border-slate-850 pb-2">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-300 font-sans flex items-center gap-1">
                <Sparkles size={11} className="text-amber-400 fill-amber-400/10" /> Cryptographic Key Generator
              </span>
              <button
                type="button"
                onClick={handleGeneratePasswordTrigger}
                className="p-1 px-2.5 rounded bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white text-[10px] font-bold border border-indigo-600/15 flex items-center gap-1 cursor-pointer select-none"
              >
                <RefreshCw size={9} className="animate-spin-slow" /> Generate
              </button>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              
              <div className="flex items-center justify-between text-[11px] font-bold font-sans">
                <span className="text-slate-400 font-medium">Password Length</span>
                <span className="text-indigo-400 font-mono font-extrabold">{genLength}</span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={genLength}
                onChange={(e) => setGenLength(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg text-indigo-500 appearance-none cursor-pointer focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-2 mt-1 bg-slate-950 p-2.5 rounded border border-slate-850">
                <label className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={genUpper}
                    onChange={(e) => setGenUpper(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-800 text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer h-3.5 w-3.5"
                  />
                  Uppercase A-Z
                </label>
                <label className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={genLower}
                    onChange={(e) => setGenLower(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-800 text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer h-3.5 w-3.5"
                  />
                  Lowercase a-z
                </label>
                <label className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={genNumbers}
                    onChange={(e) => setGenNumbers(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-800 text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer h-3.5 w-3.5"
                  />
                  Alphanumeric 0-9
                </label>
                <label className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={genSymbols}
                    onChange={(e) => setGenSymbols(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-800 text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer h-3.5 w-3.5"
                  />
                  Special Symbols
                </label>
              </div>

            </div>
          </div>

          <div className="h-4" />
        </form>

        {/* Draw Footer buttons */}
        <div className="px-6 py-4.5 bg-slate-950/40 border-t border-slate-800 flex justify-end gap-2.5 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-slate-100 rounded-lg font-bold cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleFormSubmit}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-lg shadow-lg hover:shadow-indigo-600/10 cursor-pointer transition-all"
          >
            {editCredential ? 'Apply Changes' : 'Save Credential'}
          </button>
        </div>

      </div>
    </>
  );
};
