import React, { useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Link, NavLink } from "react-router-dom";
import "./styles/responsiveUtils.css";
import "./styles/rtl.css";

// === HEALTHCARE CORE ===
import RoutingDashboard from "./components/RoutingDashboard.jsx";
import CommandCenterDashboard from "./components/CommandCenterDashboard.jsx";
import PatientVitalsForm from "./components/PatientVitalsForm.jsx";
import HospitalDashboard from "./components/HospitalDashboard.jsx";
import RealTimeHospitalCapability from "./components/RealTimeHospitalCapability.jsx";
import AmbulanceNavigation from "./components/navigation/AmbulanceNavigation.jsx";
import AmbulanceTrackingViewer from "./components/tracking/AmbulanceTrackingViewer.jsx";
import AppErrorBoundary from "./components/AppErrorBoundary.jsx";
import EMSChatAssistant from "./components/ai/EMSChatAssistant.jsx";
import DriverOnboarding from "./pages/DriverOnboarding.jsx";
import VerificationPending from "./pages/VerificationPending.jsx";

// === SHARED COMPONENTS ===
import RealTimeStatusIndicator from "./components/RealTimeStatusIndicator.jsx";
import FeedbackForm from "./components/FeedbackForm.jsx";
import LanguageSwitcher from "./components/LanguageSwitcher.jsx";
import NetworkStatusBanner from "./components/shared/NetworkStatusBanner.jsx";

// === AUTH & INFRASTRUCTURE ===
import AuthProvider, { useAuth } from "./components/auth/AuthProvider.jsx";
import PermissionGuard from "./components/auth/PermissionGuard.jsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import NotAuthorized from "./components/auth/NotAuthorized.jsx";
import LoginForm from "./components/auth/LoginForm.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { useT } from "./hooks/useT.js";


