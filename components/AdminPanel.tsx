
import React, { useState, useMemo, useEffect } from 'react';
import { SiteConfig, AIModel, Language } from '../types';
import * as Store from '../services/store';
import { Button } from './Button';
import { t } from '../services/translations';

interface AdminPanelProps {
  onClose: () => void;
  onConfigUpdate: () => void;
}

type Tab = 'settings' | 'models' | 'about';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, onConfigUpdate }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(Store.checkAdminAuth());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // UI State
  const [activeTab, setActiveTab] = useState<Tab>('settings');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data State
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(Store.getSiteConfig());
  const [models, setModels] = useState<AIModel[]>(Store.getModels());
  
  // Model Management State
  const [searchQuery, setSearchQuery] = useState('');
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [modelFormName, setModelFormName] = useState('gemini-2.5-flash-image');
  const [modelFormKey, setModelFormKey] = useState('');

  const currentLang = siteConfig.language || 'en';

  // Login Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === '123') {
      Store.setAdminAuth(true);
      setIsLoggedIn(true);
      setError('');
    } else {
      setError('Invalid credentials');
    }
  };

  const handleLogout = () => {
    Store.setAdminAuth(false);
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
  };

  const showSuccess = () => {
    setSuccessMsg(t(currentLang, 'settings.success'));
  };

  // --- Site Config Logic ---
  const handleSaveSiteConfig = (e: React.FormEvent) => {
    e.preventDefault();
    Store.saveSiteConfig(siteConfig);
    onConfigUpdate();
    showSuccess();
  };

  // --- Model Logic ---
  const filteredModels = useMemo(() => {
    return models.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.includes(searchQuery)
    );
  }, [models, searchQuery]);

  const resetModelForm = () => {
    setEditingModelId(null);
    setModelFormName('gemini-2.5-flash-image');
    setModelFormKey('');
  };

  const handleEditModel = (model: AIModel) => {
    setEditingModelId(model.id);
    setModelFormName(model.name);
    setModelFormKey(model.apiKey);
  };

  const handleSaveModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelFormName || !modelFormKey) return;

    let updatedModels: AIModel[];

    if (editingModelId) {
      // Update existing
      updatedModels = models.map(m => 
        m.id === editingModelId 
          ? { ...m, name: modelFormName, apiKey: modelFormKey }
          : m
      );
    } else {
      // Add new
      const newModel: AIModel = {
        id: Date.now().toString(),
        name: modelFormName,
        apiKey: modelFormKey,
        isDefault: models.length === 0,
        isEnabled: true
      };
      updatedModels = [...models, newModel];
    }

    setModels(updatedModels);
    Store.saveModels(updatedModels);
    onConfigUpdate();
    resetModelForm();
    showSuccess();
  };

  const handleDeleteModel = (id: string) => {
    if (!window.confirm("Are you sure?")) return;
    const updatedModels = models.filter(m => m.id !== id);
    setModels(updatedModels);
    Store.saveModels(updatedModels);
    onConfigUpdate();
    if (editingModelId === id) resetModelForm();
  };

  const handleSetDefault = (id: string) => {
    const updatedModels = models.map(m => ({
      ...m,
      isDefault: m.id === id,
      // If making default, ensure it is enabled
      isEnabled: m.id === id ? true : m.isEnabled
    }));
    setModels(updatedModels);
    Store.saveModels(updatedModels);
    onConfigUpdate();
    showSuccess();
  };

  const handleToggleEnabled = (id: string, currentStatus: boolean) => {
    const model = models.find(m => m.id === id);
    if (model?.isDefault && currentStatus === true) {
      alert(t(currentLang, 'models.cannotDisableDefault'));
      return;
    }

    const updatedModels = models.map(m => 
      m.id === id ? { ...m, isEnabled: !currentStatus } : m
    );
    setModels(updatedModels);
    Store.saveModels(updatedModels);
    onConfigUpdate();
  };

  // --- Render Logic ---

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">{t(currentLang, 'admin.title')}</h2>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t(currentLang, 'admin.username')}</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t(currentLang, 'admin.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="123"
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
            <div className="flex justify-between gap-3 mt-6">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">{t(currentLang, 'admin.cancel')}</Button>
              <Button type="submit" className="flex-1">{t(currentLang, 'admin.login')}</Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-auto border border-gray-100 overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[85vh] relative">
      
      {/* Success Notification */}
      {successMsg && (
        <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-center py-2 font-bold z-[60] shadow-md animate-bounce-in">
          {successMsg}
        </div>
      )}

      {/* Mobile Header for Menu Toggle */}
      <div className="md:hidden bg-slate-50 border-b border-gray-200 p-4 flex justify-between items-center">
        <span className="font-bold text-gray-700">{t(currentLang, 'dashboard.title')}</span>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-gray-600 hover:text-primary focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>

      {/* Sidebar Menu */}
      <div className={`
        w-full md:w-64 bg-slate-50 border-r border-gray-200 flex flex-col
        transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'max-h-[500px]' : 'max-h-0 md:max-h-full'}
        overflow-hidden md:overflow-visible
      `}>
        <div className="p-6 border-b border-gray-200 hidden md:block">
          <h2 className="text-xl font-bold text-gray-800">{t(currentLang, 'dashboard.title')}</h2>
          <p className="text-xs text-gray-500 mt-1">{t(currentLang, 'dashboard.subtitle')}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3 ${activeTab === 'settings' ? 'bg-white shadow-sm text-primary ring-1 ring-gray-200' : 'text-gray-600 hover:bg-gray-100'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {t(currentLang, 'dashboard.settings')}
          </button>
          <button onClick={() => { setActiveTab('models'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3 ${activeTab === 'models' ? 'bg-white shadow-sm text-primary ring-1 ring-gray-200' : 'text-gray-600 hover:bg-gray-100'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            {t(currentLang, 'dashboard.models')}
          </button>
          <button onClick={() => { setActiveTab('about'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3 ${activeTab === 'about' ? 'bg-white shadow-sm text-primary ring-1 ring-gray-200' : 'text-gray-600 hover:bg-gray-100'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {t(currentLang, 'dashboard.about')}
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">
           <Button variant="secondary" onClick={handleLogout} className="w-full text-sm">{t(currentLang, 'dashboard.logout')}</Button>
           <Button variant="outline" onClick={onClose} className="w-full text-sm">{t(currentLang, 'dashboard.close')}</Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white overflow-y-auto p-4 md:p-8">
        
        {/* --- Tab: Site Settings --- */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-2xl animate-fade-in">
            <h3 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-6">{t(currentLang, 'settings.title')}</h3>
            <form onSubmit={handleSaveSiteConfig} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t(currentLang, 'settings.websiteTitle')}</label>
                  <input
                    type="text"
                    value={siteConfig.title}
                    onChange={(e) => setSiteConfig({ ...siteConfig, title: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t(currentLang, 'settings.language')}</label>
                  <select
                    value={siteConfig.language}
                    onChange={(e) => setSiteConfig({ ...siteConfig, language: e.target.value as Language })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                  >
                    <option value="en">English</option>
                    <option value="zh-TW">繁體中文 (Traditional Chinese)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t(currentLang, 'settings.websiteDesc')}</label>
                <textarea
                  value={siteConfig.description}
                  onChange={(e) => setSiteConfig({ ...siteConfig, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none h-32 resize-none"
                />
              </div>
              <div className="pt-4">
                <Button type="submit">{t(currentLang, 'settings.save')}</Button>
              </div>
            </form>
          </div>
        )}

        {/* --- Tab: Model Management --- */}
        {activeTab === 'models' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-2">
              <h3 className="text-2xl font-bold text-gray-800">{t(currentLang, 'models.title')}</h3>
              <div className="text-sm text-gray-500">Total: {models.length}</div>
            </div>
            
            {/* Editor Section */}
            <div className="bg-slate-50 p-4 md:p-6 rounded-xl border border-slate-200">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                {editingModelId ? t(currentLang, 'models.update') : t(currentLang, 'models.add')}
              </h4>
              <form onSubmit={handleSaveModel} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                 <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t(currentLang, 'models.name')}</label>
                  <input 
                    type="text"
                    value={modelFormName}
                    onChange={(e) => setModelFormName(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>
                <div className="md:col-span-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t(currentLang, 'models.key')}</label>
                  <input
                    type="text"
                    value={modelFormKey}
                    onChange={(e) => setModelFormKey(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none font-mono text-sm"
                    required
                  />
                </div>
                <div className="md:col-span-3 flex gap-2">
                  <Button type="submit" className="w-full">
                    {editingModelId ? t(currentLang, 'models.update') : t(currentLang, 'models.add')}
                  </Button>
                  {editingModelId && (
                    <Button type="button" variant="outline" onClick={resetModelForm}>
                      {t(currentLang, 'models.cancel')}
                    </Button>
                  )}
                </div>
              </form>
            </div>

            {/* Search & List Section */}
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(currentLang, 'models.search')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary outline-none"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>

              <div className="space-y-3">
                {filteredModels.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
                    {t(currentLang, 'models.noResult')}
                  </div>
                ) : (
                  filteredModels.map((model) => (
                    <div key={model.id} className={`p-4 border rounded-lg flex flex-col gap-4 transition-all hover:shadow-sm ${model.isDefault ? 'border-blue-400 bg-blue-50/50 ring-1 ring-blue-400' : 'border-gray-200 bg-white'} ${!model.isEnabled ? 'opacity-75 bg-gray-50' : ''}`}>
                      
                      {/* Model Info Row */}
                      <div className="flex items-start justify-between w-full">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className={`font-bold truncate ${!model.isEnabled ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{model.name}</h5>
                            {model.isDefault && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200">{t(currentLang, 'models.default')}</span>
                            )}
                            {!model.isEnabled && (
                              <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 text-xs font-bold">{t(currentLang, 'models.disabled')}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 font-mono mt-1">Key: •••••••••••••••••{model.apiKey.slice(-4)}</p>
                        </div>
                        
                        {/* Toggle Switch */}
                        <div className="flex flex-col items-end ml-4">
                           <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer"
                              checked={model.isEnabled}
                              onChange={() => handleToggleEnabled(model.id, model.isEnabled)}
                              disabled={model.isDefault}
                            />
                            <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${model.isEnabled ? 'peer-checked:bg-blue-600' : 'peer-checked:bg-gray-400'} ${model.isDefault ? 'cursor-not-allowed opacity-50' : ''}`}></div>
                          </label>
                          <span className="text-[10px] text-gray-400 mt-1">{model.isEnabled ? t(currentLang, 'models.enabled') : t(currentLang, 'models.disabled')}</span>
                        </div>
                      </div>
                      
                      {/* Actions Row */}
                      <div className="flex items-center justify-end gap-2 border-t pt-3 border-gray-100">
                        {!model.isDefault && model.isEnabled && (
                          <button 
                            onClick={() => handleSetDefault(model.id)}
                            className="px-3 py-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                          >
                             {t(currentLang, 'models.makeDefault')}
                          </button>
                        )}
                        <button 
                          onClick={() => handleEditModel(model)}
                          className="px-3 py-1.5 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
                        >
                           {t(currentLang, 'models.edit')}
                        </button>
                        <button 
                          onClick={() => handleDeleteModel(model.id)}
                          className="px-3 py-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                        >
                          {t(currentLang, 'models.delete')}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- Tab: About & Help --- */}
        {activeTab === 'about' && (
          <div className="space-y-8 max-w-3xl animate-fade-in">
            <div className="border-b pb-4">
               <h3 className="text-2xl font-bold text-gray-800">{t(currentLang, 'about.title')}</h3>
               <p className="text-gray-500 mt-2">{t(currentLang, 'about.subtitle')}</p>
            </div>

            <div className="grid gap-6">
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                <h4 className="text-lg font-bold text-blue-800 mb-2 flex items-center gap-2">
                  <span className="bg-blue-200 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                  {t(currentLang, 'about.step1.title')}
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  {t(currentLang, 'about.step1.desc')}
                </p>
              </div>

              <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                <h4 className="text-lg font-bold text-emerald-800 mb-2 flex items-center gap-2">
                   <span className="bg-emerald-200 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                   {t(currentLang, 'about.step2.title')}
                </h4>
                <p className="text-gray-700 leading-relaxed">
                   {t(currentLang, 'about.step2.desc')}
                </p>
              </div>

              <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                <h4 className="text-lg font-bold text-purple-800 mb-2 flex items-center gap-2">
                  <span className="bg-purple-200 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                  {t(currentLang, 'about.step3.title')}
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  {t(currentLang, 'about.step3.desc')}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
