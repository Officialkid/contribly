"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  // Carousel auto-slide every 3 seconds
  useEffect(() => {
    if (isCarouselPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3); // 3 slides
    }, 3000);
    return () => clearInterval(interval);
  }, [isCarouselPaused]);

  // Scroll detection for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const carouselSlides = [
    {
      title: "Track Contributions in Real-Time",
      description: "Monitor payment status, contribution history, and member balances across all departments",
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      title: "Manage Multiple Departments",
      description: "Organize contributions by department with different payment schedules and member lists",
      icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    },
    {
      title: "Handle Claims & Withdrawals",
      description: "Approve payment claims, manage withdrawals, and maintain transparency with detailed reports",
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
  ];

  const useCases = [
    {
      title: "Community Groups",
      description: "Manage group contributions for savings, medical, or social activities",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    },
    {
      title: "Religious Organizations",
      description: "Track tithes, offerings, and member contributions transparently",
      icon: "M7 12a5 5 0 1110 0 5 5 0 01-10 0zm5-5V2m0 20v-6m5-5h6m-6 0h-6",
    },
    {
      title: "Cooperative Societies",
      description: "Manage share contributions and dividend distributions effectively",
      icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    },
    {
      title: "Corporate Teams",
      description: "Manage team expenses, fund collections, and activity budgets",
      icon: "M13 10V3L4 14h7v7l9-11h-7z",
    },
  ];

  const features = [
    {
      title: "Easy Payment Tracking",
      description: "Record and monitor all contributions with automatic balance calculations",
      icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    },
    {
      title: "Multi-Department Support",
      description: "Create and manage multiple departments with independent contribution schedules",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m4-4h1m-1 4h1",
    },
    {
      title: "Member Management",
      description: "Add members, assign roles, and manage permissions with role-based access",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    },
    {
      title: "Claims & Withdrawals",
      description: "Submit and approve payment claims with full audit trails",
      icon: "M9 12l2 2 4-4m9 0a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      title: "Analytics & Reports",
      description: "Get detailed insights with charts, tables, and exportable reports",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    },
    {
      title: "Secure & Transparent",
      description: "Bank-grade security with transparent transaction history for all members",
      icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    },
  ];

  const steps = [
    {
      number: "1",
      title: "Create Organization",
      description: "Sign up and set up your organization in minutes",
    },
    {
      number: "2",
      title: "Add Departments",
      description: "Create departments and set contribution amounts",
    },
    {
      number: "3",
      title: "Invite Members",
      description: "Send invites to members and assign roles",
    },
    {
      number: "4",
      title: "Track Contributions",
      description: "Members submit payments and you manage approvals",
    },
  ];

  const faqs = [
    {
      question: "How secure is Contribly?",
      answer: "Contribly uses bank-grade encryption and security protocols to protect all your data. We comply with international data protection standards and conduct regular security audits.",
    },
    {
      question: "Can I have multiple departments?",
      answer: "Yes! You can create unlimited departments, each with their own members, contribution amounts, and payment schedules.",
    },
    {
      question: "What payment methods do you support?",
      answer: "We support bank transfers, mobile money, and other local payment methods depending on your region.",
    },
    {
      question: "Is there a free trial?",
      answer: "Yes, you can start with our free plan that includes up to 50 members. Upgrade anytime for additional features.",
    },
    {
      question: "How do I export reports?",
      answer: "You can export all reports in CSV, PDF, and Excel formats directly from the dashboard.",
    },
    {
      question: "Can members access their account?",
      answer: "Yes, each member gets their own dashboard to view their contribution history, balance, and payment status.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Solid Navbar */}
      <nav className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-primary group-hover:text-primary-dark transition-colors duration-300">
                Contribly
              </h1>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#who-can-use" className="text-text-muted hover:text-primary transition-colors font-medium text-sm">
                Who Can Use
              </a>
              <a href="#features" className="text-text-muted hover:text-primary transition-colors font-medium text-sm">
                Features
              </a>
              <a href="#how-it-works" className="text-text-muted hover:text-primary transition-colors font-medium text-sm">
                How It Works
              </a>
              <a href="#faqs" className="text-text-muted hover:text-primary transition-colors font-medium text-sm">
                FAQs
              </a>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/login" className="text-primary hover:text-primary-dark font-semibold text-sm transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="px-6 py-2.5 bg-primary text-white rounded-button font-semibold text-sm hover:bg-primary-dark shadow-soft hover:shadow-medium transform hover:scale-105 transition-all duration-300">
                Sign Up
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-text-muted hover:text-primary transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border bg-card">
              <div className="px-6 py-4 space-y-4">
                <a
                  href="#who-can-use"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-text-muted hover:text-primary transition-colors font-medium text-sm"
                >
                  Who Can Use
                </a>
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-text-muted hover:text-primary transition-colors font-medium text-sm"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-text-muted hover:text-primary transition-colors font-medium text-sm"
                >
                  How It Works
                </a>
                <a
                  href="#faqs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-text-muted hover:text-primary transition-colors font-medium text-sm"
                >
                  FAQs
                </a>
                <div className="pt-4 border-t border-border space-y-3">
                  <Link
                    href="/login"
                    className="block text-center py-2.5 text-primary hover:text-primary-dark font-semibold text-sm transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="block text-center py-2.5 bg-primary text-white rounded-button font-semibold text-sm hover:bg-primary-dark shadow-soft"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section with Carousel */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div
            className="grid lg:grid-cols-2 gap-12 items-center"
            onMouseEnter={() => setIsCarouselPaused(true)}
            onMouseLeave={() => setIsCarouselPaused(false)}
          >
            {/* Carousel Content */}
            <div className="space-y-8 animate-fade-in">
              <div className="inline-block">
                <span className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-semibold">
                  🚀 Smart Contribution Management
                </span>
              </div>

              <div className="min-h-40">
                <h1 className="text-5xl lg:text-6xl font-bold text-text-primary leading-tight">
                  {carouselSlides[currentSlide].title}
                </h1>
                <p className="text-xl text-text-muted mt-6 leading-relaxed">
                  {carouselSlides[currentSlide].description}
                </p>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <Link href="/register" className="btn btn-primary flex items-center gap-2 py-3 px-8">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Get Started Free
                </Link>
                <Link href="#features" className="btn btn-outline flex items-center gap-2 py-3 px-8">
                  Learn More
                </Link>
              </div>

              {/* Carousel Indicators */}
              <div className="flex gap-3 pt-8">
                {carouselSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      idx === currentSlide ? "bg-primary w-8" : "bg-border hover:bg-primary/50"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Carousel Visual */}
            <div className="relative hidden lg:flex items-center justify-center">
              <div className="w-96 h-96 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl flex items-center justify-center overflow-hidden">
                <svg className="w-48 h-48 text-primary opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={carouselSlides[currentSlide].icon} />
                </svg>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Who Can Use Section */}
      <section id="who-can-use" className="py-20 lg:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-text-primary mb-4">Who Can Use Contribly?</h2>
            <p className="text-xl text-text-muted max-w-2xl mx-auto">
              From community groups to corporate teams, Contribly simplifies contribution management for any organization
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, idx) => (
              <div key={idx} className="card p-8 hover:shadow-medium transition-all duration-300 group">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={useCase.icon} />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">{useCase.title}</h3>
                <p className="text-text-muted text-sm">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32 bg-background">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-text-primary mb-4">Powerful Features</h2>
            <p className="text-xl text-text-muted max-w-2xl mx-auto">
              Everything you need to manage contributions effectively
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="card p-8 hover:shadow-medium transition-all duration-300">
                <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-3">{feature.title}</h3>
                <p className="text-text-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 lg:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-text-primary mb-4">How It Works</h2>
            <p className="text-xl text-text-muted max-w-2xl mx-auto">
              Get started in 4 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="card p-8 text-center h-full">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-soft">
                    <span className="text-2xl font-bold text-white">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-3">{step.title}</h3>
                  <p className="text-text-muted text-sm">{step.description}</p>
                </div>
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-px bg-border transform -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/register" className="btn btn-primary py-3.5 px-10 inline-flex items-center gap-2 text-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faqs" className="py-20 lg:py-32 bg-background">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-text-primary mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-text-muted">
              Find answers to common questions about Contribly
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="card overflow-hidden">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                  className="w-full px-8 py-6 flex items-center justify-between hover:bg-background transition-colors text-left"
                >
                  <h3 className="text-lg font-bold text-text-primary">{faq.question}</h3>
                  <svg
                    className={`w-6 h-6 text-primary transition-transform duration-300 flex-shrink-0 ${
                      expandedFAQ === idx ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
                {expandedFAQ === idx && (
                  <div className="px-8 py-4 bg-background border-t border-border">
                    <p className="text-text-muted leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-r from-primary via-primary-dark to-primary-800">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Simplify Contribution Management?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join thousands of organizations already using Contribly to manage contributions efficiently and transparently
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register" className="px-8 py-4 bg-white text-primary rounded-button font-bold text-lg hover:bg-gray-50 shadow-soft hover:shadow-medium transform hover:scale-105 transition-all duration-300 inline-flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Get Started Free
            </Link>
            <Link href="/login" className="px-8 py-4 border-2 border-white text-white rounded-button font-bold text-lg hover:bg-white/10 transition-all duration-300">
              Sign In to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            {/* About */}
            <div className="space-y-4">
              <Link href="/" className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-soft">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-primary">Contribly</span>
              </Link>
              <p className="text-text-muted text-sm leading-relaxed">
                Simplifying contribution management for organizations worldwide. Making financial transparency and accountability easy.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-text-primary">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-text-muted hover:text-primary transition-colors text-sm">Features</a></li>
                <li><a href="#how-it-works" className="text-text-muted hover:text-primary transition-colors text-sm">How It Works</a></li>
                <li><a href="#faqs" className="text-text-muted hover:text-primary transition-colors text-sm">FAQs</a></li>
                <li><Link href="/login" className="text-text-muted hover:text-primary transition-colors text-sm">Sign In</Link></li>
              </ul>
            </div>

            {/* Contact & Social */}
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-text-primary">Get In Touch</h4>
              <div className="space-y-2">
                <p className="text-text-muted text-sm">📧 admin@joincontribly.com</p>
                <a href="https://wa.me/254745169345" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors text-sm block">📱 +254745169345</a>
                <p className="text-text-muted text-sm">📍 Nairobi, Kenya</p>
              </div>
              <div className="flex gap-3 pt-2">
                {/* LinkedIn */}
                <a href="#" className="w-10 h-10 bg-[#0A66C2]/10 rounded-lg flex items-center justify-center hover:bg-[#0A66C2]/20 transition-colors">
                  <svg className="w-5 h-5" fill="#0A66C2" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                {/* Facebook */}
                <a href="#" className="w-10 h-10 bg-[#1877F2]/10 rounded-lg flex items-center justify-center hover:bg-[#1877F2]/20 transition-colors">
                  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                {/* Instagram */}
                <a href="#" className="w-10 h-10 bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity">
                  <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-border pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-text-muted text-sm">
              <p>&copy; 2026 Contribly. All rights reserved.</p>
              <div className="flex gap-6 mt-4 md:mt-0">
                <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
                <a href="https://wa.me/254745169345" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 bg-primary text-white rounded-full shadow-large hover:bg-primary-dark hover:shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center z-50"
          aria-label="Back to top"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
}
