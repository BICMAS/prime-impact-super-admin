
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/views/Dashboard';
import Configuration from './components/views/Configuration';
import UserManagement from './components/views/UserManagement';
import CourseManagement from './components/views/CourseManagement';
import LearningPaths from './components/views/LearningPaths';
import Rewards from './components/views/Rewards';
import Login from './components/Login';
import { ViewState } from './types';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('DASHBOARD');
  };

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD': return <Dashboard />;
      case 'CONFIG': return <Configuration />;
      case 'USERS': return <UserManagement />;
      case 'COURSES': return <CourseManagement />;
      case 'PATHS': return <LearningPaths />;
      case 'REWARDS': return <Rewards />;
      default: return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar currentView={currentView} setView={setCurrentView} onLogout={handleLogout} />
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen scroll-smooth">
        <div className="max-w-7xl mx-auto animate-fade-in pb-10">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
