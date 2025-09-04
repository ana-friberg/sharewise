"use client";

interface ConversionEntry {
  id_name: string;
  store_name: string;
  category: string;
  comment: string;
}

interface SharedAccountSettings {
  sharedAccountBalance: number;
}

interface ModalsProps {
  showDeleteModal: boolean;
  confirmDelete: () => Promise<void>;
  cancelDelete: () => void;
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  sharedAccountSettings: SharedAccountSettings;
  setSharedAccountSettings: (settings: SharedAccountSettings) => void;
  updateSharedAccountSettings: (balance: number) => Promise<void>;
  exportData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  showConversionTable: boolean;
  setShowConversionTable: (show: boolean) => void;
  loadConversionEntries: () => Promise<void>;
  conversionEntries: any[];
  newConversionEntry: ConversionEntry;
  setNewConversionEntry: (updater: (prev: ConversionEntry) => ConversionEntry) => void;
  addConversionEntry: () => Promise<void>;
  conversionMessage: string;
}

export default function Modals({
  showDeleteModal,
  confirmDelete,
  cancelDelete,
  showSettingsModal,
  setShowSettingsModal,
  sharedAccountSettings,
  setSharedAccountSettings,
  updateSharedAccountSettings,
  exportData,
  clearAllData,
  showConversionTable,
  setShowConversionTable,
  loadConversionEntries,
  conversionEntries,
  newConversionEntry,
  setNewConversionEntry,
  addConversionEntry,
  conversionMessage,
}: ModalsProps) {
  return (
    <>
      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-auto shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Settings</h3>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Account Settings
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Shared Account Balance (₪)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={sharedAccountSettings.sharedAccountBalance}
                      onChange={(e) => {
                        const balance = parseFloat(e.target.value) || 0;
                        setSharedAccountSettings({
                          sharedAccountBalance: balance,
                        });
                      }}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <div className="font-medium text-blue-600">
                    Current Balance: ₪
                    {sharedAccountSettings.sharedAccountBalance.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Store Conversion Table
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setShowConversionTable(!showConversionTable);
                      if (!showConversionTable) {
                        loadConversionEntries();
                      }
                    }}
                    className="w-full bg-blue-100 text-blue-800 py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                  >
                    {showConversionTable ? 'Hide' : 'Manage'} Conversion Table
                  </button>
                </div>
              </div>

              {showConversionTable && (
                <div className="border-t pt-4">
                  <div className="space-y-4">
                    {/* Add new conversion entry form */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h5 className="text-xs font-medium text-gray-700 mb-2">Add New Entry</h5>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="ID Name (lowercase, for matching)"
                          value={newConversionEntry.id_name}
                          onChange={(e) => setNewConversionEntry(prev => ({
                            ...prev,
                            id_name: e.target.value.toLowerCase()
                          }))}
                          className="w-full p-2 border border-gray-200 rounded text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Display Store Name"
                          value={newConversionEntry.store_name}
                          onChange={(e) => setNewConversionEntry(prev => ({
                            ...prev,
                            store_name: e.target.value
                          }))}
                          className="w-full p-2 border border-gray-200 rounded text-xs"
                        />
                        <select
                          value={newConversionEntry.category}
                          onChange={(e) => setNewConversionEntry(prev => ({
                            ...prev,
                            category: e.target.value
                          }))}
                          className="w-full p-2 border border-gray-200 rounded text-xs"
                        >
                          <option value="groceries">🛒 Groceries</option>
                          <option value="bakery">🥖 Bakery</option>
                          <option value="pharm">💊 Pharmacy</option>
                          <option value="restaurant">🍽️ Restaurant</option>
                          <option value="entertainment">🎬 Entertainment</option>
                          <option value="beauty">💄 Beauty</option>
                          <option value="transport">🚌 Transport</option>
                          <option value="health">🏥 Health</option>
                          <option value="clothing">👕 Clothing</option>
                          <option value="subscriptions">📺 Subscriptions</option>
                          <option value="electronics">💻 Electronics</option>
                          <option value="travel">✈️ Travel</option>
                          <option value="education">📚 Education</option>
                          <option value="gifts">🎁 Gifts</option>
                          <option value="apartment">🏠 Apartment</option>
                          <option value="electricity">⚡ Electricity</option>
                          <option value="water">💧 Water</option>
                          <option value="gas">🔥 Gas</option>
                          <option value="internet">🌐 Internet</option>
                          <option value="insurance">🛡️ Insurance</option>
                          <option value="mobile">📱 Mobile</option>
                          <option value="other">📝 Other</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Comment (optional)"
                          value={newConversionEntry.comment}
                          onChange={(e) => setNewConversionEntry(prev => ({
                            ...prev,
                            comment: e.target.value
                          }))}
                          className="w-full p-2 border border-gray-200 rounded text-xs"
                        />
                        <button
                          onClick={addConversionEntry}
                          className="w-full bg-green-600 text-white py-1 px-2 rounded text-xs hover:bg-green-700 transition-colors"
                        >
                          Add Entry
                        </button>
                        
                        {/* Success/Error Message */}
                        {conversionMessage && (
                          <div className={`text-xs text-center mt-2 p-2 rounded ${
                            conversionMessage.includes('successfully') || conversionMessage.includes('Successfully')
                              ? 'text-green-700 bg-green-50' 
                              : 'text-red-700 bg-red-50'
                          }`}>
                            {conversionMessage}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Data Management
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={exportData}
                    className="w-full bg-green-100 text-green-800 py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                  >
                    Export Data
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="flex-1 bg-gray-100 text-gray-900 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  updateSharedAccountSettings(
                    sharedAccountSettings.sharedAccountBalance
                  )
                }
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-auto shadow-xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5C2.962 18.167 3.924 19 5.464 19z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Delete Expense
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this expense? This action cannot
                be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 bg-gray-100 text-gray-900 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors min-h-[48px]"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors min-h-[48px]"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}