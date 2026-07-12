import React, { useState } from 'react';
import { Save, Shield, Palette, Mail, Globe } from 'lucide-react';

const Configuration: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BRANDING' | 'AUTH' | 'EMAIL'>('BRANDING');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Platform Configuration</h2>
          <p className="text-gray-500">Manage global settings for Prime Impact</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-dark text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
          <Save size={18} />
          Save Changes
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('BRANDING')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'BRANDING' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Palette size={16} /> Branding
        </button>
        <button
          onClick={() => setActiveTab('AUTH')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'AUTH' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Shield size={16} /> Authentication
        </button>
        <button
          onClick={() => setActiveTab('EMAIL')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'EMAIL' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Mail size={16} /> Templates
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        {activeTab === 'BRANDING' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform Name</label>
                <input type="text" defaultValue="Prime Impact" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
                <input type="email" defaultValue="support@primeimpact.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Brand Color</label>
              <div className="flex items-center gap-3">
                <input type="color" defaultValue="#2563EB" className="h-10 w-20 rounded border border-gray-300 cursor-pointer" />
                <span className="text-gray-500 text-sm">#2563EB</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo Upload</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex justify-center mb-2 text-gray-400">
                  <Globe size={32} />
                </div>
                <p className="text-sm text-gray-500">Click or drag to upload logo (PNG, SVG)</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'AUTH' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <h4 className="font-medium text-gray-800">Multi-Factor Authentication (MFA)</h4>
                <p className="text-sm text-gray-500">Require all admins to use 2FA</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <h4 className="font-medium text-gray-800">Single Sign-On (SSO)</h4>
                <p className="text-sm text-gray-500">Enable SAML/OIDC integration</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password Policy</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none">
                <option>Strict (12+ chars, special chars, expire 90 days)</option>
                <option>Standard (8+ chars, numbers)</option>
                <option>Relaxed (6+ chars)</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'EMAIL' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Template Selection</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none">
                <option>Welcome Email</option>
                <option>Course Enrollment</option>
                <option>Completion Certificate</option>
                <option>Password Reset</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
              <input type="text" defaultValue="Welcome to Prime Impact!" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Body Content (HTML)</label>
              <textarea 
                className="w-full h-40 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none font-mono text-sm"
                defaultValue="<p>Dear {FirstName},</p><br/><p>Welcome to the learning portal. Click below to start.</p>"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Configuration;
