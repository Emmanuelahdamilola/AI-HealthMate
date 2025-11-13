'use client';

import React, { useContext, useState, useEffect, useCallback } from 'react';
import { UserDetailContext } from '@/context/UserDetailProvider';
import { getAuth, updateProfile, updatePassword } from 'firebase/auth';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Mail, User, Lock, Clock, Activity, Loader2, KeyRound } from 'lucide-react';

// Assuming placeholder image path
const DEFAULT_AVATAR = '/placeholder-user.png'; 

export default function ProfilePage() {
  const { user, userDetail, setUserDetail } = useContext(UserDetailContext)!;

  const [displayName, setDisplayName] = useState('');
  // REMOVED PHOTO URL STATE: Will derive photoURL directly from component props/state
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [joinDate, setJoinDate] = useState('');

  // 1. Initialize states based on context/Firebase user
  useEffect(() => {
    const dName = userDetail?.name || user?.displayName || '';
    
    setDisplayName(dName);
    setEmail(userDetail?.email || user?.email || '');
    
    // Set join date from Firebase metadata
    if (user?.metadata?.creationTime) {
        setJoinDate(new Date(user.metadata.creationTime).toLocaleDateString());
    }
  }, [userDetail, user]);

  // Derive the current Photo URL from the user object for display
  const currentPhotoURL = userDetail?.photoURL || user?.photoURL || '';


  // 2. Profile Update Handler (Functionality is solid, but updated for modern async/await)
  const handleProfileUpdate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not signed in');
      
      // We only update displayName in Firebase Auth now. PhotoURL remains the Firebase value.
      await updateProfile(currentUser, { displayName, photoURL: currentPhotoURL }); 
      
      // Update password
      if (newPassword) {
        await updatePassword(currentUser, newPassword);
        toast.success('Password updated successfully');
        setNewPassword('');
      }

      // Update your database (only sending the fields that changed or need synchronization)
      const token = await currentUser.getIdToken();
      const res = await axios.put(
        '/api/users',
        { name: displayName, photoURL: currentPhotoURL }, // Send the existing Firebase URL for synchronization
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update context
      setUserDetail(res.data.user); // Assuming the backend returns { user: data }
      
      toast.success('Profile updated successfully');
    } catch (err: any) {
      console.error(err);
      // For password update errors (e.g., requires recent login), provide better feedback
      if (err.code === 'auth/requires-recent-login') {
          toast.error('Security requires recent sign-in. Please log in again to change the password.');
      } else {
          toast.error(err.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  }, [displayName, newPassword, currentPhotoURL, setUserDetail, user]);


  const consultationStats = {
      lastConsult: (userDetail as any)?.lastConsult ?? new Date().toISOString(),
      totalConsults: (userDetail as any)?.totalConsults ?? 14,
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-6xl mx-auto p-4"
    >
      <h1 className="text-3xl font-extrabold text-white mb-6 tracking-wider">
        User Settings & Profile
      </h1>
      
      {/* --- TWO-COLUMN LAYOUT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: IDENTITY & STATUS */}
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1 bg-gray-900/70 backdrop-blur-md rounded-2xl p-6 h-fit border border-cyan-400/20 shadow-xl"
        >
            <div className="flex flex-col items-center justify-center text-center">
                {/* Large Avatar (Uses Auth image directly) */}
                <div className="relative mb-4">
                    <img
                        src={currentPhotoURL || DEFAULT_AVATAR}
                        alt="User Profile"
                        className="w-32 h-32 rounded-full border-4 border-cyan-400 object-cover shadow-2xl"
                    />
                    {/* Online Status Indicator */}
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-900" />
                </div>

                <h3 className="text-2xl font-bold text-white">{displayName || 'Anonymous User'}</h3>
                <p className="text-sm text-cyan-300 flex items-center gap-1 mt-1">
                    <Mail className="w-3 h-3" />
                    {email}
                </p>

                {/* Account Status Card */}
                <div className="mt-6 w-full p-4 bg-gray-800 rounded-xl space-y-2 border border-gray-700">
                    <p className="text-xs text-gray-400 flex items-center gap-2">
                        <User className="w-4 h-4 text-purple-400" />
                        Account Created: <span className="font-semibold text-white">{joinDate}</span>
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        Total Consults: <span className="font-semibold text-white">{consultationStats.totalConsults}</span>
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-300" />
                        Last Consult: <span className="font-semibold text-white">{new Date(consultationStats.lastConsult).toLocaleDateString()}</span>
                    </p>
                </div>
            </div>
        </motion.div>

        {/* RIGHT COLUMN: PROFILE FORM & SECURITY */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-2 bg-gray-900/70 backdrop-blur-md rounded-2xl p-8 border border-purple-400/20 shadow-xl"
        >
            <h2 className="text-2xl font-bold text-cyan-300 mb-6 border-b border-gray-700 pb-3">
                Update Information
            </h2>
            
            <form onSubmit={handleProfileUpdate} className="flex flex-col gap-8">
                
                {/* --- SECTION: PERSONAL INFO --- */}
                <fieldset className="flex flex-col gap-5 border-b border-gray-700 pb-6">
                    <legend className="text-lg font-semibold text-purple-300 mb-3">Personal Details</legend>
                    
                    {/* Full Name */}
                    <div className="flex flex-col">
                        <label className="text-gray-300 mb-2 flex items-center gap-2">
                            <User className="w-4 h-4 text-cyan-400" /> Full Name
                        </label>
                        <input
                            type="text"
                            placeholder="Your name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                        />
                    </div>
                    
                    {/* Email (readonly) */}
                    <div className="flex flex-col">
                        <label className="text-gray-300 mb-2 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-purple-400" /> Email (Primary Identifier)
                        </label>
                        <input
                            type="email"
                            value={email}
                            readOnly
                            className="p-3 rounded-lg bg-gray-700 text-gray-400 border border-gray-700 cursor-not-allowed"
                        />
                    </div>
                </fieldset>

                {/* --- SECTION: SECURITY --- */}
                <fieldset className="flex flex-col gap-5">
                    <legend className="text-lg font-semibold text-purple-300 mb-3">Security & Access</legend>

                    {/* New Password */}
                    <div className="flex flex-col">
                        <label className="text-gray-300 mb-2 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-cyan-400" /> Change Password
                        </label>
                        <input
                            type="password"
                            placeholder="Enter new password (leave empty to keep current)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                        />
                    </div>
                    
                    {/* API Key Placeholder (Readonly) */}
                    <div className="flex flex-col">
                        <label className="text-gray-300 mb-2 flex items-center gap-2">
                            <KeyRound className="w-4 h-4 text-purple-400" /> N-ATLAS API Key
                        </label>
                        <div className="p-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 text-sm">
                            **************************** (Placeholder for future key)
                        </div>
                    </div>
                </fieldset>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="mt-6 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-600 
                                text-white py-3 px-4 rounded-xl font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)] 
                                transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" /> Saving Changes...
                        </>
                    ) : (
                        'Update Profile & Security'
                    )}
                </button>
            </form>
        </motion.div>
        
      </div>
    </motion.div>
  );
}