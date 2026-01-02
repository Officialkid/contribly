"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Contribly
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="px-4 py-2 text-slate-300 hover:text-white transition font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-6 py-2 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition font-semibold shadow-lg shadow-white/10"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center space-y-8">
          {/* Main Headline */}
          <div className="space-y-4">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Contribution Management
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text">
                Made Simple
              </span>
            </h2>
            <p className="text-xl sm:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Track, manage, and optimize group contributions with ease.
              Perfect for organizations, departments, and teams.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-slate-900 rounded-xl hover:bg-slate-100 transition font-bold text-lg shadow-2xl shadow-white/20 hover:scale-105 transform w-full sm:w-auto"
            >
              Start Free Trial
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition font-bold text-lg border border-slate-700 w-full sm:w-auto"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          {/* Feature 1 */}
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-8 hover:border-slate-700 transition">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Multi-Department Support</h3>
            <p className="text-slate-400 leading-relaxed">
              Organize your organization into departments. Each department manages its own contributions independently.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-8 hover:border-slate-700 transition">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Payment Tracking</h3>
            <p className="text-slate-400 leading-relaxed">
              Automatically match payments to members. Track contributions, balances, and payment history in real-time.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-8 hover:border-slate-700 transition">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Detailed Analytics</h3>
            <p className="text-slate-400 leading-relaxed">
              Get insights into contribution trends, member balances, and financial summaries with beautiful reports.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-32 text-center space-y-16">
          <div>
            <h3 className="text-4xl font-bold text-white mb-4">How It Works</h3>
            <p className="text-xl text-slate-400">Get started in three simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold text-white">
                1
              </div>
              <h4 className="text-xl font-bold text-white">Create Organization</h4>
              <p className="text-slate-400">Set up your organization and invite team members to join</p>
            </div>

            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold text-white">
                2
              </div>
              <h4 className="text-xl font-bold text-white">Add Departments</h4>
              <p className="text-slate-400">Create departments and set monthly contribution amounts</p>
            </div>

            <div className="space-y-4">
              <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold text-white">
                3
              </div>
              <h4 className="text-xl font-bold text-white">Track Payments</h4>
              <p className="text-slate-400">Record payments and automatically match them to members</p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-32 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-3xl p-12 text-center">
          <h3 className="text-4xl font-bold text-white mb-4">
            Ready to get started?
          </h3>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Join organizations already using Contribly to manage their contributions efficiently
          </p>
          <Link
            href="/register"
            className="inline-block px-10 py-4 bg-white text-slate-900 rounded-xl hover:bg-slate-100 transition font-bold text-lg shadow-2xl shadow-white/20 hover:scale-105 transform"
          >
            Get Started Free
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-slate-500">
            <p>&copy; 2026 Contribly. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
