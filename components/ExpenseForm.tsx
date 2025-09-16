"use client";

interface ExpenseFormProps {
  amount: string;
  setAmount: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  person: string;
  handlePersonChange: (value: string) => void;
  storeName: string;
  setStoreName: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  showStoreDropdown: boolean;
  setShowStoreDropdown: (value: boolean) => void;
  filteredStores: string[];
  handleStoreSelect: (store: string) => void;
  addExpense: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleCameraCapture: () => void;
  isProcessingReceipt: boolean;
}

export default function ExpenseForm({
  amount,
  setAmount,
  category,
  setCategory,
  person,
  handlePersonChange,
  storeName,
  setStoreName,
  description,
  setDescription,
  showStoreDropdown,
  setShowStoreDropdown,
  filteredStores,
  handleStoreSelect,
  addExpense,
  handleCameraCapture,
  isProcessingReceipt,
}: ExpenseFormProps) {
  return (
    <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
      <form onSubmit={addExpense} className="space-y-3">
        <input
          type="number"
          step="0.01"
          placeholder="Amount (₪)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-3 border border-gray-200 rounded-lg text-base bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
          required
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-3 border border-gray-200 rounded-lg text-base bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors appearance-none"
        >
          {/* Daily/Very Frequent */}
          <option value="groceries">🛒 Groceries</option>
          <option value="bakery">🥖 Bakery</option>
          <option value="pharm">💊 Pharmacy</option>

          {/* Weekly/Regular Used*/}
          <option value="restaurant">🍽️ Restaurant</option>
          <option value="entertainment">🎬 Entertainment</option>
          <option value="beauty">💄 Beauty</option>
          <option value="transport">🚌 Transport</option>

          {/* Occasional but Regular */}
          <option value="health">🏥 Health</option>
          <option value="clothing">👕 Clothing</option>
          <option value="subscriptions">📺 Subscriptions</option>

          {/* Less Frequent */}
          <option value="electronics">💻 Electronics</option>
          <option value="travel">✈️ Travel</option>
          <option value="education">📚 Education</option>
          <option value="gifts">🎁 Gifts</option>

          {/* Monthly Bills (once per month) */}
          <option value="apartment">🏠 Apartment</option>
          <option value="electricity">⚡ Electricity</option>
          <option value="water">💧 Water</option>
          <option value="gas">🔥 Gas</option>
          <option value="internet">🌐 Internet</option>
          <option value="insurance">🛡️ Insurance</option>
          <option value="mobile">📱 Mobile</option>

          {/* Catch-all */}
          <option value="other">📝 Other</option>
        </select>

        <select
          value={person}
          onChange={(e) => handlePersonChange(e.target.value)}
          className="w-full p-3 border border-gray-200 rounded-lg text-base bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors appearance-none"
        >
          <option value="ana">👩 Ana</option>
          <option value="husband">👨 Eido</option>
        </select>

        <div className="relative">
          <input
            type="text"
            placeholder="Store name"
            value={storeName}
            onChange={(e) => {
              setStoreName(e.target.value);
              setShowStoreDropdown(true);
            }}
            onFocus={() => setShowStoreDropdown(true)}
            onBlur={() => setTimeout(() => setShowStoreDropdown(false), 200)}
            className="w-full p-3 border border-gray-200 rounded-lg text-base bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
            required
          />

          {showStoreDropdown && filteredStores.length > 0 && (
            <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg">
              {filteredStores.map((store, index) => (
                <div
                  key={index}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => handleStoreSelect(store)}
                >
                  {store}
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          type="text"
          placeholder="Comment (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 border border-gray-200 rounded-lg text-base bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
        />

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium text-base hover:bg-green-700 active:scale-95 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-green-100 flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Add Expense
        </button>

        {/* Camera button for scan*/}
        <button
          type="button"
          onClick={handleCameraCapture}
          disabled={isProcessingReceipt}
          className={`w-full border border-gray-200 text-gray-700 py-3 px-4 rounded-lg flex items-center justify-center gap-2 mb-2 transition-colors ${
            isProcessingReceipt 
              ? 'bg-gray-100 cursor-not-allowed opacity-50' 
              : 'hover:bg-gray-50'
          }`}
        >
          {isProcessingReceipt ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing Receipt...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="black"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Scan Receipt
            </>
          )}
        </button>
        {/* AI Caption */}
        <p className="text-xs text-gray-400 text-center mb-3">
          🤖 Powered by Qwen 2.5 VL 72B AI
        </p>
      </form>
    </div>
  );
}
