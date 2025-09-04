"use client";

interface Expense {
  _id?: string;
  id: number;
  description: string;
  amount: number;
  category: string;
  person: string;
  storeName: string;
  date: string;
}

interface MonthlyTotals {
  anaTotal: number;
  eidoTotal: number;
  monthTotal: number;
}

interface ExpensesListProps {
  filteredExpenses: Expense[];
  showSearchResults: boolean;
  searchMonth: string;
  formatMonthDisplay: (month: string) => string;
  showMonthlySearch: boolean;
  handleSearchClick: () => void;
  availableMonths: string[];
  setSearchMonth: (month: string) => void;
  setShowSearchResults: (show: boolean) => void;
  monthlyTotals: MonthlyTotals;
  handleDeleteClick: (id: number) => void;
  loadMoreMonths: () => Promise<void>;
  hasMoreMonths: boolean;
  isLoadingMore: boolean;
}

export default function ExpensesList({
  filteredExpenses,
  showSearchResults,
  searchMonth,
  formatMonthDisplay,
  showMonthlySearch,
  handleSearchClick,
  availableMonths,
  setSearchMonth,
  setShowSearchResults,
  monthlyTotals,
  handleDeleteClick,
  loadMoreMonths,
  hasMoreMonths,
  isLoadingMore,
}: ExpensesListProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h2 className="font-medium text-gray-900">
          {showSearchResults && searchMonth
            ? `${formatMonthDisplay(searchMonth)} Expenses`
            : "Recent Expenses"}
        </h2>
        <button
          onClick={handleSearchClick}
          className={`p-2 rounded-lg transition-colors ${
            showMonthlySearch
              ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
          aria-label="Search by month"
          title="Search by month"
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>

      {/* Monthly Search Section */}
      {showMonthlySearch && (
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <div className="space-y-3">
            <div className="relative">
              <select
                value={searchMonth}
                onChange={(e) => {
                  setSearchMonth(e.target.value);
                  setShowSearchResults(!!e.target.value);
                }}
                className="w-full p-3 pr-8 border border-gray-200 rounded-lg text-base bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors appearance-none"
              >
                <option value="">Select a month...</option>
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {formatMonthDisplay(month)}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none">
                <svg
                  className="w-4 h-4 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {searchMonth && (
              <button
                onClick={() => {
                  setSearchMonth("");
                  setShowSearchResults(false);
                }}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>

          {/* Monthly Totals Display */}
          {showSearchResults && searchMonth && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                {formatMonthDisplay(searchMonth)} Summary
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">
                    Total Month Spending:
                  </span>
                  <span className="font-semibold text-blue-900">
                    ₪{monthlyTotals.monthTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Ana's Spending:</span>
                  <span className="font-semibold text-green-700">
                    ₪{monthlyTotals.anaTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">
                    Eido's Spending:
                  </span>
                  <span className="font-semibold text-green-700">
                    ₪{monthlyTotals.eidoTotal.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-blue-600 mt-2">
                  {filteredExpenses.length} expense
                  {filteredExpenses.length !== 1 ? "s" : ""} found
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {filteredExpenses.length === 0 ? (
        <div className="p-8 text-center text-gray-500 text-sm">
          {showSearchResults && searchMonth
            ? `No expenses found for ${formatMonthDisplay(searchMonth)} 📅`
            : "No expenses yet. Add your first one! 🎯"}
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filteredExpenses.map((expense) => (
            <div
              key={expense.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 pr-3">
                  <div className="font-medium text-gray-900 leading-tight">
                    {expense.storeName}
                  </div>
                  {expense.description && (
                    <div className="text-xs text-gray-500 mt-1">
                      {expense.description}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-red-600 font-semibold text-right">
                    ₪{expense.amount.toFixed(2)}
                  </div>
                  <button
                    onClick={() => handleDeleteClick(expense.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 active:bg-red-100 p-2 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Delete expense"
                  >
                    <svg
                      className="w-5 h-5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-center text-xs">
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  {expense.category}
                </span>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {expense.person === "husband" ? "eido" : expense.person}
                </span>
                <span className="text-gray-400 ml-auto">{expense.date}</span>
              </div>
            </div>
          ))}
          
          {/* Load More Button - Only show if not searching and there are more months to load */}
          {!showSearchResults && hasMoreMonths && (
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={loadMoreMonths}
                disabled={isLoadingMore}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isLoadingMore 
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                {isLoadingMore ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading previous month...
                  </div>
                ) : (
                  'Load Previous Month'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
