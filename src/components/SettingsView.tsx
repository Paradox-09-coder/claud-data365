import React, { useState, useEffect } from 'react';
import { SettingsSubTabType, CredentialType } from '../types';
import { Shield, FileDown, FileUp, KeyRound, AlertTriangle, ShieldCheck, User2, Lock, Sliders, Camera, UploadCloud, Send, Mail, CheckCircle } from 'lucide-react';
import { LanguageType, translations } from '../translations';

interface SettingsViewProps {
  selectedVault: string;
  credentials: CredentialType[];
  autoLockTimeout: number;
  onSetAutoLockTimeout: (ms: number) => void;
  onWipeVault: (name: string) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeMasterPassword: (current: string, next: string) => Promise<boolean>;
  showToast: (text: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  profileName: string;
  profilePhoto: string | null;
  onSaveProfile: (name: string, photo: string | null) => void;
  lang: LanguageType;
}

export const SettingsSettingsSubTabs: React.FC<SettingsViewProps> = ({
  selectedVault,
  credentials,
  autoLockTimeout,
  onSetAutoLockTimeout,
  onWipeVault,
  onExport,
  onImport,
  onChangeMasterPassword,
  showToast,
  profileName,
  profilePhoto,
  onSaveProfile,
  lang
}) => {
  const t = translations[lang];
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTabType>('profile');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Form states
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showFormPasswords, setShowFormPasswords] = useState(false);

  // Verification states for password change authorized flow
  const [passwordChangeStep, setPasswordChangeStep] = useState<1 | 2>(1); // 1 = verification, 2 = password entry
  const [verificationCode, setVerificationCode] = useState('');
  const [enteredVerificationCode, setEnteredVerificationCode] = useState('');
  const [sentCodeAlert, setSentCodeAlert] = useState<string | null>(null);

  const openChangePasswordModal = () => {
    setPasswordChangeStep(1);
    setVerificationCode('');
    setEnteredVerificationCode('');
    setSentCodeAlert(null);
    setCurrPassword('');
    setNewPassword('');
    setNewPasswordConfirm('');
    setIsChangePasswordOpen(true);
  };

  // Profile forms
  const [tempName, setTempName] = useState(profileName);
  const [tempPhoto, setTempPhoto] = useState<string | null>(profilePhoto);
  const [vaultEmail, setVaultEmail] = useState('');

  // Update temp values if user profiles changed externally
  useEffect(() => {
    setTempName(profileName);
  }, [profileName]);

  useEffect(() => {
    setTempPhoto(profilePhoto);
  }, [profilePhoto]);

  useEffect(() => {
    const key = `aegis_vault_email_${selectedVault.replace(/\s+/g, '_')}`;
    const storedEmail = localStorage.getItem(key);
    setVaultEmail(storedEmail || 'notuzbekistan1@gmail.com');
  }, [selectedVault]);

  const subTabs = [
    { id: 'profile' as SettingsSubTabType, label: t.profileTab, icon: <User2 size={16} /> },
    { id: 'preferences' as SettingsSubTabType, label: t.preferencesTab, icon: <Sliders size={16} /> },
    { id: 'security' as SettingsSubTabType, label: t.securityTab, icon: <ShieldCheck size={16} /> },
    { id: 'danger' as SettingsSubTabType, label: t.dangerZoneTab, icon: <AlertTriangle size={16} /> }
  ];

  const handleWipeVaultTrigger = () => {
    const confirmation = window.confirm(
      lang === 'uz'
        ? `"${selectedVault.replace(/_/g, ' ')}" omboriga tegishli barcha ma'lumotlarni butunlay o'chirib tashlashni tasdiqlaysizmi? Uni qayta tiklab bo'lmaydi!`
        : `Permanently wipe and destroy all data stored for vault silo "${selectedVault.replace(/_/g, ' ')}"? This action is irreversible!`
    );
    if (confirmation) {
      onWipeVault(selectedVault);
    }
  };

