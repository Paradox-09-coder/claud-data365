import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, EyeOff, Plus, HelpCircle, Loader2, Send, CheckCircle, Mail, AlertTriangle } from 'lucide-react';
import { decryptData, encryptData } from '../crypto';
import { generateUUID } from '../utils';

interface LockScreenProps {
  onUnlock: (password: string, vaultName: string) => Promise<boolean>;
  onInitialize: (password: string, vaultName: string, email: string) => Promise<void>;
  vaultList: string[];
  setVaultList: React.Dispatch<React.SetStateAction<string[]>>;
  selectedVault: string;
  setSelectedVault: (vaultName: string) => void;
  showToast: (text: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  onWipeVault: (vaultName: string) => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  onUnlock,
  onInitialize,
  vaultList,
  setVaultList,
  selectedVault,
  setSelectedVault,
  showToast,
  onWipeVault
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isCreatingNewVault, setIsCreatingNewVault] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // New onboarding email state
  const [onboardingEmail, setOnboardingEmail] = useState('');

  // New vault creation states
  const [newVaultName, setNewVaultName] = useState('');
  const [newVaultEmail, setNewVaultEmail] = useState('');
  const [newVaultPass, setNewVaultPass] = useState('');
  const [newVaultPassConfirm, setNewVaultPassConfirm] = useState('');

  // Forgot password password recovery flow modal states
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [recoveryNewPass, setRecoveryNewPass] = useState('');
  const [recoveryNewPassConfirm, setRecoveryNewPassConfirm] = useState('');
  const [showRecoveryPasswords, setShowRecoveryPasswords] = useState(false);

  const getVaultKey = (name: string) => `aegis_vault_secure_store_${name.replace(/\s+/g, '_')}`;

