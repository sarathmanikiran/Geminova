import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../types';
import { Icons } from '../Icons';
import { getInitials } from '../../utils';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (updatedData: Partial<User>) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onSave }) => {
  const [formData, setFormData] = useState(user);
  const [profilePic, setProfilePic] = useState<string | undefined>(user.profilePicture);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (isOpen) {
      setFormData(user);
      setProfilePic(user.profilePicture);
      setSaveState('idle');
    }
  }, [user, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSave = () => {
    setSaveState('saving');
    onSave({ ...formData, profilePicture: profilePic });
    setTimeout(() => {
      setSaveState('saved');
      setTimeout(() => {
        onClose();
      }, 700);
    }, 500);
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-fade-in p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg border border-glass-border animate-modal-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-glass-border flex justify-between items-center">
          <h2 className="text-xl font-semibold">Edit Profile</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition-all transform hover:scale-110 active:scale-95">
            <Icons.Close className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center gap-4">
            <div className="relative">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <div className="w-24 h-24 rounded-full flex items-center justify-center bg-indigo-500 text-3xl font-bold">
                  {getInitials(user.name)}
                </div>
              )}
              <button onClick={triggerFileSelect} className="absolute bottom-0 right-0 p-1.5 bg-gray-700 rounded-full hover:bg-purple-600 transition-all transform hover:scale-110 shadow-glow-accent active:scale-95">
                <Icons.Edit className="w-4 h-4" />
              </button>
              <input type="file" ref={fileInputRef} onChange={handlePictureChange} accept="image/*" className="hidden" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{formData.name}</h3>
              <p className="text-sm text-gray-400">Update your profile details below.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 transition-colors" />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
              <textarea name="bio" value={formData.bio || ''} onChange={handleChange} rows={3} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 resize-none transition-colors" placeholder="Tell us a little about yourself..."></textarea>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-gray-700 rounded-md hover:bg-gray-600 transition-all transform hover:scale-[1.02] active:scale-95">Cancel</button>
          <button onClick={handleSave} disabled={saveState !== 'idle'} className="px-4 py-2 w-32 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-all shadow-glow-primary flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-95">
            {saveState === 'idle' && 'Save Changes'}
            {saveState === 'saving' && <><Icons.Spinner className="w-5 h-5 mr-2" /> Saving...</>}
            {saveState === 'saved' && <><Icons.Check className="w-5 h-5 mr-2" /> Saved!</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;