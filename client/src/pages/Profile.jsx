import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { updateProfile } from '../services/auth.js';
import { User, ShieldAlert, Sparkles, Upload } from 'lucide-react';
import confetti from 'canvas-confetti';

const Profile = () => {
  const { user, refreshProfile } = useAuth();
  
  // States
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      if (password) {
        formData.append('password', password);
      }
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      await updateProfile(formData);
      await refreshProfile();
      
      setSuccess('Profile updated successfully.');
      setPassword('');
      setConfirmPassword('');
      setAvatarFile(null);
      setAvatarPreview(null);
      
      confetti({
        particleCount: 40,
        spread: 30,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to update profile settings.');
    } finally {
      setLoading(false);
    }
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const currentAvatarUrl = user?.avatarUrl 
    ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${API_URL}${user.avatarUrl}`)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=f1f5f9&color=0f172a&size=128`;

  return (
    <div className="space-y-lg max-w-xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-900">Profile Settings</h1>
        <p className="text-sm text-brand-500">Manage your profile details, avatar, and security passwords.</p>
      </div>

      {success && (
        <div className="p-sm bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-700">
          {success}
        </div>
      )}

      {error && (
        <div className="p-sm bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card-premium p-lg space-y-md">
        
        {/* Profile Picture Upload */}
        <div className="flex flex-col sm:flex-row items-center gap-md border-b border-brand-100 pb-md">
          <img
            src={avatarPreview || currentAvatarUrl}
            alt="Profile Preview"
            className="w-16 h-16 rounded-full object-cover border border-brand-200 shadow-premium"
          />
          <div className="space-y-xs text-center sm:text-left">
            <span className="text-xs font-semibold text-brand-700">Profile Image</span>
            <p className="text-[10px] text-brand-400">JPG, PNG or GIF. Max size 2MB.</p>
            <div className="relative inline-block mt-xs">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <button type="button" className="btn-secondary py-1 text-xs flex items-center gap-xs">
                <Upload size={12} />
                Upload Photo
              </button>
            </div>
          </div>
        </div>

        {/* User Details */}
        <div className="space-y-sm">
          <div>
            <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">
              Email Address (Read-only)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="input-premium bg-brand-50 border-brand-100 text-brand-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="input-premium"
            />
          </div>
        </div>

        {/* Change password details */}
        <div className="border-t border-brand-100 pt-md space-y-sm">
          <h4 className="text-xs font-semibold text-brand-700 uppercase tracking-wider mb-xs">
            Change Security Password
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div>
              <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New Password"
                className="input-premium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="input-premium"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-md border-t border-brand-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-xs px-lg"
          >
            {loading ? 'Saving...' : 'Save Changes'}
            {!loading && <Sparkles size={14} />}
          </button>
        </div>

      </form>
    </div>
  );
};

export default Profile;
