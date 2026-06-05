import React, { useState, useEffect, useRef } from 'react';
import { CredentialType, TabType, CATEGORIES, ActivityLogEntry } from './types';
import { encryptData, decryptData } from './crypto';
import { Toast, ToastMessage } from './components/Toast';
import { LockScreen } from './components/LockScreen';
import { Sidebar } from './components/Sidebar';
import { VaultView } from './components/VaultView';
import { SecurityView } from './components/SecurityView';
import { SettingsSettingsSubTabs } from './components/SettingsView';
import { CredentialDrawer } from './components/CredentialDrawer';
import { ActivityLogView } from './components/ActivityLogView';
import { Menu, Lock } from 'lucide-react';
import { LanguageType, translations } from './translations';
import { generateUUID } from './utils';


export default function App() {
  // System lock & authentication
  const [isLocked, setIsLocked] = useState(true);
  const [masterPassword, setMasterPassword] = useState('');
  const [credentials, setCredentials] = useState<CredentialType[]>([]);
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<TabType>('vault');
  const [selectedVault, setSelectedVault] = useState('Default Vault');
  const [vaultList, setVaultList] = useState<string[]>(['Default Vault']);
  
  // Querying & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Theme state: default to beautiful eye-safe dark theme
  const [isLightTheme, setIsLightTheme] = useState(false);
  
  // Language state loaded from localstorage or default to 'uz'
  const [lang, setLang] = useState<LanguageType>(() => {
    const saved = localStorage.getItem('aegis_lang');
    return (saved === 'en' || saved === 'uz') ? saved : 'uz';
  });

  const handleToggleLang = (val: LanguageType) => {
    setLang(val);
    localStorage.setItem('aegis_lang', val);
    showToast(val === 'uz' ? "Tizim tili O'zbekchaga o'zgartirildi." : "System language changed to English.", 'info');
  };

  
  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editCredential, setEditCredential] = useState<CredentialType | null>(null);

  // Toast status lists
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Profile customization states loaded per-vault
  const [profileName, setProfileName] = useState('abdumalik');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Safety device timeouts: default 5 minutes
  const [autoLockTimeout, setAutoLockTimeout] = useState(300000);
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [lockCountdown, setLockCountdown] = useState(300);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getVaultStorageKey = (name: string) => `aegis_vault_secure_store_${name.replace(/\s+/g, '_')}`;

  // Toast system helper
  const showToast = (text: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const freshToast: ToastMessage = {
      id: generateUUID(),
      text,
      type
    };
    setToasts((prev) => [...prev, freshToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Activity Log system helper
  const logActivity = (action: string, title: string, subtitle: string) => {
    const newEntry: ActivityLogEntry = {
      id: generateUUID(),
      action,
      title,
      subtitle,
      timestamp: new Date().toISOString()
    };
    setActivityLogs((prev) => {
      const updated = [newEntry, ...prev];
      localStorage.setItem(`aegis_activity_log_${selectedVault.replace(/\s+/g, '_')}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Initial loads: load list of silos and client theme
  useEffect(() => {
    const list = localStorage.getItem('aegis_vaults_list');
    if (list) {
      try {
        const parsed = JSON.parse(list);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVaultList(parsed);
          setSelectedVault(parsed[0]);
        }
      } catch (err) {
        console.error('Failed to parse vault list', err);
      }
    }

    const savedTheme = localStorage.getItem('aegis_theme');
    if (savedTheme === 'light') {
      setIsLightTheme(true);
      document.body.classList.add('light-theme');
    } else {
      setIsLightTheme(false);
      document.body.classList.remove('light-theme');
    }

    const savedTimeout = localStorage.getItem('aegis_autolock_val');
    if (savedTimeout) {
      setAutoLockTimeout(Number(savedTimeout));
    }
  }, []);

  // Sync profile options and activities whenever active vault silo changes
  useEffect(() => {
    const vaultKey = selectedVault.replace(/\s+/g, '_');
    
    // Load custom Name
    const savedName = localStorage.getItem(`aegis_user_name_${vaultKey}`);
    setProfileName(savedName || 'abdumalik');

    // Load custom Photo
    const savedPhoto = localStorage.getItem(`aegis_user_photo_${vaultKey}`);
    setProfilePhoto(savedPhoto);

    // Load custom Logs
    const savedLogs = localStorage.getItem(`aegis_activity_log_${vaultKey}`);
    if (savedLogs) {
      try {
        setActivityLogs(JSON.parse(savedLogs));
      } catch {
        setActivityLogs([]);
      }
    } else {
      setActivityLogs([]);
    }
  }, [selectedVault]);

  // Secure client-side vault saver (re-encrypts standard and recovery stores)
  const saveVaultSecurely = async (updatedCreds: CredentialType[], passwordValue = masterPassword) => {
    if (!passwordValue) return;
    try {
      const plaintext = JSON.stringify(updatedCreds);
      
      // Save standard master password encrypted block
      const encrypted = await encryptData(plaintext, passwordValue);
      const vaultKey = getVaultStorageKey(selectedVault);
      localStorage.setItem(vaultKey, JSON.stringify(encrypted));

      // Save credentials block encrypted with the registered email also as fallback recovery key
      const emailStorageKey = `aegis_vault_email_${selectedVault.replace(/\s+/g, '_')}`;
      const savedEmail = localStorage.getItem(emailStorageKey);
      if (savedEmail) {
        const recoveryEncrypted = await encryptData(plaintext, savedEmail);
        const recoveryStoreKey = `aegis_vault_recovery_store_${selectedVault.replace(/\s+/g, '_')}`;
        localStorage.setItem(recoveryStoreKey, JSON.stringify(recoveryEncrypted));
      }

      setCredentials(updatedCreds);
    } catch (err) {
      console.error(err);
      showToast('Crucial error: failed to encrypt and write database securely.', 'error');
    }
  };

  // Login click action: tries to decrypt locally
  const handleUnlock = async (passwordValue: string, vaultValue: string): Promise<boolean> => {
    const vaultKey = getVaultStorageKey(vaultValue);
    const stored = localStorage.getItem(vaultKey);
    if (!stored) return false;

    try {
      const encryptedPayload = JSON.parse(stored);
      const decryptedText = await decryptData(encryptedPayload, passwordValue);
      const parsedCreds = JSON.parse(decryptedText);
      
      setCredentials(parsedCreds);
      setMasterPassword(passwordValue);
      setIsLocked(false);
      setSelectedVault(vaultValue);
      return true;
    } catch (err) {
      console.error('Decryption fail', err);
      return false;
    }
  };

  // Initialization: registers a brand new empty database
  const handleInitialize = async (passwordValue: string, vaultValue: string, emailValue: string) => {
    try {
      const emptyList: CredentialType[] = [];
      const plaintext = JSON.stringify(emptyList);
      
      // Save standard encrypted payload
      const encrypted = await encryptData(plaintext, passwordValue);
      const vaultKey = getVaultStorageKey(vaultValue);
      localStorage.setItem(vaultKey, JSON.stringify(encrypted));

      // Save email recovery encrypted backup
      const recoveryEncrypted = await encryptData(plaintext, emailValue);
      const recoveryStoreKey = `aegis_vault_recovery_store_${vaultValue.replace(/\s+/g, '_')}`;
      localStorage.setItem(recoveryStoreKey, JSON.stringify(recoveryEncrypted));

      // Save email configuration address
      localStorage.setItem(`aegis_vault_email_${vaultValue.replace(/\s+/g, '_')}`, emailValue);

      // Save custom Initial profile Name
      localStorage.setItem(`aegis_user_name_${vaultValue.replace(/\s+/g, '_')}`, 'abdumalik');

      // Initialize brand new Activity Logs
      const freshLogs: ActivityLogEntry[] = [
        {
          id: generateUUID(),
          action: 'import_backup',
          title: 'You initialized a new vault',
          subtitle: `Created vault silo directory "${vaultValue}" successfully.`,
          timestamp: new Date().toISOString()
        }
      ];
      localStorage.setItem(`aegis_activity_log_${vaultValue.replace(/\s+/g, '_')}`, JSON.stringify(freshLogs));

      setCredentials(emptyList);
      setMasterPassword(passwordValue);
      setIsLocked(false);
      setSelectedVault(vaultValue);
      setProfileName('abdumalik');
      setProfilePhoto(null);
      setActivityLogs(freshLogs);
    } catch (err) {
      console.error(err);
      showToast('Failed to initialize local key block.', 'error');
    }
  };

  // Securely lock the app and wipe sensitive state keys
  const handleLock = () => {
    setMasterPassword('');
    setCredentials([]);
    setIsLocked(true);
    setActiveTab('vault');
    setSearchQuery('');
    setSelectedCategory('All');
    showToast('Vault silo locked. Key memory purged.', 'info');
  };

  // Auto-lock devices trackers
  const resetAutoLockTimer = () => {
    if (isLocked) return;
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    const seconds = Math.floor(autoLockTimeout / 1000);
    setLockCountdown(seconds);
    countdownIntervalRef.current = setInterval(() => {
      setLockCountdown(prev => {
        if (prev <= 1) { clearInterval(countdownIntervalRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
    lockTimerRef.current = setTimeout(() => {
      handleLock();
    }, autoLockTimeout);
  };

  useEffect(() => {
    resetAutoLockTimer();
    return () => {
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    };
  }, [isLocked, autoLockTimeout]);

  // Keep tracking user engagement
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    const resetTimer = () => resetAutoLockTimer();

    events.forEach((evt) => {
      document.addEventListener(evt, resetTimer, true);
    });

    return () => {
      events.forEach((evt) => {
        document.removeEventListener(evt, resetTimer, true);
      });
    };
  }, [isLocked, autoLockTimeout]);

  // Save auto-lock custom timeout
  const handleSetAutoLockTimeout = (ms: number) => {
    setAutoLockTimeout(ms);
    localStorage.setItem('aegis_autolock_val', String(ms));
    showToast(`Idle auto-lock set to ${ms / 60000} minute(s).`, 'info');
  };

  // Save/Edit triggers inside slide-overs
  const handleSaveCredential = async (credData: Omit<CredentialType, 'updatedAt'>) => {
    let updated: CredentialType[];
    const isEdit = credentials.some((c) => c.id === credData.id);

    const completeRecord: CredentialType = {
      ...credData,
      updatedAt: new Date().toISOString()
    };

    if (isEdit) {
      updated = credentials.map((c) => (c.id === credData.id ? completeRecord : c));
      showToast('Service credentials updated successfully.', 'success');
      logActivity('update_cred', 'You updated password', credData.service);
    } else {
      // Duplicate checks: warn if service & user email is identical
      const isDuplicate = credentials.some(
        (c) => c.service.toLowerCase() === credData.service.toLowerCase() &&
               c.username.toLowerCase() === credData.username.toLowerCase()
      );
      if (isDuplicate) {
        showToast('Credential record already exists for this login details!', 'warning');
        return;
      }
      updated = [...credentials, completeRecord];
      showToast('Record saved successfully.', 'success');
      logActivity('create_cred', 'You added a new credential', credData.service);
    }

    await saveVaultSecurely(updated);
    setIsDrawerOpen(false);
    setEditCredential(null);
  };

  // Record deletions
  const handleDeleteCredential = async (id: string) => {
    const targetCred = credentials.find((c) => c.id === id);
    const serviceName = targetCred ? targetCred.service : 'Unknown';
    
    const updated = credentials.filter((c) => c.id !== id);
    await saveVaultSecurely(updated);
    showToast('Credential removed securely from index.', 'warning');
    logActivity('delete_cred', 'You removed a credential', serviceName);
  };

  // Master update keys transitions (re-encrypting the list with a new password)
  const handleChangeMasterPassword = async (current: string, next: string): Promise<boolean> => {
    if (current !== masterPassword) return false;
    try {
      await saveVaultSecurely(credentials, next);
      setMasterPassword(next);
      logActivity('change_password', 'You changed master password', 'Master key signature updated.');
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Export encrypted backup ZIP block file
  const handleExportBackup = () => {
    const key = getVaultStorageKey(selectedVault);
    const stored = localStorage.getItem(key);
    if (!stored) {
      showToast('No database to export!', 'error');
      return;
    }

    const filename = `PulVault_${selectedVault.replace(/\s+/g, '_')}_SecureBackup.json`;
    const blob = new Blob([stored], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const element = document.createElement('a');
    element.href = url;
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(url);

    showToast('Encrypted JSON backup file downloaded successfully!', 'success');
    logActivity('export_backup', 'You exported vault backup', filename);
  };

  // Import dynamic backups file parser
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const textStr = event.target?.result as string;
        const parsed = JSON.parse(textStr);
        
        if (parsed.ciphertext && parsed.salt && parsed.iv) {
          const key = getVaultStorageKey(selectedVault);
          localStorage.setItem(key, textStr);
          showToast('Backup database file written. Re-authenticating...', 'info');
          logActivity('import_backup', 'You imported vault backup', file.name);
          setTimeout(() => {
            handleLock();
          }, 1200);
        } else {
          showToast('Invalid PulVault backup schema!', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('JSON parse failed. Verify backup file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Wipe unlocked silos permanently
  const handleWipeVault = (name: string) => {
    const key = getVaultStorageKey(name);
    localStorage.removeItem(key);

    const vaultKey = name.replace(/\s+/g, '_');
    localStorage.removeItem(`aegis_vault_email_${vaultKey}`);
    localStorage.removeItem(`aegis_vault_recovery_store_${vaultKey}`);
    localStorage.removeItem(`aegis_user_name_${vaultKey}`);
    localStorage.removeItem(`aegis_user_photo_${vaultKey}`);
    localStorage.removeItem(`aegis_activity_log_${vaultKey}`);

    if (name === 'Default Vault') {
      showToast('Vault wiped out. Refreshing session...', 'warning');
      setTimeout(() => {
        handleLock();
      }, 1000);
    } else {
      const updatedList = vaultList.filter((v) => v !== name);
      setVaultList(updatedList);
      localStorage.setItem('aegis_vaults_list', JSON.stringify(updatedList));
      setSelectedVault('Default Vault');
      showToast(`Vault "${name.replace(/_/g, ' ')}" erased from local memory.`, 'warning');
      handleLock();
    }
  };

  // Save profile username and avatar
  const handleSaveProfile = (nameVal: string, photoVal: string | null) => {
    const vaultKey = selectedVault.replace(/\s+/g, '_');
    localStorage.setItem(`aegis_user_name_${vaultKey}`, nameVal);
    setProfileName(nameVal);

    if (photoVal) {
      localStorage.setItem(`aegis_user_photo_${vaultKey}`, photoVal);
      setProfilePhoto(photoVal);
    } else {
      localStorage.removeItem(`aegis_user_photo_${vaultKey}`);
      setProfilePhoto(null);
    }

    showToast('Profile credentials saved and cataloged successfully.', 'success');
  };

  // Theme switcher
  const handleToggleTheme = () => {
    const targetState = !isLightTheme;
    setIsLightTheme(targetState);
    if (targetState) {
      document.body.classList.add('light-theme');
      localStorage.setItem('aegis_theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('aegis_theme', 'dark');
    }
  };

  const handleEditTrigger = (cred: CredentialType) => {
    setEditCredential(cred);
    setIsDrawerOpen(true);
  };

  const handleAddTrigger = () => {
    setEditCredential(null);
    setIsDrawerOpen(true);
  };

  return (
    <div className={`min-h-screen w-full flex select-none transition-colors duration-300 ${isLightTheme ? 'bg-slate-50 text-slate-800' : 'bg-[#030712] text-slate-100'}`}>
      
      {/* Background radial lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className={`absolute top-0 left-0 w-full h-full ${
          isLightTheme 
            ? 'bg-[radial-gradient(circle_at_10%_20%,rgba(79,70,229,0.03)_0%,transparent_40%),radial-gradient(circle_at_90%_80%,rgba(6,182,212,0.03)_0%,transparent_40%)]' 
            : 'bg-[radial-gradient(circle_at_10%_20%,rgba(99,102,241,0.05)_0%,transparent_40%),radial-gradient(circle_at_90%_80%,rgba(6,182,212,0.05)_0%,transparent_40%)]'
        }`} />
      </div>

      <Toast toasts={toasts} onRemove={removeToast} />

      {isLocked ? (
        /* LOCK SCREEN WITH FORM VALIDATION */
        <div className="w-full relative z-10 select-none">
          <LockScreen
            onUnlock={handleUnlock}
            onInitialize={handleInitialize}
            vaultList={vaultList}
            setVaultList={setVaultList}
            selectedVault={selectedVault}
            setSelectedVault={setSelectedVault}
            showToast={showToast}
            onWipeVault={handleWipeVault}
          />
        </div>
      ) : (
        /* MASTER SECURITY WORKSPACE PANEL */
        <div className="w-full flex h-screen overflow-hidden relative z-10">
          
          {/* Desktop Sidebar (visible on lg+) */}
          <div className="hidden lg:block h-full flex-shrink-0">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              selectedVault={selectedVault}
              onLock={handleLock}
              isLightTheme={isLightTheme}
              onToggleTheme={handleToggleTheme}
              profileName={profileName}
              profilePhoto={profilePhoto}
              lang={lang}
              onToggleLang={handleToggleLang}
              lockCountdown={lockCountdown}
            />
          </div>

          {/* Mobile Sidebar BackDrop and Slide-out drawer */}
          {isMobileSidebarOpen && (
            <div className="fixed inset-0 z-50 flex lg:hidden">
              {/* Overlay shadow backdrop */}
              <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              {/* Sidebar content slide */}
              <div className="relative z-10 w-64 h-full animate-in slide-in-from-left duration-200">
                <Sidebar
                  activeTab={activeTab}
                  setActiveTab={(tab) => {
                    setActiveTab(tab);
                    setIsMobileSidebarOpen(false);
                  }}
                  selectedVault={selectedVault}
                  onLock={() => {
                    handleLock();
                    setIsMobileSidebarOpen(false);
                  }}
                  isLightTheme={isLightTheme}
                  onToggleTheme={handleToggleTheme}
                  profileName={profileName}
                  profilePhoto={profilePhoto}
                  lang={lang}
                  onToggleLang={handleToggleLang}
                  lockCountdown={lockCountdown}
                />
              </div>
            </div>
          )}

          <main className="flex-grow flex flex-col h-full overflow-hidden">
            
            {/* Table layout header info - upgraded with top-right profile relocate */}
            <header className={`h-20 border-b flex-shrink-0 flex items-center justify-between px-6 lg:px-8 select-none ${
              isLightTheme ? 'border-slate-200 bg-white/40 backdrop-blur-md' : 'border-slate-800/85 bg-[#090d16]/30 backdrop-blur-md'
            }`}>
              <div className="flex items-center gap-3.5">
                {/* Mobile Hamburger menu */}
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className={`p-2 rounded-lg lg:hidden cursor-pointer transition-colors ${
                    isLightTheme ? 'hover:bg-slate-200/50 text-slate-800' : 'hover:bg-slate-850/50 text-slate-200'
                  }`}
                  aria-label="Toggle Navigation Sidebar"
                >
                  <Menu size={20} />
                </button>
                <div className="flex flex-col">
                  <span className="text-slate-550 text-[10px] uppercase font-bold tracking-widest font-sans leading-none">{translations[lang].securityPortalUnlocked}</span>
                  <span className="text-xl font-bold font-sans text-slate-100 mt-1">
                    {activeTab === 'vault' ? translations[lang].vault : activeTab === 'audit' ? translations[lang].security : activeTab === 'activity' ? translations[lang].activityLog : translations[lang].managementConsole}
                  </span>
                </div>
              </div>
              
              {/* Relocated Photo & Name Header - with custom interactive Profile Dropdown featuring Logout and Lock/Block button right next to it */}
              <div className="flex items-center gap-3">
                
                {/* Secure Lockout / Block Button next to the green status */}
                <button
                  onClick={handleLock}
                  title={translations[lang].secureLockout}
                  className="w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all duration-150 select-none border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 hover:text-rose-450 shadow-md shadow-rose-500/5 flex-shrink-0"
                >
                  <Lock size={15} className="fill-rose-500/5 text-rose-500" />
                </button>

                <div className="relative">
                  <div 
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className={`flex items-center gap-3 pl-3.5 pr-2.5 py-1.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isLightTheme ? 'border-slate-250 hover:bg-slate-200/40' : 'border-slate-800/85 hover:bg-slate-850/50'
                    }`}
                  >
                    <div className="flex flex-col items-end text-right hidden sm:flex">
                      <span className="text-xs font-bold text-slate-200 font-sans leading-none">{profileName}</span>
                      <div className="flex items-center gap-1.5 mt-1.5 font-sans">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] text-emerald-500 font-extrabold uppercase tracking-wider leading-none">
                          {translations[lang].unlockedAdmin}
                        </span>
                      </div>
                    </div>

                    {profilePhoto ? (
                      <img 
                        src={profilePhoto} 
                        alt="profile" 
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full border border-indigo-500/35 object-cover shadow shadow-indigo-600/5"
                      />
                    ) : (
                      <div className="w-9 h-9 bg-indigo-600 text-white font-extrabold rounded-full flex items-center justify-center text-xs shadow-md">
                        {profileName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {isProfileMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />
                      <div className={`absolute right-0 mt-2 w-48 rounded-xl border shadow-2xl z-50 py-1.5 animate-in fade-in duration-100 ${
                        isLightTheme 
                          ? 'bg-white border-slate-200 text-slate-800' 
                          : 'bg-slate-900 border-slate-800 text-slate-100'
                      }`}>
                        <button
                          onClick={() => {
                            setActiveTab('settings');
                            setIsProfileMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                            isLightTheme ? 'hover:bg-slate-100' : 'hover:bg-slate-800/60'
                          }`}
                        >
                          {translations[lang].settings}
                        </button>
                        <button
                          onClick={() => {
                            handleLock();
                            setIsProfileMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-bold text-rose-500 flex items-center gap-2.5 border-t transition-colors cursor-pointer ${
                            isLightTheme ? 'border-slate-100 hover:bg-rose-50' : 'border-slate-800/40 hover:bg-rose-950/20'
                          }`}
                        >
                          {translations[lang].secureLockout}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </header>

            {/* Scrollable subview workspace */}
            <div className="flex-grow overflow-y-auto px-8 py-6">
              {activeTab === 'vault' && (
                <VaultView
                  credentials={credentials}
                  onEdit={handleEditTrigger}
                  onDelete={handleDeleteCredential}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  onOpenDrawer={handleAddTrigger}
                  showToast={showToast}
                  categories={CATEGORIES}
                  lang={lang}
                  onImport={handleImportBackup}
                />
              )}

              {activeTab === 'audit' && (
                <SecurityView
                  credentials={credentials}
                  onEdit={handleEditTrigger}
                  showToast={showToast}
                  lang={lang}
                />
              )}

              {activeTab === 'activity' && (

               <ActivityLogView logs={activityLogs} lang={lang} />

                <ActivityLogView logs={activityLogs} lang={lang} />

              )}

              {activeTab === 'settings' && (
                <SettingsSettingsSubTabs
                  selectedVault={selectedVault}
                  credentials={credentials}
                  autoLockTimeout={autoLockTimeout}
                  onSetAutoLockTimeout={handleSetAutoLockTimeout}
                  onWipeVault={handleWipeVault}
                  onExport={handleExportBackup}
                  onImport={handleImportBackup}
                  onChangeMasterPassword={handleChangeMasterPassword}
                  showToast={showToast}
                  profileName={profileName}
                  profilePhoto={profilePhoto}
                  onSaveProfile={handleSaveProfile}
                  lang={lang}
                />
              )}
            </div>

          </main>

          {/* ADD/EDIT CREDENTIAL DRAWER SLIDE-OVER */}
          <CredentialDrawer
            isOpen={isDrawerOpen}
            onClose={() => {
              setIsDrawerOpen(false);
              setEditCredential(null);
            }}
            onSave={handleSaveCredential}
            editCredential={editCredential}
            credentialsList={credentials}
            showToast={showToast}
          />

        </div>
      )}

    </div>
  );
}
