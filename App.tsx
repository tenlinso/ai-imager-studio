
import React, { useState, useEffect } from 'react';
import { ImageGenerator } from './components/ImageGenerator';
import { AdminPanel } from './components/AdminPanel';
import * as Store from './services/store';
import { SiteConfig, AIModel } from './types';
import { t } from './services/translations';

const App: React.FC = () => {
  const [showAdmin, setShowAdmin] = useState(false);
  const [config, setConfig] = useState<SiteConfig>(Store.getSiteConfig());
  const [activeModel, setActiveModel] = useState<AIModel>(Store.getActiveModel());

  const currentLang = config.language || 'en';

  // Refresh data when admin updates settings
  const handleConfigUpdate = () => {
    setConfig(Store.getSiteConfig());
    setActiveModel(Store.getActiveModel());
  };

  useEffect(() => {
    document.title = config.title;
  }, [config.title]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Sticky Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold">
              AI
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 truncate">{config.title}</h1>
          </div>
          
          <nav className="flex items-center gap-4 flex-shrink-0">
            <button 
              onClick={() => setShowAdmin(true)}
              className="text-sm font-medium text-gray-500 hover:text-primary transition-colors px-3 py-1.5 rounded-md hover:bg-gray-50"
            >
              {t(currentLang, 'app.adminAccess')}
            </button>
          </nav>
        </div>
      </header>

      {/* Admin Overlay - Full screen on mobile, modal on desktop */}
      {showAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-0 md:p-4 backdrop-blur-sm">
          <div className="w-full h-full md:h-auto md:max-w-5xl bg-white md:rounded-xl overflow-hidden">
             <AdminPanel 
               onClose={() => setShowAdmin(false)} 
               onConfigUpdate={handleConfigUpdate}
             />
          </div>
        </div>
      )}

      {/* Main Content - Responsive Padding */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12 space-y-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight break-words">
            {config.title}
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto whitespace-pre-wrap px-2">
            {config.description}
          </p>
          
          <div className="inline-flex flex-col sm:flex-row items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 max-w-full">
            <span className="text-xs sm:text-sm font-medium text-blue-800 whitespace-nowrap">{t(currentLang, 'app.poweredBy')}</span>
            <span className="text-xs sm:text-sm font-bold text-blue-600 truncate max-w-[200px]">{activeModel.name}</span>
          </div>
        </div>

        <ImageGenerator activeModel={activeModel} language={currentLang} />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} {config.title}. {t(currentLang, 'app.rights')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
