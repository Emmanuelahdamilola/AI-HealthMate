'use client';

import React, { useContext, useState, useEffect } from 'react';
import { UserDetailContext } from '@/context/UserDetailProvider';
import { getAuth, updateProfile, updatePassword } from 'firebase/auth';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function ProfilePage() {
  const { user, userDetail, setUserDetail } = useContext(UserDetailContext)!;

  const [displayName, setDisplayName] = useState(userDetail?.name || '');
  const [photoURL, setPhotoURL] = useState(userDetail?.photoURL || '');
  const [email, setEmail] = useState(userDetail?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDisplayName(userDetail?.name || user?.displayName || '');
    setPhotoURL(userDetail?.photoURL || user?.photoURL || '');
    setEmail(userDetail?.email || user?.email || '');
  }, [userDetail, user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const auth = getAuth();
      if (!auth.currentUser) throw new Error('User not signed in');

      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, { displayName, photoURL });

      // Optional: update password
      if (newPassword) {
        await updatePassword(auth.currentUser, newPassword);
        toast.success('Password updated successfully');
        setNewPassword('');
      }

      // Update your database
      const token = await auth.currentUser.getIdToken();
      const res = await axios.put(
        '/api/users',
        { name: displayName, photoURL },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update context
      setUserDetail(res.data);

      toast.success('Profile updated successfully');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-3xl mx-auto bg-[#0f172a]/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg"
    >
      <h2 className="text-2xl font-bold text-cyan-300 mb-6">My Profile</h2>

      <form onSubmit={handleProfileUpdate} className="flex flex-col gap-5">
        {/* Profile Photo */}
        <div className="flex items-center gap-4">
          <img
            src={photoURL || '/placeholder-user.png'}
            alt="Profile"
            className="w-20 h-20 rounded-full border-2 border-cyan-400 object-cover"
          />
          <input
            type="url"
            placeholder="Photo URL"
            value={photoURL}
            onChange={(e) => setPhotoURL(e.target.value)}
            className="flex-1 p-2 rounded-md bg-gray-800 text-white border border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>

        {/* Name */}
        <div className="flex flex-col">
          <label className="text-gray-300 mb-1">Full Name</label>
          <input
            type="text"
            placeholder="Your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="p-2 rounded-md bg-gray-800 text-white border border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>

        {/* Email (readonly) */}
        <div className="flex flex-col">
          <label className="text-gray-300 mb-1">Email</label>
          <input
            type="email"
            value={email}
            readOnly
            className="p-2 rounded-md bg-gray-800 text-gray-400 border border-cyan-500 cursor-not-allowed"
          />
        </div>

        {/* New Password */}
        <div className="flex flex-col">
          <label className="text-gray-300 mb-1">New Password</label>
          <input
            type="password"
            placeholder="Leave empty to keep current password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="p-2 rounded-md bg-gray-800 text-white border border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white py-2 px-4 rounded-xl font-medium shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </motion.div>
  );
}