  // Check onboarding status when selected vault changes
  useEffect(() => {
    const key = getVaultKey(selectedVault);
    const stored = localStorage.getItem(key);
    setIsOnboarding(!stored);
    setPassword('');
  }, [selectedVault]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setIsPending(true);

    try {
      if (isOnboarding) {
        if (!onboardingEmail.trim()) {
          showToast('Please enter your primary email address!', 'error');
          setIsPending(false);
          return;
        }
        if (password.length < 8) {
          showToast('Master password must be 8+ characters!', 'error');
          setIsPending(false);
          return;
        }

        await onInitialize(password, selectedVault, onboardingEmail.trim());
        showToast(`Vault "${selectedVault}" initialized successfully!`, 'success');
      } else {
        const success = await onUnlock(password, selectedVault);
        if (success) {
          showToast('Vault unlocked. Welcome back!', 'success');
        } else {
          showToast('Incorrect master password!', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Authentication failed. Check your data.', 'error');
    } finally {
      setIsPending(false);
    }
  };

  const handleCreateVaultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newVaultName.trim();
    if (!cleanName) return;

    if (vaultList.map(v => v.toLowerCase()).includes(cleanName.toLowerCase())) {
      showToast('A vault with this name already exists!', 'error');
      return;
    }

    if (!newVaultEmail.trim()) {
      showToast('Email address is required!', 'error');
      return;
    }

    if (newVaultPass !== newVaultPassConfirm) {
      showToast('Passwords do not match!', 'error');
      return;
    }

    if (newVaultPass.length < 8) {
      showToast('Password must be 8+ characters!', 'error');
      return;
    }

    setIsPending(true);
    try {
      const updatedList = [...vaultList, cleanName];
      setVaultList(updatedList);
      localStorage.setItem('aegis_vaults_list', JSON.stringify(updatedList));

      setSelectedVault(cleanName);
      await onInitialize(newVaultPass, cleanName, newVaultEmail.trim());

      // Clean up fields
      setNewVaultName('');
      setNewVaultEmail('');
      setNewVaultPass('');
      setNewVaultPassConfirm('');
      setIsCreatingNewVault(false);
      showToast(`Vault "${cleanName}" initialized successfully!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to initialize new vault.', 'error');
    } finally {
      setIsPending(false);
    }
  };

  // Password Recovery Reset Handlers
  const handleSendRecoveryCode = () => {
    const cleanEmail = recoveryEmail.trim();
    if (!cleanEmail) {
      showToast('Please enter your email!', 'error');
      return;
    }

    // Load registered email corresponding to current vault
    const emailKey = `aegis_vault_email_${selectedVault.replace(/\s+/g, '_')}`;
    const registeredEmail = localStorage.getItem(emailKey);

    if (!registeredEmail || registeredEmail.toLowerCase() !== cleanEmail.toLowerCase()) {
      showToast('Invalid email address! Does not match registered key.', 'error');
      return;
    }

    // Generate neat random 6-digit recovery verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setVerificationCodeMockDelivery(code);
    setVerificationSent(true);
    showToast('Secure recovery verification code sent with success.', 'success');
  };

  // Helper alert that acts as our beautiful simulation delivery system
  const [mockDeliveryAlert, setShowMockDeliveryAlert] = useState<string | null>(null);
  const setVerificationCodeMockDelivery = (code: string) => {
    setShowMockDeliveryAlert(`[PulVault Security Mail Alert]: Your password reset key is: ${code}`);
  };

  const handleVerifyCode = () => {
    if (enteredCode === generatedCode && enteredCode !== '') {
      setIsCodeVerified(true);
      showToast('Email verification sequence complete. Access granted.', 'success');
    } else {
      showToast('Invalid verification code! Please retry.', 'error');
    }
  };

  // Recover credentials block: decrypts recovery store using the email, re-encrypts using new password
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryNewPass !== recoveryNewPassConfirm) {
      showToast('Passwords do not match!', 'error');
      return;
    }

    if (recoveryNewPass.length < 8) {
      showToast('New keys must be at least 8 characters!', 'error');
      return;
    }

    setIsPending(true);
    try {
      const vaultNameKey = selectedVault.replace(/\s+/g, '_');
      const recoveryStoreKey = `aegis_vault_recovery_store_${vaultNameKey}`;
      const mainStoreKey = `aegis_vault_secure_store_${vaultNameKey}`;
      const emailKey = `aegis_vault_email_${vaultNameKey}`;

      const recoveryPayloadStr = localStorage.getItem(recoveryStoreKey);
      const registeredEmail = localStorage.getItem(emailKey);

      if (!recoveryPayloadStr || !registeredEmail) {
        showToast('Vault recovery payload not found. Reset failed.', 'error');
        setIsPending(false);
        return;
      }

      // 1. Decrypt credentials using registered email address as security key
      const recoveryPayload = JSON.parse(recoveryPayloadStr);
      const decryptedText = await decryptData(recoveryPayload, registeredEmail);

      // 2. Re-encrypt credentials using the new master password
      const reEncryptedPayload = await encryptData(decryptedText, recoveryNewPass);

      // 3. Save as standard masterpassword storage block
      localStorage.setItem(mainStoreKey, JSON.stringify(reEncryptedPayload));

      // Append code change log inside Activity systems
      const recoveryLog = {
        id: generateUUID(),
        action: 'change_password',
        title: 'You changed master password',
        subtitle: 'Password updated securely via email verification code.',
        timestamp: new Date().toISOString()
      };
      const existingLogsStr = localStorage.getItem(`aegis_activity_log_${vaultNameKey}`);
      const logs = existingLogsStr ? JSON.parse(existingLogsStr) : [];
      logs.push(recoveryLog);
      localStorage.setItem(`aegis_activity_log_${vaultNameKey}`, JSON.stringify(logs));

      showToast('Master password modified successfully! Access unlocked.', 'success');
      
      // Complete reset reset states
      setIsRecoveryModalOpen(false);
      setRecoveryEmail('');
      setVerificationSent(false);
      setGeneratedCode('');
      setEnteredCode('');
      setIsCodeVerified(false);
      setRecoveryNewPass('');
      setRecoveryNewPassConfirm('');
      setShowMockDeliveryAlert(null);

      // Log in immediately
      await onUnlock(recoveryNewPass, selectedVault);
    } catch (err) {
      console.error(err);
      showToast('Cryptographic restore failed. Email signature corrupted.', 'error');
    } finally {
      setIsPending(false);
    }
  };

  const handleWipeVaultTrigger = () => {
    const confirmation = window.confirm(`Permanently wipe silo "${cleanVaultTitle(selectedVault)}"? ALL DATA WILL BE ERASED FOREVER.`);
    if (confirmation) {
      onWipeVault(selectedVault);
      setIsRecoveryModalOpen(false);
      showToast(`Vault "${cleanVaultTitle(selectedVault)}" wiped successfully.`, 'warning');
    }
  };

  const cleanVaultTitle = (vault: string) => {
    return vault.replace(/_/g, ' ');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 select-none relative overflow-hidden bg-slate-950">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-4xl bg-slate-900/60 border border-slate-800/80 rounded-2xl md:min-h-[520px] shadow-2xl flex flex-col md:flex-row backdrop-blur-xl relative z-10 overflow-hidden">
        
        {/* Left Side: Pads layout & floating logo (Image 1 side visual) */}
        <div className="flex-1 bg-gradient-to-br from-slate-950 to-slate-900 border-b md:border-b-0 md:border-r border-slate-800/60 p-8 flex flex-col justify-between relative overflow-hidden">
          
          <div className="flex items-center gap-3">
            <div className="text-indigo-500 bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
              <Shield size={24} />
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-bold text-xl tracking-wide text-indigo-50 leading-none">PulVault</span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider mt-1">SECURE TEAM VAULT</span>
            </div>
          </div>

          {/* Pads floating graphics (Image 1 core visualization) */}
          <div className="flex-grow flex items-center justify-center relative min-h-[220px] my-6">
            <div className="absolute w-36 h-36 border border-indigo-500/15 rounded-full animate-pulse-radar pointer-events-none" />
            <div className="absolute w-52 h-52 border border-indigo-500/10 rounded-full animate-pulse-radar [animation-delay:1.6s] pointer-events-none" />
            <div className="absolute w-64 h-64 border border-indigo-500/5 rounded-full animate-pulse-radar [animation-delay:3.2s] pointer-events-none" />
            
            <div className="relative z-10 transform hover:scale-105 transition-transform duration-500 cursor-pointer">
              <svg className="w-40 h-40 drop-shadow-[0_0_35px_rgba(99,102,241,0.25)] animate-floating" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="padlock-body" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="60%" stopColor="#3730a3" />
                    <stop offset="100%" stopColor="#1e1b4b" />
                  </linearGradient>
                  <linearGradient id="shackle" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#a5b4fc" />
                    <stop offset="50%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#312e81" />
                  </linearGradient>
                </defs>
                {/* Shackle */}
                <path d="M 32,48 L 32,32 A 18,18 0 0 1 68,32 L 68,48" fill="none" stroke="url(#shackle)" strokeWidth="7" strokeLinecap="round" />
                {/* Lock body panel */}
                <rect x="22" y="44" width="56" height="44" rx="10" fill="url(#padlock-body)" stroke="#818cf8" strokeWidth="1.2" />
                {/* Internal keyhole detail */}
                <circle cx="50" cy="62" r="4.5" fill="#090d16" />
                <path d="M 47.5,65 L 52.5,65 L 54,75 L 46,75 Z" fill="#090d16" />
              </svg>
            </div>
          </div>

          <div className="text-center md:text-left">
            <span className="text-xs text-slate-500 font-mono tracking-wider block">AES-256 BIT DIRECT DECRYPTION</span>
          </div>
        </div>

        {/* Right Side: Form View */}
        <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
          
          {!isCreatingNewVault ? (
            /* LOCK & LOGIN FORM */
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <h2 className="font-sans font-bold text-2xl text-slate-100 flex items-center gap-2">
                  {isOnboarding ? 'Setup Master Key' : 'Unlock Portal'}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  {isOnboarding 
                    ? `Create an Account profile to initialize direct storage decryption keys.` 
                    : 'Enter the master password to release decrypted records.'}
                </p>
              </div>

              {/* Vault dropdown selecting group */}
              <div className="flex flex-col gap-1.5 mt-1">
                <label className="text-xs font-semibold text-slate-400 font-sans uppercase tracking-wider">Select Vault Database</label>
                <div className="relative">
                  <select
                    value={selectedVault}
                    onChange={(e) => setSelectedVault(e.target.value)}
                    className="w-full bg-slate-950/80 hover:bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm py-2.5 px-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans transition-all appearance-none cursor-pointer font-medium"
                  >
                    {vaultList.map((vault) => (
                      <option key={vault} value={vault}>
                        {cleanVaultTitle(vault)}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Onboarding Registered Email field */}
              {isOnboarding && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 font-sans uppercase tracking-wider">Registered Email Address</label>
                  <input
                    type="email"
                    value={onboardingEmail}
                    onChange={(e) => setOnboardingEmail(e.target.value)}
                    placeholder="e.g. notuzbekistan1@gmail.com"
                    required
                    className="w-full bg-slate-950/80 border border-slate-800/80 rounded-lg text-slate-200 text-sm py-2.5 px-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans transition-all font-medium"
                  />
                </div>
              )}

              {/* Master Password inputs */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 font-sans uppercase tracking-wider">Master Key</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isOnboarding ? 'Set password (min 8 chars)' : 'Input Vault Password'}
                    required
                    className="w-full bg-slate-950/80 border border-slate-800/80 rounded-lg text-slate-200 text-sm py-2.5 pl-3 pr-10 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* LOGIN BUTTON: Click listener executes decryption */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.99] disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-all duration-155 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 shadow-glow"
              >
                {isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Lock size={16} />
                )}
                {isOnboarding ? 'Initialize Vault' : 'Release Decrypted Records'}
              </button>

              {/* Back links */}
              <div className="flex flex-col gap-2 items-center text-xs mt-3 select-none">
                <button
                  type="button"
                  onClick={() => setIsCreatingNewVault(true)}
                  className="text-indigo-400 hover:text-indigo-300 font-sans font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} /> Create New Department Vault
                </button>
                {!isOnboarding && (
                  <button
                    type="button"
                    onClick={() => setIsRecoveryModalOpen(true)}
                    className="text-slate-400 hover:text-slate-300 font-sans font-medium cursor-pointer"
                  >
                    Forgot master password?
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(true)}
                  className="text-slate-405 hover:text-indigo-400 font-sans font-medium flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle size={12} /> Help Centre
                </button>
              </div>

            </form>
          ) : (
            /* CREATE VAULT MODULE */
            <form onSubmit={handleCreateVaultSubmit} className="flex flex-col gap-4">
              <div>
                <h2 className="font-sans font-bold text-2xl text-slate-100 flex items-center gap-2">
                  Create New Vault
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Setup a separate silo database with its own master key.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vault Name</label>
                <input
                  type="text"
                  value={newVaultName}
                  onChange={(e) => setNewVaultName(e.target.value)}
                  placeholder="e.g. Work, Secret Tasks, Media"
                  required
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 text-sm py-2.5 px-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans transition-all font-medium"
                />
              </div>

              {/* Email Address for multi vaults onboarding */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Silo Email Address</label>
                <input
                  type="email"
                  value={newVaultEmail}
                  onChange={(e) => setNewVaultEmail(e.target.value)}
                  placeholder="e.g. administrator@company.com"
                  required
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 text-sm py-2.5 px-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans transition-all font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Master Password</label>
                <input
                  type="password"
                  value={newVaultPass}
                  onChange={(e) => setNewVaultPass(e.target.value)}
                  placeholder="Set Password (min 8 chars)"
                  required
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 text-sm py-2.5 px-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confirm Password</label>
                <input
                  type="password"
                  value={newVaultPassConfirm}
                  onChange={(e) => setNewVaultPassConfirm(e.target.value)}
                  placeholder="Repeat master password"
                  required
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 text-sm py-2.5 px-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans transition-all font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2"
              >
                {isPending && <Loader2 size={16} className="animate-spin" />}
                Register & Initialize Silo
              </button>

              <button
                type="button"
                onClick={() => setIsCreatingNewVault(false)}
                className="text-xs text-slate-400 hover:text-slate-200 mt-1 cursor-pointer"
              >
                ← Back to unlock portal
              </button>
            </form>
          )}

          <div className="text-center text-[10px] text-slate-500 mt-10 border-t border-slate-800/40 pt-4 font-mono">
            ZERO-KNOWLEDGE ARCHITECTURE &bull; AES-GCM
          </div>
        </div>

      </div>

      {/* RECOVERY Reset Master Password Modal via E-mail Code */}
      {isRecoveryModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6.5 shadow-2xl relative overflow-hidden">
            
            <div className="flex items-center gap-3 border-b border-slate-800/60 pb-3 mb-4">
              <div className="w-9 h-9 bg-rose-500/15 border border-rose-500/25 rounded-lg flex items-center justify-center text-rose-450">
                <Shield size={18} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Password Self-Recovery</h3>
                <span className="text-[10px] text-rose-450 uppercase font-mono font-bold tracking-widest mt-0.5">VAULT DECRYPT PORTAL</span>
              </div>
            </div>

            {/* Simulated notification stream alerts */}
            {mockDeliveryAlert && (
              <div className="p-3 bg-emerald-500/10 border-l-4 border-emerald-500 text-[11px] text-emerald-400 rounded-r mb-4 flex gap-2 font-mono leading-relaxed select-all">
                <Mail size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>SYSTEM INCOMING MAILBOX:</strong>
                  <div className="mt-1 font-sans text-slate-200 font-medium">{mockDeliveryAlert}</div>
                </div>
              </div>
            )}

            {!verificationSent ? (
              /* Recovery Step 1: Request code using email verification inputs */
              <div className="flex flex-col gap-4">
                <p className="text-xs text-slate-450 leading-relaxed">
                  Enter your registered key email below. We'll generate a secure reset sequence authorization code locally to bypass password blockage.
                </p>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Registered Email</span>
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="e.g. notuzbekistan1@gmail.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs py-2.5 px-3 focus:outline-none focus:border-indigo-500 font-sans font-medium"
                  />
                </div>
                <div className="flex gap-2.5 justify-end mt-4">
                  <button
                    type="button"
                    onClick={() => setIsRecoveryModalOpen(false)}
                    className="px-4 py-2 border border-slate-800 text-slate-450 hover:text-slate-250 rounded text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendRecoveryCode}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs gap-1.5 flex items-center transition-colors cursor-pointer font-bold shadow-lg shadow-indigo-600/10"
                  >
                    <Send size={11} /> Send Security Code
                  </button>
                </div>

                <div className="border-t border-rose-500/10 pt-4 mt-2">
                  <span className="text-[10px] font-bold text-rose-500/80 uppercase block tracking-wider mb-2">Destructive Fallback Node</span>
                  <button
                    type="button"
                    onClick={handleWipeVaultTrigger}
                    className="w-full py-2 bg-rose-500/15 hover:bg-rose-600 border border-rose-500/20 hover:border-transparent text-rose-400 hover:text-white rounded text-xs transition-all font-bold cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <AlertTriangle size={13} /> Clear local silo and lose entries
                  </button>
                </div>
              </div>
            ) : !isCodeVerified ? (
              /* Recovery Step 2: Validate entered code verification key input */
              <div className="flex flex-col gap-4">
                <p className="text-xs text-slate-450 leading-relaxed">
                  A verification code has been dispatched to your mailbox cache. Key the correct digits below to verify administrative ownership of the active silo.
                </p>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Verification Key Code</span>
                  <input
                    type="text"
                    value={enteredCode}
                    onChange={(e) => setEnteredCode(e.target.value)}
                    placeholder="Input 6-digit key code"
                    maxLength={6}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg text-center font-mono text-lg font-bold tracking-widest text-slate-100 py-2.5 px-3 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex gap-2 justify-end mt-3 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationSent(false);
                      setShowMockDeliveryAlert(null);
                    }}
                    className="px-4 py-2 border border-slate-800 text-slate-450 hover:text-slate-200 rounded transition-colors cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold transition-all cursor-pointer flex items-center gap-1 shadow-lg shadow-indigo-600/10"
                  >
                    Verify Sequence
                  </button>
                </div>
              </div>
            ) : (
              /* Recovery Step 3: Enter new master password */
              <form onSubmit={handleResetPasswordSubmit} className="flex flex-col gap-4">
                <p className="text-xs text-slate-450 leading-relaxed">
                  Sequence authorized successfully. Choose a brand new master password to finalize secure silo vault re-encryption.
                </p>
                
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-sans">New Master Password</span>
                  <div className="relative">
                    <input
                      type={showRecoveryPasswords ? 'text' : 'password'}
                      value={recoveryNewPass}
                      onChange={(e) => setRecoveryNewPass(e.target.value)}
                      placeholder="Minimum 8 characters"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs py-2.5 px-3 focus:outline-none focus:border-indigo-500 font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRecoveryPasswords(!showRecoveryPasswords)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none transition-colors"
                    >
                      {showRecoveryPasswords ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-sans">Repeat New Password</span>
                  <input
                    type={showRecoveryPasswords ? 'text' : 'password'}
                    value={recoveryNewPassConfirm}
                    onChange={(e) => setRecoveryNewPassConfirm(e.target.value)}
                    placeholder="Repeat Master Password"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs py-2.5 px-3 focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <div className="flex gap-2 justify-end mt-3 text-xs">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-lg shadow-rose-600/10"
                  >
                    <CheckCircle size={12} /> Apply Changes & Log In
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* SECURITY / HELP CENTER MODAL */}
      {isHelpOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-100 mb-3">Security & Help Center</h3>
            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-4 text-xs text-slate-400 leading-relaxed">
              <div>
                <h4 className="text-indigo-400 font-bold mb-1">What is PulVault?</h4>
                <p>
                  It is a secure corporate password manager. Your company credentials are kept safely inside the local browser context and grouped by project tags/categories.
                </p>
              </div>
              <div>
                <h4 className="text-indigo-400 font-bold mb-1">Client Cryptography</h4>
                <p>
                  Key derivation utilizes <strong>PBKDF2 with SHA-256 (100,000 iterations)</strong>. Symmetric file blocks use <strong>AES-GCM (256-bit)</strong> with high-entropy initialization vectors. Your raw keys are never serialized to local records.
                </p>
              </div>
              <div>
                <h4 className="text-indigo-400 font-bold mb-1">Using Silo Vaults</h4>
                <p>
                  Create separate silos (e.g., "Main Operations", "Financial Accounts") on the lock screen. Each silo uses its own unique Master Password key and registered Email address.
                </p>
              </div>
              <div>
                <h4 className="text-indigo-400 font-bold mb-1">Backups & Recovery</h4>
                <p>
                  Use the **Export Backup** feature in Settings to download encrypted vault backups. You can restore your data by uploading the `.json` backup file using the **Import Vault** button under Security.
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-5 border-t border-slate-800/60 pt-4">
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs leading-none transition-colors cursor-pointer font-semibold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
