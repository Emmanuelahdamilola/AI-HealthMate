'use client';

import React, { useState, useEffect, useContext, useCallback } from "react";
import { motion } from "framer-motion";
import { UserDetailContext } from "@/context/UserDetailProvider";
import { doc, updateDoc, getFirestore, onSnapshot, DocumentData } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { toast } from "sonner";
import { Moon, Bell, Save, Languages, Trash2, Globe, Loader2 } from "lucide-react";
import axios from "axios";

// --- PREFERENCES TYPES ---
type LanguageOption = 'english' | 'yoruba' | 'igbo' | 'hausa';

interface Preferences {
  darkMode: boolean;
  emailNotifications: boolean;
  autoSave: boolean;
  preferredReportLanguage: LanguageOption;
  defaultConsultLanguage: LanguageOption;
}

const TOGGLE_KEYS: Array<keyof Pick<Preferences, 'darkMode' | 'emailNotifications' | 'autoSave'>> = [
  'darkMode',
  'emailNotifications',
  'autoSave'
];

const DROPDOWN_KEYS: Array<keyof Pick<Preferences, 'preferredReportLanguage' | 'defaultConsultLanguage'>> = [
  'preferredReportLanguage',
  'defaultConsultLanguage'
];

const DEFAULT_PREFS: Preferences = {
  darkMode: true,
  emailNotifications: true,
  autoSave: true,
  preferredReportLanguage: 'english',
  defaultConsultLanguage: 'english',
};

// --- Toggle Switch Component ---
const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    onClick={onChange}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-cyan-500' : 'bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
        }`}
    />
  </button>
);

// --- SETTINGS PAGE ---
export default function SettingsPage() {
  const context = useContext(UserDetailContext);
  if (!context) throw new Error("UserDetailContext not found");

  const { userDetail, setUserDetail } = context;
  const [settings, setSettings] = useState<Preferences>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const auth = getAuth();
  const db = getFirestore();

  // --- Initialize settings from userDetail ---
  useEffect(() => {
    if (userDetail?.preferences) {
      setSettings(prev => ({
        ...DEFAULT_PREFS,
        ...prev,
        ...userDetail.preferences
      }));
    }
  }, [userDetail]);

  // --- Live Firestore Sync ---
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userRef = doc(db, "users", currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      const data = docSnap.data() as DocumentData;
      if (data?.preferences) {
        const mergedPrefs: Preferences = { ...DEFAULT_PREFS, ...data.preferences };
        setSettings(mergedPrefs);
        setUserDetail(prev => {
          if (!prev) {
            return {
              id: 0,
              name: "",
              email: "",
              photoURL: null,
              preferences: mergedPrefs
            };
          }
          return { ...prev, preferences: mergedPrefs };
        });

      }
    });

    return () => unsubscribe();
  }, [auth, db, setUserDetail]);

  // --- Save Settings ---
  const saveSettings = useCallback(async (updatedSettings: Preferences) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setSaving(true);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { preferences: updatedSettings });
      setSettings(updatedSettings);
      toast.success('Settings saved!');
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }, [auth, db]);

  // --- Handlers ---
  const handleToggle = (key: typeof TOGGLE_KEYS[number]) => {
    const updated: Preferences = { ...settings, [key]: !settings[key] };
    saveSettings(updated);
  };

  const handleDropdownChange = (key: typeof DROPDOWN_KEYS[number], value: LanguageOption) => {
    const updated: Preferences = { ...settings, [key]: value };
    saveSettings(updated);
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to delete all your consultation history?")) return;
    setIsDeleting(true);
    try {
      const token = await auth.currentUser!.getIdToken();
      const res = await axios.delete('/api/data/clear-history', { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) toast.success('Consultation history cleared!');
    } catch (error) {
      toast.error('Failed to clear history.');
    } finally {
      setIsDeleting(false);
    }
  };

  const languageOptions: { code: LanguageOption, name: string }[] = [
    { code: 'english', name: 'English (Default)' },
    { code: 'yoruba', name: 'Yoruba' },
    { code: 'igbo', name: 'Igbo' },
    { code: 'hausa', name: 'Hausa' },
  ];

  const SaveStatus = () => (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      {saving ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Saving to cloud...</span>
        </>
      ) : <span className="text-green-500">Settings synchronized.</span>}
    </div>
  );

  const SettingItem: React.FC<{ icon: React.ElementType; title: string; description: string; children: React.ReactNode }> = ({ icon: Icon, title, description, children }) => (
    <div className="flex justify-between items-start py-4 border-b border-gray-700/60 last:border-b-0">
      <div className="flex items-start gap-4">
        <Icon className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-white font-medium">{title}</h4>
          <p className="text-gray-400 text-sm mt-1">{description}</p>
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-4xl mx-auto">
      <motion.div className="bg-[#0f172a]/90 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-cyan-400/20" initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
        <h2 className="text-3xl font-extrabold text-cyan-400 mb-6 border-b border-gray-700 pb-3">Application Settings</h2>

        <div className="mb-6"><SaveStatus /></div>

        <h3 className="text-xl font-semibold text-purple-300 mb-4 pt-4 border-t border-gray-700/50">Appearance & Localization</h3>
        <div className="space-y-4">
          <SettingItem icon={Moon} title="Dark Mode" description="Activate the high-contrast dark theme.">
            <ToggleSwitch checked={settings.darkMode} onChange={() => handleToggle("darkMode")} disabled={saving} />
          </SettingItem>
          <SettingItem icon={Globe} title="Default Consultation Language" description="Sets the microphone & consultation language.">
            <select value={settings.defaultConsultLanguage} onChange={e => handleDropdownChange("defaultConsultLanguage", e.target.value as LanguageOption)} className="bg-gray-700 text-white border border-gray-600 rounded-lg p-1.5 text-sm w-36" disabled={saving}>
              {languageOptions.map(opt => <option key={opt.code} value={opt.code}>{opt.name}</option>)}
            </select>
          </SettingItem>
          <SettingItem icon={Languages} title="Preferred Report Language" description="Language for structured reports/PDFs.">
            <select value={settings.preferredReportLanguage} onChange={e => handleDropdownChange("preferredReportLanguage", e.target.value as LanguageOption)} className="bg-gray-700 text-white border border-gray-600 rounded-lg p-1.5 text-sm w-36" disabled={saving}>
              {languageOptions.map(opt => <option key={opt.code} value={opt.code}>{opt.name}</option>)}
            </select>
          </SettingItem>
        </div>

        <h3 className="text-xl font-semibold text-purple-300 mb-4 pt-6 border-t border-gray-700/50">Data & Notifications</h3>
        <div className="space-y-4">
          <SettingItem icon={Bell} title="Email Notifications" description="Receive email summaries of consultations.">
            <ToggleSwitch checked={settings.emailNotifications} onChange={() => handleToggle("emailNotifications")} disabled={saving} />
          </SettingItem>
          <SettingItem icon={Save} title="Auto-save Sessions" description="Automatically save chat transcripts & reports.">
            <ToggleSwitch checked={settings.autoSave} onChange={() => handleToggle("autoSave")} disabled={saving} />
          </SettingItem>
          <SettingItem icon={Trash2} title="Clear Consultation History" description="Delete all stored consultation records.">
            <button onClick={handleClearHistory} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {isDeleting ? 'Deleting...' : 'Clear All'}
            </button>
          </SettingItem>
        </div>
      </motion.div>
    </motion.div>
  );
}
