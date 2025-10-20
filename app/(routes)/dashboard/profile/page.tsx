'use client';

import React, { useContext, useState, useEffect, ChangeEvent } from 'react';
import { UserDetailContext } from '@/context/UserDetailProvider';
import { getAuth, updateProfile, updatePassword } from 'firebase/auth';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import axios from 'axios';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export default function ProfilePage() {
  const { user, userDetail, setUserDetail } = useContext(UserDetailContext)!;

  const [displayName, setDisplayName] = useState(userDetail?.name || '');
  const [photoURL, setPhotoURL] = useState(userDetail?.photoURL || '');
  const [email, setEmail] = useState(userDetail?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    setDisplayName(userDetail?.name || user?.displayName || '');
    setPhotoURL(userDetail?.photoURL || user?.photoURL || '');
    setEmail(userDetail?.email || user?.email || '');
  }, [userDetail, user]);

  // Handle photo upload
  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const storageRef = ref(storage, `profile-photos/${user?.uid}-${Date.now()}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        snapshot => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        error => {
          console.error(error);
          toast.error('Failed to upload image.');
          setLoading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setPhotoURL(downloadURL);
          setUploadProgress(null);
          toast.success('Photo uploaded successfully!');
          setLoading(false);
        }
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload photo.');
      setLoading(false);
    }
  };

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

      // Update your backend database
      const token = await auth.currentUser.getIdToken();
      const res = await axios.put(
        '/api/users',
        { name: displayName, photoURL },
        { headers: { Authorization: `Bearer ${token}` } }
      );

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
      className="max-w-4xl mx-auto p-6 sm:p-10 bg-[#0f172a]/80 backdrop-blur-xl rounded-3xl shadow-lg space-y-8"
    >
      <h2 className="text-3xl font-bold text-cyan-300 mb-6">My Profile</h2>

      <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Photo Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-36 h-36">
            <img
              src={photoURL || '/placeholder-user.png'}
              alt="Profile"
              className="w-36 h-36 rounded-full object-cover border-4 border-cyan-400 shadow-lg"
            />
            <label className="absolute bottom-0 right-0 bg-cyan-500 hover:bg-cyan-400 text-white p-2 rounded-full cursor-pointer shadow-lg">
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              ✎
            </label>
          </div>
          {uploadProgress && (
            <p className="text-sm text-gray-300">{`Uploading: ${Math.round(uploadProgress)}%`}</p>
          )}
        </div>

        {/* Personal Info Section */}
        <div className="md:col-span-2 flex flex-col gap-5">
          <div className="flex flex-col">
            <label className="text-gray-300 mb-1">Full Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="p-3 rounded-lg bg-gray-800 text-white border border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="p-3 rounded-lg bg-gray-800 text-gray-400 border border-cyan-500 cursor-not-allowed"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-300 mb-1">New Password</label>
            <input
              type="password"
              placeholder="Leave empty to keep current password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="p-3 rounded-lg bg-gray-800 text-white border border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white py-3 px-6 rounded-2xl font-semibold shadow-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
