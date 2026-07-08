import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import OverviewDashboard from './pages/OverviewDashboard';
import StockManagement from './pages/StockManagement';
import DemandForecast from './pages/DemandForecast';
import RedistributionSuggestions from './pages/RedistributionSuggestions';
import BedsAndPatients from './pages/BedsAndPatients';
import StaffAttendance from './pages/StaffAttendance';
import LabAndTests from './pages/LabAndTests';
import AIAssistant from './components/AIAssistant';
import SimulationSandbox from './pages/SimulationSandbox';

const App = () => {
  const { user, token, loading } = useAuth();
  const { theme } = useTheme();
  
  // State-based routing
  const [currentPage, setCurrentPage] = useState('landing');
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => window.innerWidth < 768);
  
  // Perspective control (for district administrators)
  const [selectedCenterId, setSelectedCenterId] = useState('DISTRICT');

  // Handle route protection and redirect loops
  useEffect(() => {
    if (!loading) {
      if (token) {
        // If logged in, go to dashboard
        if (currentPage === 'landing' || currentPage === 'login' || currentPage === 'signup') {
          setCurrentPage('dashboard');
        }
      } else {
        // If not logged in, prevent dashboard viewing
        if (currentPage === 'dashboard') {
          setCurrentPage('landing');
        }
      }
    }
  }, [token, loading, currentPage]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-[#f1f5f9]' : 'bg-[#0b0f19]'}`}>
        <span className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Render Auth and Landing Screens
  if (currentPage === 'landing') {
    return <LandingPage onNavigate={setCurrentPage} />;
  }

  if (currentPage === 'login') {
    return <LoginPage onNavigate={setCurrentPage} />;
  }

  if (currentPage === 'signup') {
    return <SignupPage onNavigate={setCurrentPage} />;
  }

  // Render Shell Dashboard Frame
  if (currentPage === 'dashboard') {
    return (
      <div className={`min-h-screen flex font-sans ${theme === 'light' ? 'bg-[#f1f5f9]' : 'bg-[#060913]'}`}>
        
        {/* Navigation Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isCollapsed={isSidebarCollapsed} 
          setIsCollapsed={setIsSidebarCollapsed} 
        />

        {/* Mobile Sidebar Overlay Backdrop */}
        {!isSidebarCollapsed && (
          <div 
            onClick={() => setIsSidebarCollapsed(true)} 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden"
          />
        )}

        {/* Core Main Area - Responsive Padding */}
        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 pl-0 ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
          
          {/* Main Top Header */}
          <Header 
            selectedCenterId={selectedCenterId} 
            setSelectedCenterId={setSelectedCenterId} 
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
          />

          {/* Dynamic Tab Inner Content */}
          <main className="p-4 sm:p-6 md:p-8 flex-grow">
            {activeTab === 'overview' && (
              <OverviewDashboard 
                selectedCenterId={selectedCenterId} 
                setSelectedCenterId={setSelectedCenterId} 
              />
            )}
            {activeTab === 'inventory' && (
              <StockManagement 
                selectedCenterId={selectedCenterId} 
              />
            )}
            {activeTab === 'forecast' && (
              <DemandForecast 
                selectedCenterId={selectedCenterId} 
              />
            )}
            {activeTab === 'redistribution' && (
              <RedistributionSuggestions 
                selectedCenterId={selectedCenterId} 
              />
            )}
            {activeTab === 'beds' && (
              <BedsAndPatients 
                selectedCenterId={selectedCenterId} 
              />
            )}
            {activeTab === 'staff' && (
              <StaffAttendance 
                selectedCenterId={selectedCenterId} 
              />
            )}
            {activeTab === 'lab' && (
              <LabAndTests 
                selectedCenterId={selectedCenterId} 
              />
            )}
            {activeTab === 'simulation' && (
              <SimulationSandbox />
            )}
          </main>

          {/* Floating interactive AI Copilot assistant */}
          <AIAssistant />
        </div>

      </div>
    );
  }

  return null;
};

export default App;