const Nav = () => {
  const { currentUser, role, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Translation hooks for navigation items
  const tRouting = useT("Routing");
  const tCommandCenter = useT("Command Center");
  const tPatientIntake = useT("Patient Intake");
  const tHospitals = useT("Hospitals");
  const tFeedback = useT("Feedback");
  const tEMSPlatform = useT("MEDROUTER");
  const tLogout = useT("Logout");
  const tLogin = useT("Login");
  const tWelcome = useT("Welcome");
  const tRole = useT("Role");

  const tLiveCapacity = useT("Live Capacity");

  const navigationItems = [
    { to: "/routing", label: tRouting, icon: "🗺️" },
    { to: "/command-center", label: tCommandCenter, icon: "🚑" },
    { to: "/intake", label: tPatientIntake, icon: "📝" },
    { to: "/hospitals", label: tHospitals, icon: "🏥" },
    { to: "/live-capacity", label: tLiveCapacity, icon: "📊" },
    { to: "/feedback", label: tFeedback, icon: "💬" },
  ];

  // Hide nav items for ambulance_driver role
  const visibleNavItems = role === 'ambulance_driver' ? [] : navigationItems;

  return (
    <header className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-4 w-full">
        {/* Left side - Logo and Brand */}
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-3 hover:scale-105 transition-transform duration-200">
            <img
              src="/logo.png"
              alt="MEDROUTER Logo"
              className="w-10 h-10 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">MEDROUTER</h1>
              <p className="text-xs text-gray-500 font-medium">Routes That Saves Lives</p>
            </div>
          </Link>
        </div>

        {/* Center - Navigation Items */}
        <nav className="hidden lg:flex items-center space-x-1">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 items-center ${isActive
                  ? "bg-red-100 text-red-700 shadow-sm transform scale-105"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm"
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right side - Language and Login */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:block">
            <RealTimeStatusIndicator />
          </div>

          {/* Language Selector */}
          <LanguageSwitcher />

          {/* User Authentication */}
          {currentUser ? (
            <div className="relative group">
              <button className="flex items-center space-x-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200 transition-all duration-200 shadow-sm hover:shadow-md">
                <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white text-sm font-bold">
                    {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-700 hidden sm:block">
                  {currentUser.displayName || currentUser.email?.split('@')[0] || 'User'}
                </span>
                <svg className="w-4 h-4 text-gray-500 transform group-hover:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform group-hover:translate-y-0 translate-y-1">
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50 rounded-t-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{tWelcome}</div>
                      <div className="text-xs text-gray-600 mt-1">{currentUser.email}</div>
                      <div className="text-xs text-red-600 font-medium">{tRole}: {role}</div>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button
                    onClick={logout}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>{tLogout}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm font-semibold">{tLogin}</span>
            </Link>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden inline-flex items-center justify-center p-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
          >
            <span className="sr-only">Open main menu</span>
            {isMobileMenuOpen ? (
              <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden pb-6 px-4">
          <nav className="space-y-2">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${isActive
                    ? "bg-red-100 text-red-700 shadow-sm transform scale-105"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm"
                  }`
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}

            {/* Mobile Authentication */}
            <div className="pt-6 mt-6 border-t border-gray-200">
              <div className="mb-4">
                <RealTimeStatusIndicator />
              </div>
              {currentUser ? (
                <div className="space-y-3">
                  <div className="px-4 py-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{tWelcome}</div>
                        <div className="text-xs text-gray-600">{currentUser.email}</div>
                        <div className="text-xs text-red-600 font-medium">{tRole}: {role}</div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>{tLogout}</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-sm font-semibold">{tLogin}</span>
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <NetworkStatusBanner />
            <Nav />

            {/* Main Content Area */}
            <main className="flex-1">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Routes>
                  {/* Default Route - Routing Dashboard (Protected) */}
                  <Route path="/" element={
                    <ProtectedRoute><AppErrorBoundary><RoutingDashboard /></AppErrorBoundary></ProtectedRoute>
                  } />

                  {/* Healthcare Core Routes - Role Protected */}
                  <Route path="/routing" element={
                    <ProtectedRoute><AppErrorBoundary><RoutingDashboard /></AppErrorBoundary></ProtectedRoute>
                  } />
                  <Route path="/driver-onboarding" element={
                    <ProtectedRoute><AppErrorBoundary><DriverOnboarding /></AppErrorBoundary></ProtectedRoute>
                  } />
                  <Route path="/command-center" element={
                    <ProtectedRoute><AppErrorBoundary><CommandCenterDashboard /></AppErrorBoundary></ProtectedRoute>
                  } />
                  <Route path="/verification-pending" element={
                    <ProtectedRoute><AppErrorBoundary><VerificationPending /></AppErrorBoundary></ProtectedRoute>
                  } />
                  <Route path="/intake" element={
                    <ProtectedRoute>
                      <AppErrorBoundary>
                        <div className="max-w-4xl mx-auto animate-fadeIn">
                          <PatientVitalsForm />
                        </div>
                      </AppErrorBoundary>
                    </ProtectedRoute>
                  } />
                  <Route path="/hospitals" element={
                    <ProtectedRoute><AppErrorBoundary><HospitalDashboard /></AppErrorBoundary></ProtectedRoute>
                  } />
                  <Route path="/live-capacity" element={
                    <ProtectedRoute>
                      <AppErrorBoundary>
                        <div className="max-w-7xl mx-auto animate-fadeIn">
                          <RealTimeHospitalCapability />
                        </div>
                      </AppErrorBoundary>
                    </ProtectedRoute>
                  } />

                  {/* Navigation & Tracking Routes */}
                  <Route path="/navigate" element={
                    <ProtectedRoute>
                      <AppErrorBoundary>
                        <AmbulanceNavigation />
                      </AppErrorBoundary>
                    </ProtectedRoute>
                  } />
                  <Route path="/track/:ambulanceId" element={
                    <AppErrorBoundary>
                      <AmbulanceTrackingViewer />
                    </AppErrorBoundary>
                  } />

                  {/* Shared Routes */}
                  <Route path="/feedback" element={
                    <div className="max-w-2xl mx-auto animate-fadeIn">
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Share Your Feedback</h2>
                        <p className="text-gray-600">Help us improve MEDROUTER with your valuable feedback and suggestions.</p>
                      </div>
                      <FeedbackForm />
                    </div>
                  } />

                  {/* Authorization Route */}
                  <Route path="/not-authorized" element={<NotAuthorized />} />

                  {/* Auth Routes */}
                  <Route path="/login" element={
                    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                      <div className="max-w-md w-full">
                        <div className="text-center mb-8">
                          <img
                            src="/logo.png"
                            alt="MEDROUTER Logo"
                            className="w-32 h-32 mx-auto mb-4 object-contain drop-shadow-lg"
                          />
                          <h2 className="text-2xl font-bold text-gray-900">MEDROUTER</h2>
                          <p className="text-gray-600 mt-2">Routes That Saves Lives</p>
                        </div>
                        <div className="card">
                          <div className="card-body">
                            <LoginForm />
                          </div>
                        </div>
                      </div>
                    </div>
                  } />
                  <Route path="/auth" element={
                    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                      <div className="max-w-md w-full">
                        <div className="text-center mb-8">
                          <img
                            src="/logo.png"
                            alt="MEDROUTER Logo"
                            className="w-32 h-32 mx-auto mb-4 object-contain drop-shadow-lg"
                          />
                          <h2 className="text-2xl font-bold text-gray-900">MEDROUTER</h2>
                          <p className="text-gray-600 mt-2">Routes That Saves Lives</p>
                        </div>
                        <div className="card">
                          <div className="card-body">
                            <LoginForm />
                          </div>
                        </div>
                      </div>
                    </div>
                  } />
                </Routes>
              </div>
            </main>

            {/* Footer */}
            <footer className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 mt-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col items-center">
                  <div className="flex items-center space-x-3 mb-4">
                    <img
                      src="/logo.png"
                      alt="MEDROUTER Logo"
                      className="w-8 h-8 object-contain"
                    />
                    <span className="text-lg font-semibold text-gray-900">MEDROUTER</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>© 2025 MEDROUTER</span>
                      <span>•</span>
                      <span>Hackathon Project</span>
                      <span>•</span>
                      <span className="text-red-600 hover:text-red-700 cursor-pointer font-medium">v2.0</span>
                    </div>
                    <p className="text-xs text-gray-500 text-center max-w-md">
                      MEDROUTER — Routes That Saves Lives
                    </p>
                  </div>
                </div>
              </div>
            </footer>

            {/* AI Copilot Chat Widget */}
            <EMSChatAssistant />
          </div>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
