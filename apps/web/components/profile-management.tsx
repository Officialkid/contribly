"use client";

import React, { useState, useRef } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";

export function ProfileManagement() {
  const { user } = useOrg();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    username: user?.email?.split("@")[0] || "",
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setProfileImage(event.target?.result as string);
      setSuccess("Image ready to upload");
      setTimeout(() => setSuccess(null), 2000);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await apiClient.updateProfile({
        name: formData.name.trim(),
        profileImage: profileImage || undefined,
      });

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setProfileImage(null);
      setTimeout(() => setSuccess(null), 3000);

      // Refresh user data
      setTimeout(() => router.refresh(), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await apiClient.deleteAccount();
      localStorage.clear();
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Profile Settings</h1>
          <p className="text-text-muted mt-1">Manage your account details and preferences</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}

      {/* Profile Form */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-bold text-text-primary">Account Information</h2>
        </div>
        <div className="card-body space-y-6">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Profile Image */}
            <div>
              <label className="label">Profile Picture</label>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-soft">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    user?.email?.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isEditing === false || isSaving}
                    className="px-4 py-2 bg-primary text-white rounded-button font-semibold hover:bg-primary-dark disabled:opacity-50 transition-all"
                  >
                    {profileImage ? "Change Image" : "Upload Image"}
                  </button>
                  <p className="text-xs text-text-muted mt-2">JPG, PNG up to 5MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Your full name"
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-button text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50 transition-all"
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-button text-text-muted disabled:opacity-50 transition-all"
              />
              <p className="text-xs text-text-muted mt-1">Email cannot be changed</p>
            </div>

            {/* Username (Read-only for now) */}
            <div>
              <label className="label">Username</label>
              <input
                type="text"
                value={formData.username}
                disabled
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-button text-text-muted disabled:opacity-50 transition-all"
              />
              <p className="text-xs text-text-muted mt-1">Automatically generated from your email</p>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({ name: user?.name || "", username: user?.email?.split("@")[0] || "" });
                    setProfileImage(null);
                  }}
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 bg-background border-2 border-border rounded-button text-text-primary font-semibold hover:bg-background/80 disabled:opacity-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-button font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-red-200">
        <div className="card-header bg-red-50">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-6v2m0-6v2m-9-2.5A11 11 0 1112.5 25a11 11 0 01-10-5m2-3.5a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
            <h3 className="text-lg font-bold text-red-600">Danger Zone</h3>
          </div>
        </div>
        <div className="card-body">
          <p className="text-text-muted mb-4">
            This action cannot be undone. All your data will be permanently deleted.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-button font-semibold hover:bg-red-700 transition-all"
            >
              Delete My Account
            </button>
          ) : (
            <div className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="font-semibold text-red-900">
                Are you sure you want to delete your account? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-background border-2 border-border rounded-button text-text-primary font-semibold hover:bg-background/80 disabled:opacity-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-button font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    "Permanently Delete"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
