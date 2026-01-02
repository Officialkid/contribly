"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { apiClient } from "@/lib/api-client";
import { Loading, EmptyState, Toast } from "@/components/ui";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const loadNotifications = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.getNotifications();
        setNotifications((response as any).notifications || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load notifications");
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await apiClient.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setToast("Marked as read");
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setToast("All marked as read");
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark all as read");
    }
  };

  if (isLoading) return <Loading message="Loading notifications..." />;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Notifications</h1>
            <p className="text-text-muted mt-1">Stay updated with your account activity</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 text-sm bg-primary text-white rounded-button font-semibold hover:bg-primary-dark transition-all"
            >
              Mark All as Read
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-danger flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Toast */}
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}

        {/* Empty State */}
        {notifications.length === 0 ? (
          <EmptyState
            title="No Notifications Yet"
            message="You're all caught up! Check back later for updates."
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`card p-4 ${!notification.read ? "border-l-4 border-primary bg-primary/5" : ""}`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    notification.type === "payment" ? "bg-green-100" :
                    notification.type === "claim" ? "bg-blue-100" :
                    notification.type === "withdrawal" ? "bg-amber-100" :
                    "bg-gray-100"
                  }`}>
                    {notification.type === "payment" && (
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {notification.type === "claim" && (
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {notification.type === "withdrawal" && (
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${notification.read ? "text-text-muted" : "text-text-primary"}`}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-text-muted mt-1">{notification.message}</p>
                    <p className="text-xs text-text-muted mt-2">
                      {notification.createdAt && new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Actions */}
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="text-xs text-primary hover:text-primary-dark font-semibold ml-2 flex-shrink-0"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
