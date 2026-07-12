"use client";

import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "contribly-pwa-banner-dismissed";

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function PwaInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setIsInstalled(isStandaloneDisplay());
    setIsDismissed(window.localStorage.getItem(DISMISS_KEY) === "true");
    setShowIosHint(isIosDevice() && !isStandaloneDisplay());
    setIsMobileOrTablet(window.matchMedia("(max-width: 1024px)").matches);
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Failed to register service worker", error);
    });
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setIsDismissed(false);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setShowIosHint(false);
      window.localStorage.setItem(DISMISS_KEY, "true");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const canShow = useMemo(() => {
    if (!isClient || isInstalled || isDismissed) return false;
    return Boolean(installPrompt) || showIosHint;
  }, [installPrompt, isClient, isDismissed, isInstalled, showIosHint]);

  const heading = isMobileOrTablet
    ? "Download Contribly on your phone"
    : "Install Contribly on this device";

  const description = isMobileOrTablet
    ? "Install the app for faster sign-in, a full-screen experience, and quick access to contributions, claims, and approvals."
    : "Install Contribly for quicker access, an app-like window, and a smoother workspace for contributions, claims, and approvals.";

  if (!canShow) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    window.localStorage.setItem(DISMISS_KEY, "true");
  };

  const handleInstall = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setInstallPrompt(null);
      setIsDismissed(true);
      window.localStorage.setItem(DISMISS_KEY, "true");
      return;
    }

    setIsDismissed(false);
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-[70] sm:inset-x-auto sm:bottom-4 sm:right-4 sm:max-w-md">
      <div className="overflow-hidden rounded-3xl border border-blue-200 bg-white/95 shadow-2xl backdrop-blur">
        <div className="bg-gradient-to-r from-sky-500 via-blue-600 to-emerald-500 px-4 py-3 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.24em]">Contribly App</p>
          <h2 className="mt-1 text-lg font-bold leading-tight">
            {heading}
          </h2>
        </div>

        <div className="space-y-3 px-4 py-4 text-sm text-slate-700">
          <p className="leading-6">{description}</p>

          {showIosHint && !installPrompt ? (
            <p className="rounded-2xl bg-slate-100 px-3 py-2 text-slate-600">
              On iPhone or iPad, tap the Share button in Safari, then choose <strong>Add to Home Screen</strong>.
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            {installPrompt ? (
              <button className="btn btn-primary w-full sm:w-auto" onClick={handleInstall}>
                Install App
              </button>
            ) : null}

            <button className="btn btn-outline w-full sm:w-auto" onClick={handleDismiss}>
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
