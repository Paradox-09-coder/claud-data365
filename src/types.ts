export interface CredentialType {
  id: string;
  service: string;
  logo: string; // 'generic' | 'GitHub' | 'Google' | 'AWS' | 'Telegram' | 'Slack' | 'Figma' | 'Notion' | data url
  url?: string;
  username: string;
  password: string;
  category: string;
  notes?: string;
  updatedAt: string;
}

export type TabType = 'vault' | 'audit' | 'activity' | 'settings';

export interface ActivityLogEntry {
  id: string;
  action: string; // 'create_cred' | 'update_cred' | 'delete_cred' | 'export_backup' | 'change_password' | 'import_backup'
  title: string;
  subtitle: string;
  timestamp: string;
}

export type SettingsSubTabType = 'profile' | 'preferences' | 'security' | 'danger';

export interface EncryptedPayload {
  ciphertext: string;
  salt: string;
  iv: string;
}

export const CATEGORIES = [
  'Development',
  'Backend',
  'Design',
  'Marketing',
  'Communication',
  'Productivity',
  'Social Media',
  'Cloud Platform',
  'Other'
];

export const LOGO_PRESETS = [
  { id: 'generic', name: 'Pre-defined Icon (Generic)' },
  { id: 'GitHub', name: 'GitHub' },
  { id: 'Google', name: 'Google / Gmail' },
  { id: 'AWS', name: 'Amazon Web Services' },
  { id: 'Telegram', name: 'Telegram' },
  { id: 'Slack', name: 'Slack' },
  { id: 'Figma', name: 'Figma' },
  { id: 'Notion', name: 'Notion' },
  { id: 'custom', name: 'Upload Custom Icon...' }
];
