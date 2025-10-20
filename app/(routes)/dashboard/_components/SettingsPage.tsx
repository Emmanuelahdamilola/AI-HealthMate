'use client';

import React, { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import { UserDetailContext } from "@/context/UserDetailProvider";
import { doc, updateDoc, getFirestore, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";

type SettingsType = {
  darkMode: boolean;
  emailNotifications: boolean;
  autoSave: boolean;
};

export default function SettingsPage() {
  const context = useContext(UserDetailContext);
  if (!context) throw new Error("UserDetailContext not found");

  const { userDetail } = context;
  const [settings, setSettings] = useState<SettingsType>({
    darkMode: false,
    emailNotifications: true,
    autoSave: true,
  });
  const [saving, setSaving] = useState(false);

  const auth = getAuth();
  const db = getFirestore();

  // Initialize settings from userDetail if available
  useEffect(() => {
    if (userDetail?.preferences) {
      setSettings({
        darkMode: userDetail.preferences.darkMode ?? false,
        emailNotifications: userDetail.preferences.emailNotifications ?? true,
        autoSave: userDetail.preferences.autoSave ?? true,
      });
    }
  }, [userDetail]);

  // Live sync settings from Firestore
  useEffect(() => {
    if (!auth.currentUser) return;

    const userRef = doc(db, "users", auth.currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      const data = docSnap.data();
      if (data?.preferences) {
        setSettings((prev) => ({
          ...prev,
          ...data.preferences,
        }));
      }
    });

    return () => unsubscribe();
  }, [auth.currentUser, db]);

  // Toggle and save setting to Firestore
  const handleToggle = async (key: keyof SettingsType) => {
    const updatedSettings = { ...settings, [key]: !settings[key] };
    setSettings(updatedSettings);

    if (!auth.currentUser) return;
    setSaving(true);
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { preferences: updatedSettings });
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-cyan-300">Settings</h2>

      {/* Appearance */}
      <div className="bg-[#0f172a]/80 border border-cyan-400/10 backdrop-blur-md rounded-2xl p-6 space-y-4">
        <h3 className="text-cyan-300 font-semibold">Appearance</h3>
        <div className="flex items-center justify-between">
          <span className="text-gray-200">Dark Mode</span>
          <input
            type="checkbox"
            checked={settings.darkMode}
            onChange={() => handleToggle("darkMode")}
            className="w-5 h-5 accent-cyan-400"
            disabled={saving}
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-[#0f172a]/80 border border-cyan-400/10 backdrop-blur-md rounded-2xl p-6 space-y-4">
        <h3 className="text-cyan-300 font-semibold">Notifications</h3>
        <div className="flex items-center justify-between">
          <span className="text-gray-200">Email Notifications</span>
          <input
            type="checkbox"
            checked={settings.emailNotifications}
            onChange={() => handleToggle("emailNotifications")}
            className="w-5 h-5 accent-cyan-400"
            disabled={saving}
          />
        </div>
      </div>

      {/* General */}
      <div className="bg-[#0f172a]/80 border border-cyan-400/10 backdrop-blur-md rounded-2xl p-6 space-y-4">
        <h3 className="text-cyan-300 font-semibold">General</h3>
        <div className="flex items-center justify-between">
          <span className="text-gray-200">Auto-save Sessions</span>
          <input
            type="checkbox"
            checked={settings.autoSave}
            onChange={() => handleToggle("autoSave")}
            className="w-5 h-5 accent-cyan-400"
            disabled={saving}
          />
        </div>
      </div>

      {saving && <p className="text-sm text-gray-400">Saving settings...</p>}
    </motion.div>
  );
}
