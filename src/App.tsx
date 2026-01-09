import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import TabNavigation from './components/TabNavigation';
import PersoTab from './components/PersoTab';
import GitHubTab from './components/GitHubTab';
import GmailTab from './components/GmailTab';
import InfoModal from './components/InfoModal';
import ThemeToggle from './components/ThemeToggle';

function AppContent() {
  const [activeTab, setActiveTab] = useState('perso');
  const [showInfoModal, setShowInfoModal] = useState(false);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'perso':
        return <PersoTab />;
      case 'github':
        return <GitHubTab />;
      case 'gmail':
        return <GmailTab />;
      default:
        return <PersoTab />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Todo Manager
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setShowInfoModal(true)}
            className="w-7 h-7 flex items-center justify-center rounded-full 
                                   text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                                   hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Configuration API"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <main className="flex-1 overflow-hidden">
        {renderActiveTab()}
      </main>

      {/* Info Modal */}
      <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