  const handlePasswordFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== newPasswordConfirm) {
      showToast(lang === 'uz' ? 'Yangi parollar mos kelmadi!' : 'New passwords do not match!', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast(lang === 'uz' ? 'Yangi parol kamida 8 ta belgidan iborat bo\'lishi kerak!' : 'Master password must be 8+ characters!', 'error');
      return;
    }

    const success = await onChangeMasterPassword(currPassword, newPassword);
    if (success) {
      setIsChangePasswordOpen(false);
      setCurrPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      showToast(
        lang === 'uz'
          ? 'Master parol muvaffaqiyatli o\'zgartirildi va ombor qayta shifrlindi!'
          : 'Master password modified successfully. Vault re-encrypted!',
        'success'
      );
    } else {
      showToast(lang === 'uz' ? 'Hozirgi master parol noto\'g\'ri kiritildi!' : 'Incorrect current password confirmation value.', 'error');
    }
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast(lang === 'uz' ? 'Iltimos, rasm formatidagi fayl yuklang!' : 'Please select a valid image file!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setTempPhoto(dataUrl);
      showToast(lang === 'uz' ? 'Profil rasmi yuklandi!' : 'Profile photo converted and staged successfully.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfileForm = (e: React.FormEvent) => {
    e.preventDefault();
    const nameVal = tempName.trim();
    if (!nameVal) {
      showToast(lang === 'uz' ? 'Foydalanuvchi ismi bo\'sh bo\'lishi mumkin emas!' : 'Username cannot be empty!', 'error');
      return;
    }

    onSaveProfile(nameVal, tempPhoto);
  };


  return (
    <div className="flex flex-col gap-6 select-none max-w-2xl font-sans">
      <div>
        <h2 className="font-sans font-bold text-xl text-slate-100">{t.settings}</h2>
        <p className="text-slate-400 text-xs mt-1">
          {lang === 'uz'
            ? 'Faol ombor sozlamalarini konfiguratsiya qiling, zaxira nusxalarini yuklang va profilingizni boshqaring.'
            : 'Configure active silo preferences, export secure data, or manage profile parameters.'}
        </p>
      </div>

      {/* Subtab Navigation Panel */}
      <div className="flex border-b border-slate-800 gap-6 select-none overflow-x-auto pb-px">
        {subTabs.map((sTab) => (
          <button
            key={sTab.id}
            onClick={() => setActiveSubTab(sTab.id)}
            className={`flex items-center gap-2 py-2.5 px-1 border-b-2 font-bold text-xs font-sans tracking-wide transition-all cursor-pointer ${
              activeSubTab === sTab.id
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-450 hover:text-slate-200'
            }`}
          >
            {sTab.icon}
            {sTab.label}
          </button>
        ))}
      </div>

      {/* Content views mapping */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        
        {/* VIEW: Profile */}
        {activeSubTab === 'profile' && (
          <form onSubmit={handleSaveProfileForm} className="flex flex-col gap-5">
            <h3 className="text-sm font-bold text-slate-200 font-sans uppercase tracking-wider mb-2">{t.profileDetails}</h3>
            
            {/* Drag & select Photo Upload Row */}
            <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-950/40 p-5 rounded-lg border border-slate-800/60">
              <div className="relative group cursor-pointer">
                {tempPhoto ? (
                  <img src={tempPhoto} alt="avatar" referrerPolicy="no-referrer" className="w-20 h-20 rounded-full border-2 border-indigo-500/50 object-cover shadow-lg" />
                ) : (
                  <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center font-black text-3xl text-white shadow-lg shadow-indigo-600/10">
                    {(tempName || selectedVault).charAt(0).toUpperCase()}
                  </div>
                )}
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center text-white transition-opacity duration-150 cursor-pointer">
                  <Camera size={18} />
                  <input type="file" accept="image/*" onChange={handleProfileImageUpload} className="hidden" />
                </label>
              </div>

              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <span className="text-xs font-bold text-slate-200">{lang === 'uz' ? 'Profil rasmini yuklash' : 'Upload Profile Photo'}</span>
                <span className="text-[10px] text-slate-550 mt-1 leading-normal max-w-[280px]">
                  {lang === 'uz' 
                    ? 'Rasm formatlarini qabul qiladi. Mahalliy kesh xotirasiga saqlanadi.'
                    : 'Accepts standard image formats. Converted locally to client cache schema.'}
                </span>
                <label className="mt-2 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer flex items-center gap-1">
                  <UploadCloud size={12} /> {lang === 'uz' ? 'Kompyuterdan rasm yuklash...' : 'Select photo from computer...'}
                  <input type="file" accept="image/*" onChange={handleProfileImageUpload} className="hidden" />
                </label>
              </div>
            </div>


            {/* Form details input */}
            <div className="flex flex-col gap-3.5 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">{lang === 'uz' ? 'Foydalanuvchi nomi' : 'Username'}</label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="e.g. abdumalik"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs py-2.5 px-3 focus:outline-none focus:border-indigo-500 font-sans font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">{lang === 'uz' ? 'Asosiy elektron pochta manzili' : 'Primary Email Address'}</label>
                <div className="relative">
                  <input
                    type="email"
                    value={vaultEmail}
                    disabled
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg text-slate-450 text-xs py-2.5 px-3 focus:outline-none font-sans font-medium cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] uppercase font-extrabold text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded tracking-widest leading-none">
                    {lang === 'uz' ? 'Tizim pochtasi' : 'Registered Key Address'}
                  </span>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-850/60 flex flex-col mt-2">
              <div className="flex justify-between py-3.5 text-xs">
                <span className="text-slate-450 font-sans">{lang === 'uz' ? 'Faol saqlagich' : 'Active Silo'}</span>
                <span className="font-bold text-slate-200">{selectedVault.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between py-3.5 text-xs">
                <span className="text-slate-450 font-sans">{lang === 'uz' ? 'Shifrsiz yozuvlar soni' : 'Decrypted Records'}</span>
                <span className="font-bold text-slate-200 font-mono">{credentials.length} {lang === 'uz' ? 'ta element' : 'entries'}</span>
              </div>
              <div className="flex justify-between py-3.5 text-xs">
                <span className="text-slate-450 font-sans">{lang === 'uz' ? 'Ruxsat darajasi' : 'Clearance Role'}</span>
                <span className="font-bold text-indigo-400 uppercase font-sans font-extrabold">{lang === 'uz' ? 'Administrator' : 'Administrator'}</span>
              </div>
            </div>

            <button
              type="submit"
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white rounded-lg font-bold text-xs mt-3 self-end cursor-pointer transition-all shadow-lg shadow-indigo-600/10"
            >
              {lang === 'uz' ? 'Profilni saqlash' : 'Save Profile Options'}
            </button>
          </form>
        )}

        {/* VIEW: Preferences auto-lock timer */}
        {activeSubTab === 'preferences' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-200 font-sans uppercase tracking-wider">{t.autoLockTimer}</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              {lang === 'uz'
                ? 'Saqlagich xafvsizlik nuqtai nazaridan avtomatik ravishda qulflanishi uchun muddatni sozlang.'
                : 'Define the duration of inactivity required to auto-lock the vault decrypter and purge master keys.'}
            </p>
            <div className="flex flex-col gap-1.5 max-w-[280px] mt-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t.autoLockTimer}</span>
              <div className="relative">
                <select
                  value={autoLockTimeout}
                  onChange={(e) => onSetAutoLockTimeout(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs py-2.5 px-3 focus:outline-none focus:border-indigo-500 font-sans font-semibold appearance-none cursor-pointer"
                >
                  <option value={60000}>1 {lang === 'uz' ? 'Daqiqa' : 'Minute'}</option>
                  <option value={30005}>30 {lang === 'uz' ? 'Soniya' : 'Seconds'}</option>
                  <option value={300000}>5 {lang === 'uz' ? 'Daqiqa' : 'Minutes'}</option>
                  <option value={600000}>10 {lang === 'uz' ? 'Daqiqa' : 'Minutes'}</option>
                  <option value={1800000}>30 {lang === 'uz' ? 'Daqiqa' : 'Minutes'}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: Security actions change/export/import backup (Image 5 rows list) */}
        {activeSubTab === 'security' && (
          <div className="flex flex-col gap-3">
            
            {/* ROW 1: Change Master Password */}
            <div className="flex items-center gap-4 bg-slate-950/60 p-4 border border-slate-800 rounded-lg">
              <div className="w-10 h-10 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <KeyRound size={20} />
              </div>
              <div className="flex-grow flex flex-col">
                <span className="text-sm font-bold text-slate-200">{lang === 'uz' ? 'Master parolni o\'zgartirish' : 'Change Master Password'}</span>
                <span className="text-xs text-slate-450 mt-0.5">{lang === 'uz' ? 'Portalga kirish uchun xavfsiz kalit kalit so\'zini tanlang.' : 'Choose a secure password credentials key.'}</span>
              </div>
              <button
                onClick={openChangePasswordModal}
                className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold select-none cursor-pointer transition-colors"
              >
                {t.changeKeyBtn}
              </button>
            </div>

            {/* ROW 2: Export backup */}
            <div className="flex items-center gap-4 bg-slate-950/60 p-4 border border-slate-800 rounded-lg">
              <div className="w-10 h-10 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileDown size={20} />
              </div>
              <div className="flex-grow flex flex-col">
                <span className="text-sm font-bold text-slate-200">{lang === 'uz' ? 'Shifrlangan zaxira nusxasini yuklash' : 'Export Encrypted Backup'}</span>
                <span className="text-xs text-slate-450 mt-0.5">{lang === 'uz' ? 'AES-256 shifrlangan JSON ma\'lumotlar faylini yuklab oling.' : 'Download AES encrypted silos folder locally.'}</span>
              </div>
              <button
                onClick={onExport}
                className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold select-none cursor-pointer transition-colors"
              >
                {lang === 'uz' ? 'Yuklab olish' : 'Export Vault'}
              </button>
            </div>

            {/* ROW 3: Import backup */}
            <div className="flex items-center gap-4 bg-slate-950/60 p-4 border border-slate-800 rounded-lg">
              <div className="w-10 h-10 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileUp size={20} />
              </div>
              <div className="flex-grow flex flex-col">
                <span className="text-sm font-bold text-slate-200">{lang === 'uz' ? 'Zaxira nusxasini tiklash (Import)' : 'Import Cryptographic Backup'}</span>
                <span className="text-xs text-slate-450 mt-0.5">{lang === 'uz' ? 'Shifrlangan JSON faylini portalga yuklang.' : 'Restore encrypted database files.'}</span>
              </div>
              <label className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold select-none cursor-pointer transition-colors">
                {lang === 'uz' ? 'Fayl yuklash' : 'Import Vault'}
                <input
                  type="file"
                  accept=".json"
                  onChange={onImport}
                  className="hidden"
                />
              </label>
            </div>

          </div>
        )}

        {/* VIEW: Danger Zone wipe */}
        {activeSubTab === 'danger' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-rose-500 flex items-center gap-1">
              <AlertTriangle size={16} /> {lang === 'uz' ? 'Tizimni butunlay tozalash amali' : 'Destructive Silo Erase Actions'}
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              {lang === 'uz'
                ? 'Ushbu omborni o\'chirish barcha shifrlangan ma\'lumotlarni va kesh xotiralarni butunlay tozalab tashlaydi. Agar sizda JSON backup fayli bo\'lmasa, ularni hech qachon qayta tiklab bo\'lmaydi.'
                : 'Erasing the active silo clears the cryptosystem keys and ciphertext blocks from your local disk. If you do not possess an exported JSON key backup file, this content is gone forever.'}
            </p>
            <button
              onClick={handleWipeVaultTrigger}
              className="py-2.5 px-4 bg-rose-600/10 hover:bg-rose-600 text-rose-450 hover:text-white border border-rose-500/15 hover:border-transparent rounded-lg font-bold text-xs mt-2 self-start cursor-pointer transition-all"
            >
              {lang === 'uz' ? 'Ma\'lumotlar omborini o\'chirib tashlash' : 'Wipe Unlocked Silo Database'}
            </button>
          </div>
        )}


      </div>

      {/* MODAL: Change Password Form modal (Image 5 subtab actions) */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full shadow-2xl relative">
            <div className="px-6 py-4 border-b border-slate-800/80 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <Lock size={15} /> {t.updateMasterPassword}
              </h3>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {passwordChangeStep === 1 ? (
              <div>
                <div className="p-6 flex flex-col gap-4">
                  <p className="text-xs text-slate-350 leading-relaxed">
                    {lang === 'uz'
                      ? `Xavfsizlikni ta'minlash uchun profilingizni tasdiqlashingiz kerak. Quyidagi elektron pochta manzilingizga 6 xonali tasdiqlash OTP kodini yuborish orqali jarayonni boshlang: `
                      : `For security, we must verify your identity. Authorize password modification by sending a 6-digit confirmation key to your primary email address: `}
                    <strong className="text-slate-100">{vaultEmail}</strong>.
                  </p>

                  {sentCodeAlert && (
                    <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-lg p-3 text-[11px] text-emerald-400 font-mono leading-relaxed select-all">
                      <Mail size={14} className="inline mr-1.5 mb-0.5" />
                      <strong>{lang === 'uz' ? 'XAVFSIZ POCHTA QUTISI SIMULYATORI:' : 'SECURE INCOMING MAILBOX SIMULATOR:'}</strong>
                      <div className="mt-1 font-sans text-slate-200">{sentCodeAlert}</div>
                    </div>
                  )}

                  {!verificationCode ? (
                    <button
                      type="button"
                      onClick={() => {
                        const code = Math.floor(100000 + Math.random() * 900000).toString();
                        setVerificationCode(code);
                        if (lang === 'uz') {
                          setSentCodeAlert(`[Pochta Interseptori]: Tasdiqlash OTP kodi yuborildi. Kod: ${code}`);
                          showToast(`Tasdiqlash kodi: ${code}. Uni nusxalang va kiriting!`, 'success');
                        } else {
                          setSentCodeAlert(`[Mail Interceptor]: Authorization OTP dispatched safely. Code: ${code}`);
                          showToast(`Verification key sent! Code: ${code}`, 'success');
                        }
                      }}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Send size={12} /> {t.sendOtpBtn}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t.enterOtpCode}</span>
                        <input
                          type="text"
                          value={enteredVerificationCode}
                          onChange={(e) => setEnteredVerificationCode(e.target.value.trim())}
                          placeholder={t.enterOtpPlaceholder}
                          maxLength={6}
                          required
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg text-slate-200 text-xs py-2.5 px-3 text-center tracking-widest font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const code = Math.floor(100000 + Math.random() * 900000).toString();
                          setVerificationCode(code);
                          if (lang === 'uz') {
                            setSentCodeAlert(`[Pochta Interseptori]: Tasdiqlash yangi OTP kodi yuborildi. Kod: ${code}`);
                            showToast(`Yangi kod: ${code}. Uni nusxalang va kiriting!`, 'success');
                          } else {
                            setSentCodeAlert(`[Mail Interceptor]: Authorization OTP dispatched safely. Code: ${code}`);
                            showToast(`New verification key dispatched! Code: ${code}`, 'success');
                          }
                        }}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer self-start"
                      >
                        {t.resendCode}
                      </button>
                    </div>
                  )}
                </div>

                <div className="px-6 py-3.5 bg-slate-950/60 border-t border-slate-800 flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsChangePasswordOpen(false)}
                    className="px-3.5 py-2 border border-slate-800 text-slate-400 hover:text-slate-100 rounded transition-colors cursor-pointer"
                  >
                    {lang === 'uz' ? 'Bekor qilish' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    disabled={enteredVerificationCode.length !== 6}
                    onClick={() => {
                      if (enteredVerificationCode === verificationCode) {
                        setPasswordChangeStep(2);
                        showToast(lang === 'uz' ? 'Pochta tasdiqlandi! Yangi parolni kiriting.' : 'Email verified successfully! Complete password change below.', 'success');
                      } else {
                        showToast(lang === 'uz' ? 'Noto\'g\'ri tasdiqlash kodi! Quti simulyatoridagi kodni tekshiring.' : 'Invalid verification code! Check simulator intercept alert.', 'error');
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded transition-colors cursor-pointer"
                  >
                    {t.verifyCodeBtn}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePasswordFormSubmit}>
                <div className="p-6 flex flex-col gap-3.5">
                  <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-lg p-3 text-xs text-emerald-400 flex items-center gap-2 mb-1 font-bold">
                    <CheckCircle size={15} /> {t.identityConfirmed}
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t.currMasterPass}</span>
                    <input
                      type={showFormPasswords ? 'text' : 'password'}
                      value={currPassword}
                      onChange={(e) => setCurrPassword(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg text-slate-200 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 font-sans"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t.newMasterPass}</span>
                    <input
                      type={showFormPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t.minChars}
                      required
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg text-slate-200 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 font-sans"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t.repNewPass}</span>
                    <input
                      type={showFormPasswords ? 'text' : 'password'}
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg text-slate-200 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 font-sans"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      id="show-settings-form-pws"
                      checked={showFormPasswords}
                      onChange={() => setShowFormPasswords(!showFormPasswords)}
                      className="rounded bg-slate-900 border-slate-800 text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer h-3.5 w-3.5"
                    />
                    <label htmlFor="show-settings-form-pws" className="text-[11px] text-slate-400 font-medium cursor-pointer">
                      {t.displayChars}
                    </label>
                  </div>
                </div>

                <div className="px-6 py-3.5 bg-slate-950/60 border-t border-slate-800 flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsChangePasswordOpen(false)}
                    className="px-3.5 py-2 border border-slate-800 text-slate-400 hover:text-slate-100 rounded transition-colors cursor-pointer"
                  >
                    {lang === 'uz' ? 'Bekor qilish' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded transition-colors cursor-pointer"
                  >
                    {lang === 'uz' ? 'Parolni o\'zgartirish' : 'Change Code'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
