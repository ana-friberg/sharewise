"use client";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

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

interface ContributionSettings {
  anaAmount: number;
  husbandAmount: number;
  totalBudget: number;
}

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("groceries");
  const [person, setPerson] = useState("ana");
  const [storeName, setStoreName] = useState("");
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [filteredStores, setFilteredStores] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<number | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [contributionSettings, setContributionSettings] =
    useState<ContributionSettings>({
      anaAmount: 765,
      husbandAmount: 935,
      totalBudget: 1700,
    });
  const [isLoading, setIsLoading] = useState(true);

  // Search functionality
  const [searchMonth, setSearchMonth] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showMonthlySearch, setShowMonthlySearch] = useState(false);

  // Load data from MongoDB on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load expenses
      const expensesResponse = await fetch("/api/expenses");
      if (expensesResponse.ok) {
        const expensesData = await expensesResponse.json();
        setExpenses(expensesData.expenses || []);
      }

      // Load contribution settings
      try {
        const settingsResponse = await fetch("/api/settings");
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          if (settingsData.settings) {
            setContributionSettings(settingsData.settings);
          }
        }
      } catch (settingsError) {
        // Keep the default settings already set in state
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter expenses by selected month
  const getFilteredExpenses = () => {
    if (!searchMonth) return expenses;

    return expenses.filter((expense) => {
      const expenseDate = expense.date; // Format: DD/MM/YYYY
      const [, month, year] = expenseDate.split("/"); // Use comma to skip 'day'
      const expenseMonthYear = `${year}-${month.padStart(2, "0")}`;
      return expenseMonthYear === searchMonth;
    });
  };

  // Calculate monthly totals
  const getMonthlyTotals = (filteredExpenses: Expense[]) => {
    const anaTotal = filteredExpenses
      .filter((e) => e.person === "ana")
      .reduce((sum, e) => sum + e.amount, 0);

    const eidoTotal = filteredExpenses
      .filter((e) => e.person === "husband")
      .reduce((sum, e) => sum + e.amount, 0);

    const monthTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    return { anaTotal, eidoTotal, monthTotal };
  };

  // Get available months from expenses
  const getAvailableMonths = () => {
    const months = expenses.map((expense) => {
      const [, month, year] = expense.date.split("/"); // Use comma to skip 'day'
      return `${year}-${month.padStart(2, "0")}`;
    });

    const uniqueMonths = [...new Set(months)].sort().reverse();
    return uniqueMonths;
  };

  // Format month for display
  const formatMonthDisplay = (monthValue: string) => {
    if (!monthValue) return "";
    const [year, month] = monthValue.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const getUniqueStores = (): string[] => {
    const stores = expenses
      .map((expense) => expense.storeName)
      .filter((store) => store && store.trim() !== "")
      .filter((store, index, arr) => arr.indexOf(store) === index)
      .sort();
    return stores;
  };

  useEffect(() => {
    if (storeName) {
      const uniqueStores = getUniqueStores();
      const filtered = uniqueStores.filter((store) =>
        store.toLowerCase().includes(storeName.toLowerCase())
      );
      setFilteredStores(filtered);
    } else {
      setFilteredStores([]);
    }
  }, [storeName, expenses]);

  // Add this validation function at the top of your component:
  const validateExpenseInput = (data: any) => {
    const errors: string[] = [];

    // Validate amount
    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0 || amount > 999999) {
      errors.push("Amount must be a positive number less than 1,000,000");
    }

    // Validate store name
    if (
      !data.storeName ||
      data.storeName.trim().length < 1 ||
      data.storeName.length > 100
    ) {
      errors.push("Store name must be between 1-100 characters");
    }

    // Validate description
    if (data.description && data.description.length > 500) {
      errors.push("Description cannot exceed 500 characters");
    }

    // Validate category
    const validCategories = [
      "groceries",
      "food",
      "bills",
      "entertainment",
      "transport",
      "shopping",
      "utilities",
      "healthcare",
      "other",
    ];
    if (!validCategories.includes(data.category)) {
      errors.push("Invalid category");
    }

    // Validate person
    const validPersons = ["ana", "husband"];
    if (!validPersons.includes(data.person)) {
      errors.push("Invalid person");
    }

    return errors;
  };

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !storeName) return;

    try {
      const inputData = { amount, storeName, description, category, person };
      const validationErrors = validateExpenseInput(inputData);

      if (validationErrors.length > 0) {
        alert(`Validation errors:\n${validationErrors.join("\n")}`);
        return;
      }

      const now = new Date();
      const formattedDate = `${now.getDate().toString().padStart(2, "0")}/${(
        now.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${now.getFullYear()}`;

      const expenseData = {
        description: description.trim().substring(0, 500), // Limit length
        amount: Math.round(parseFloat(amount) * 100) / 100, // Round to 2 decimals
        category,
        person,
        storeName: storeName.trim().substring(0, 100), // Limit length
        date: formattedDate,
      };

      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expenseData),
      });

      if (response.ok) {
        const data = await response.json();
        setExpenses((prev) => [data.expense, ...prev]);

        // Reset form
        setDescription("");
        setAmount("");
        setStoreName("");
        setShowStoreDropdown(false);
      } else {
        console.error("Failed to add expense");
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("Failed to add expense. Please try again.");
    }
  };

  const handleDeleteClick = (id: number) => {
    setExpenseToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;

    try {
      const response = await fetch(`/api/expenses?id=${expenseToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setExpenses((prev) =>
          prev.filter((expense) => expense.id !== expenseToDelete)
        );
      } else {
        console.error("Failed to delete expense");
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
    } finally {
      setShowDeleteModal(false);
      setExpenseToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setExpenseToDelete(null);
  };

  const handleStoreSelect = (store: string) => {
    setStoreName(store);
    setShowStoreDropdown(false);
  };

  const updateContributionSettings = async (
    anaAmount: number,
    husbandAmount: number
  ) => {
    try {
      const newSettings = {
        anaAmount: anaAmount,
        husbandAmount: husbandAmount,
        totalBudget: anaAmount + husbandAmount,
      };

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        setContributionSettings(newSettings);
        setShowSettingsModal(false);
      } else {
        console.error("Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  // Export data functionality - Updated to export as Excel
  const exportData = async () => {
    try {
      // Create a new workbook
      const workbook = XLSX.utils.book_new();

      // Prepare expenses data for Excel
      const expensesData = expenses.map((expense) => ({
        Date: expense.date,
        "Store Name": expense.storeName,
        Category: expense.category,
        Person: expense.person === "husband" ? "Eido" : expense.person,
        "Amount (₪)": expense.amount,
        Description: expense.description || "",
      }));

      // Create expenses worksheet
      const expensesWorksheet = XLSX.utils.json_to_sheet(expensesData);

      // Set column widths for better formatting
      const expensesColWidths = [
        { wch: 12 }, // Date
        { wch: 20 }, // Store Name
        { wch: 15 }, // Category
        { wch: 10 }, // Person
        { wch: 12 }, // Amount
        { wch: 30 }, // Description
      ];
      expensesWorksheet["!cols"] = expensesColWidths;

      // Add expenses sheet to workbook
      XLSX.utils.book_append_sheet(workbook, expensesWorksheet, "Expenses");

      // Create summary data
      const summaryData = [
        { Category: "Total Expenses", "Amount (₪)": totalExpenses.toFixed(2) },
        { Category: "Total Budget", "Amount (₪)": totalBudget.toFixed(2) },
        { Category: "", "Amount (₪)": "" }, // Empty row
        {
          Category: "Ana - Actual Spent",
          "Amount (₪)": anaActualSpent.toFixed(2),
        },
        {
          Category: "Ana - Expected",
          "Amount (₪)": anaExpectedContribution.toFixed(2),
        },
        { Category: "Ana - Balance", "Amount (₪)": anaBalance.toFixed(2) },
        { Category: "", "Amount (₪)": "" }, // Empty row
        {
          Category: "Eido - Actual Spent",
          "Amount (₪)": husbandActualSpent.toFixed(2),
        },
        {
          Category: "Eido - Expected",
          "Amount (₪)": husbandExpectedContribution.toFixed(2),
        },
        { Category: "Eido - Balance", "Amount (₪)": husbandBalance.toFixed(2) },
        { Category: "", "Amount (₪)": "" }, // Empty row
        {
          Category: "Export Date",
          "Amount (₪)": new Date().toLocaleDateString(),
        },
      ];

      // Create summary worksheet
      const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);

      // Set column widths for summary
      const summaryColWidths = [
        { wch: 25 }, // Category
        { wch: 15 }, // Amount
      ];
      summaryWorksheet["!cols"] = summaryColWidths;

      // Add summary sheet to workbook
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Summary");

      // Create category breakdown data
      const categoryBreakdown = expenses.reduce((acc, expense) => {
        const category = expense.category;
        if (!acc[category]) {
          acc[category] = { total: 0, count: 0, ana: 0, eido: 0 };
        }
        acc[category].total += expense.amount;
        acc[category].count += 1;
        if (expense.person === "ana") {
          acc[category].ana += expense.amount;
        } else {
          acc[category].eido += expense.amount;
        }
        return acc;
      }, {} as Record<string, { total: number; count: number; ana: number; eido: number }>);

      const categoryData = Object.entries(categoryBreakdown).map(
        ([category, data]) => ({
          Category: category,
          "Total Amount (₪)": data.total.toFixed(2),
          "Number of Expenses": data.count,
          "Ana Amount (₪)": data.ana.toFixed(2),
          "Eido Amount (₪)": data.eido.toFixed(2),
        })
      );

      // Create category worksheet
      const categoryWorksheet = XLSX.utils.json_to_sheet(categoryData);

      // Set column widths for category breakdown
      const categoryColWidths = [
        { wch: 15 }, // Category
        { wch: 15 }, // Total Amount
        { wch: 18 }, // Number of Expenses
        { wch: 15 }, // Ana Amount
        { wch: 15 }, // Eido Amount
      ];
      categoryWorksheet["!cols"] = categoryColWidths;

      // Add category sheet to workbook
      XLSX.utils.book_append_sheet(
        workbook,
        categoryWorksheet,
        "Category Breakdown"
      );

      // Generate Excel file and download
      const fileName = `expenses-report-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error("Error exporting data to Excel:", error);
      alert("Error exporting data to Excel. Please try again.");
    }
  };

  // Clear all data functionality
  const clearAllData = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all data? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      // Delete all expenses
      const deletePromises = expenses.map((expense) =>
        fetch(`/api/expenses?id=${expense.id}`, { method: "DELETE" })
      );
      await Promise.all(deletePromises);

      // Reset settings to default
      await updateContributionSettings(765, 935);

      setExpenses([]);
    } catch (error) {
      console.error("Error clearing data:", error);
    }
  };

  // Handle search button click
  const handleSearchClick = () => {
    setShowMonthlySearch(!showMonthlySearch);
    // If hiding search, also clear any active search
    if (showMonthlySearch) {
      setSearchMonth("");
      setShowSearchResults(false);
    }
  };

  // Calculate summary data
  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const anaActualSpent = expenses
    .filter((e) => e.person === "ana")
    .reduce((sum, e) => sum + e.amount, 0);
  const husbandActualSpent = expenses
    .filter((e) => e.person === "husband")
    .reduce((sum, e) => sum + e.amount, 0);

  // Calculate expected contributions (fixed amounts) with null safety
  const anaExpectedContribution = contributionSettings?.anaAmount || 765;
  const husbandExpectedContribution =
    contributionSettings?.husbandAmount || 935;
  const totalBudget = contributionSettings?.totalBudget || 1700;

  // Calculate who owes whom
  const anaBalance = anaActualSpent - anaExpectedContribution;
  const husbandBalance = husbandActualSpent - husbandExpectedContribution;

  // Get filtered expenses and monthly totals for display
  const filteredExpenses = getFilteredExpenses();
  const monthlyTotals = getMonthlyTotals(filteredExpenses);
  const availableMonths = getAvailableMonths();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div className="text-gray-500">Loading expenses...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6 relative">
        <h1 className="text-2xl font-semibold text-gray-900">Expenses</h1>
        <div className="absolute right-0 top-0 flex gap-2">
          <button
            onClick={exportData}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Export Data"
            title="Export Data"
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
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Settings"
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Enhanced Summary Dashboard */}
      <div className="space-y-4 mb-4">
        {/* Total Expenses Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              ₪{totalExpenses.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Total Expenses</div>
            <div className="text-xs text-gray-400 mt-1">
              Budget: ₪{totalBudget.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Individual Spending Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-medium text-gray-900 mb-3 text-center">
            Spending
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                ₪{anaActualSpent.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">Ana</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">
                ₪{husbandActualSpent.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">Eido</div>
            </div>
          </div>
        </div>

        {/* Detailed Balance Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-medium text-gray-900 mb-3 text-center">
            Balance Details
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Ana's Balance (₪{anaExpectedContribution.toFixed(0)}):
              </span>
              <span
                className={`text-sm font-medium ${
                  anaBalance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {anaBalance >= 0 ? "+" : ""}₪{anaBalance.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Eido's Balance (₪{husbandExpectedContribution.toFixed(0)}):
              </span>
              <span
                className={`text-sm font-medium ${
                  husbandBalance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {husbandBalance >= 0 ? "+" : ""}₪{husbandBalance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Form */}
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
            <option value="groceries">🛒 Groceries</option>
            <option value="food">🍕 Food</option>
            <option value="bills">💡 Bills</option>
            <option value="entertainment">🎬 Entertainment</option>
            <option value="transport">🚗 Transport</option>
            <option value="shopping">🛍️ Shopping</option>
            <option value="utilities">🏠 Utilities</option>
            <option value="healthcare">⚕️ Healthcare</option>
            <option value="other">📝 Other</option>
          </select>

          <select
            value={person}
            onChange={(e) => setPerson(e.target.value)}
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
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium text-base hover:bg-blue-700 active:scale-95 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            Add Expense
          </button>
        </form>
      </div>

      {/* Expenses List */}
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

        {/* Monthly Search Section - Now conditionally shown */}
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
                {/* Custom dropdown arrow positioned more to the left */}
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
                    <span className="text-sm text-blue-700">
                      Ana's Spending:
                    </span>
                    <span className="font-semibold text-green-700">
                      ₪{monthlyTotals.anaTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700">
                      Eido's Spending:
                    </span>
                    <span className="font-semibold text-purple-700">
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
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-auto shadow-xl">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Settings</h3>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Contribution Settings
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Ana's Contribution (₪)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={contributionSettings.anaAmount}
                      onChange={(e) => {
                        const anaAmount = parseFloat(e.target.value) || 0;
                        setContributionSettings((prev) => ({
                          ...prev,
                          anaAmount: anaAmount,
                          totalBudget: anaAmount + prev.husbandAmount,
                        }));
                      }}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Eido's Contribution (₪)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={contributionSettings.husbandAmount}
                      onChange={(e) => {
                        const husbandAmount = parseFloat(e.target.value) || 0;
                        setContributionSettings((prev) => ({
                          ...prev,
                          husbandAmount: husbandAmount,
                          totalBudget: prev.anaAmount + husbandAmount,
                        }));
                      }}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <div>Ana: ₪{contributionSettings.anaAmount.toFixed(2)}</div>
                  <div>
                    Eido: ₪{contributionSettings.husbandAmount.toFixed(2)}
                  </div>
                  <div className="font-medium text-blue-600 border-t pt-2 mt-2">
                    Total Budget: ₪{contributionSettings.totalBudget.toFixed(2)}
                  </div>
                </div>
              </div>

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
                  <button
                    onClick={clearAllData}
                    className="w-full bg-red-100 text-red-800 py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                  >
                    Clear All Data
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
                  updateContributionSettings(
                    contributionSettings.anaAmount,
                    contributionSettings.husbandAmount
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
    </div>
  );
}
