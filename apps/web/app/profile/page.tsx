"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { Card, Loading, Error } from "@/components/ui";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useOrg();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", profileImage: "" });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email,
        profileImage: (user as any)?.profileImage || "",
      });
      setProfileImage((user as any)?.profileImage || null);
      setIsLoading(false);
    }
  }, [user]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > MAX_IMAGE_SIZE) {
      setError(`Image must be smaller than 10MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setProfileImage(base64);
      setFormData({ ...formData, profileImage: base64 });
      setSuccess("Image selected. Click 'Save Changes' to update your profile.");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiClient.updateProfile({
        name: formData.name,
      });

      if ((response as any)?.success) {
        setSuccess("Profile updated successfully!");
      }
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Failed to update profile";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE MY ACCOUNT") {
      setError("Please type 'DELETE MY ACCOUNT' to confirm");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await apiClient.deleteAccount();
      setSuccess("Account deleted. Redirecting...");
      setTimeout(() => router.push("/"), 2000);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Failed to delete account";
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <Loading message="Loading profile..." />;
  if (!user) return <Error message="User not found" />;

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">My Profile</h1>
        <p className="text-text-muted mt-2">Manage your account information</p>
      </div>

      {error && <Error message={error} />}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
          {success}
        </div>
      )}

      {/* Profile Information */}
      <Card title="Profile Information">
        <div className="space-y-6">
          {/* Profile Image */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-4">Profile Picture</label>
            <div className="flex gap-6">
              {profileImage && (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-border"
                />
              )}
              <div className="flex-1 space-y-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-outline"
                >
                  Choose Image (Max 10MB)
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <p className="text-xs text-text-muted">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg text-text-primary focus:border-primary focus:outline-none"
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Email Address</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg text-text-muted cursor-not-allowed opacity-50"
            />
            <p className="text-xs text-text-muted mt-2">Email cannot be changed</p>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card title="Danger Zone" className="border-red-200 bg-red-50">
        <div className="space-y-4">
          <p className="text-text-muted">
            Deleting your account is permanent and cannot be undone. All your data will be lost.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn bg-red-600 hover:bg-red-700 text-white"
            >
              Delete My Account
            </button>
          ) : (
            <div className="bg-white rounded-lg border-2 border-red-200 p-4 space-y-4">
              <p className="text-sm text-red-600 font-semibold">
                This action cannot be undone. Type "DELETE MY ACCOUNT" to confirm.
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder='Type "DELETE MY ACCOUNT" to confirm'
                className="w-full px-4 py-2 border-2 border-red-200 rounded-lg text-text-primary focus:border-red-500 focus:outline-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmText !== "DELETE MY ACCOUNT"}
                  className="btn bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Permanently Delete Account"}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                  }}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
