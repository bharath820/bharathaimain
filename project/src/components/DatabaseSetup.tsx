import React, { useState } from 'react';
import { X, Info, Check } from 'lucide-react';

interface DatabaseSetupProps {
  onComplete: () => void;
  onClose: () => void;
}

export const DatabaseSetup: React.FC<DatabaseSetupProps> = ({ onComplete, onClose }) => {
  const [selectedMode, setSelectedMode] = useState<'production' | 'test'>('production');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    // Simulate database creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsCreating(false);
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Create database</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="bg-gray-800 px-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                <Check size={14} />
              </div>
              <span className="text-gray-300 text-sm">Set name and location</span>
            </div>
            <div className="w-12 h-px bg-gray-600"></div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                2
              </div>
              <span className="text-white text-sm font-semibold">Secure rules</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Info Section */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-gray-700 text-sm">
              After you define your data structure, <strong>you will need to write rules to secure your data.</strong>
            </p>
            <a href="#" className="text-blue-600 hover:text-blue-700 text-sm inline-flex items-center gap-1 mt-1">
              Learn more
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Mode Selection */}
            <div className="space-y-4">
              {/* Production Mode */}
              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedMode === 'production' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedMode('production')}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                    selectedMode === 'production' 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {selectedMode === 'production' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Start in <strong>production mode</strong>
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Your data is private by default. Client read/write access will only be granted as specified by your security rules.
                    </p>
                  </div>
                </div>
              </div>

              {/* Test Mode */}
              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedMode === 'test' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedMode('test')}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                    selectedMode === 'test' 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {selectedMode === 'test' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Start in <strong>test mode</strong>
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Your data is open by default to enable quick setup. However, you must update your security rules within 30 days to enable long-term client read/write access.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Code Preview */}
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono">
                <div className="text-gray-400 mb-2">rules_version = '2';</div>
                <div className="text-gray-400 mb-2"></div>
                <div className="text-blue-400">service cloud.firestore {`{`}</div>
                <div className="text-blue-400 ml-2">match /databases/{`{database}`}/documents {`{`}</div>
                <div className="text-blue-400 ml-4">match /{`{document=**}`} {`{`}</div>
                <div className="text-red-400 ml-6">
                  allow <span className="text-green-400">read</span>, <span className="text-green-400">write</span>: if {selectedMode === 'production' ? 'false' : 'true'};
                </div>
                <div className="text-blue-400 ml-4">{`}`}</div>
                <div className="text-blue-400 ml-2">{`}`}</div>
                <div className="text-blue-400">{`}`}</div>
              </div>

              {/* Warning */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  <strong>All third party reads and writes will be denied</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};