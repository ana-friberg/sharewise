"use client";
import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import Cookies from "js-cookie";
import HeartAnimation from "../animation/heart_animation";
import Header from "../components/Header";
import SummaryDashboard from "../components/SummaryDashboard";
import ExpenseForm from "../components/ExpenseForm";
import ExpensesList from "../components/ExpensesList";
import Modals from "../components/Modals";

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

interface SharedAccountSettings {
  sharedAccountBalance: number;
}

// Add type for expense input validation
interface ExpenseInput {
  amount: string;
  storeName: string;
  description: string;
  category: string;
  person: string;
}

// Add type for monthly totals
interface MonthlyTotals {
  anaTotal: number;
  eidoTotal: number;
  monthTotal: number;
}

// Add type for category breakdown
interface CategoryBreakdown {
  [category: string]: {
    total: number;
    count: number;
    ana: number;
    eido: number;
  };
}

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("groceries");
  const [person, setPerson] = useState<string>(() => {
    // Load person preference from cookies, default to "ana" if not found
    const savedPerson = Cookies.get("selectedPerson");
    return savedPerson === "ana" || savedPerson === "husband"
      ? savedPerson
      : "ana";
  });
  const [storeName, setStoreName] = useState<string>("");
  const [showStoreDropdown, setShowStoreDropdown] = useState<boolean>(false);
  const [filteredStores, setFilteredStores] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [expenseToDelete, setExpenseToDelete] = useState<number | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [sharedAccountSettings, setSharedAccountSettings] =
    useState<SharedAccountSettings>({
      sharedAccountBalance: 1000,
    });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search functionality
  const [searchMonth, setSearchMonth] = useState<string>("");
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [showMonthlySearch, setShowMonthlySearch] = useState<boolean>(false);

  // Conversion table management
  const [showConversionTable, setShowConversionTable] = useState<boolean>(false);
  const [conversionEntries, setConversionEntries] = useState<any[]>([]);
  const [newConversionEntry, setNewConversionEntry] = useState({
    id_name: "",
    store_name: "",
    category: "groceries",
    comment: ""
  });
  const [conversionMessage, setConversionMessage] = useState<string>("");

  // Receipt processing loading state
  const [isProcessingReceipt, setIsProcessingReceipt] = useState<boolean>(false);

  // Infinite scroll state for recent expenses
  const [displayedMonthsCount, setDisplayedMonthsCount] = useState<number>(1);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Add function to get current month expenses
  const getCurrentMonthExpenses = (): Expense[] => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-based
    const currentYear = now.getFullYear();

    return expenses.filter((expense) => {
      const [, month, year] = expense.date.split("/").map(Number);
      return month === currentMonth && year === currentYear;
    });
  };

  // Load data from MongoDB on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Load person preference from cookies
  useEffect(() => {
    const savedPerson = Cookies.get("selectedPerson");
    if (savedPerson && (savedPerson === "ana" || savedPerson === "husband")) {
      setPerson(savedPerson);
    } else {
      // If no valid cookie exists, set default to "ana" and save it
      setPerson("ana");
      Cookies.set("selectedPerson", "ana", { expires: 365 });
    }
  }, []);

  const loadData = async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Load expenses
      const expensesResponse = await fetch("/api/expenses");
      if (expensesResponse.ok) {
        const expensesData = await expensesResponse.json();
        setExpenses(expensesData.expenses || []);
      }

      // Load shared account settings
      try {
        const settingsResponse = await fetch("/api/settings");
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          if (
            settingsData.settings &&
            settingsData.settings.sharedAccountBalance !== undefined
          ) {
            setSharedAccountSettings({
              sharedAccountBalance: settingsData.settings.sharedAccountBalance,
            });
          }
        }
      } catch (settingsError) {
        // Keep the default settings already set in state
        console.error("Error loading settings:", settingsError);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter expenses by selected month and sort by date
  const getFilteredExpenses = (): Expense[] => {
    let filtered = expenses;

    if (searchMonth) {
      // If searching for a specific month, show only that month
      filtered = expenses.filter((expense) => {
        const expenseDate = expense.date; // Format: DD/MM/YYYY
        const [, month, year] = expenseDate.split("/"); // Use comma to skip 'day'
        const expenseMonthYear = `${year}-${month.padStart(2, "0")}`;
        return expenseMonthYear === searchMonth;
      });
    } else {
      // For "Recent Expenses", show current month + previous months based on displayedMonthsCount
      const availableMonthsList = getAvailableMonthsList();
      const monthsToShow = availableMonthsList.slice(0, displayedMonthsCount);
      
      filtered = expenses.filter((expense) => {
        const expenseDate = expense.date; // Format: DD/MM/YYYY
        const [, month, year] = expenseDate.split("/");
        const expenseMonthYear = `${year}-${month.padStart(2, "0")}`;
        return monthsToShow.includes(expenseMonthYear);
      });
    }

    // Sort by date (most recent first) - Enhanced sorting
    return filtered.sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);

      // Primary sort: by date (newest first)
      const dateDiff = dateB.getTime() - dateA.getTime();
      if (dateDiff !== 0) {
        return dateDiff;
      }

      // Secondary sort: by expense ID (newer entries first if same date)
      return b.id - a.id;
    });
  };

  // Enhanced helper function to parse DD/MM/YYYY format to Date object
  const parseDate = (dateString: string): Date => {
    const [day, month, year] = dateString.split("/").map(Number);
    // Create date at noon to avoid timezone issues
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  };

  // Calculate monthly totals
  const getMonthlyTotals = (filteredExpenses: Expense[]): MonthlyTotals => {
    const anaTotal = filteredExpenses
      .filter((e) => e.person === "ana")
      .reduce((sum, e) => sum + e.amount, 0);

    const eidoTotal = filteredExpenses
      .filter((e) => e.person === "husband")
      .reduce((sum, e) => sum + e.amount, 0);

    const monthTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    return { anaTotal, eidoTotal, monthTotal };
  };

  // Get available months from expenses (sorted from newest to oldest)
  const getAvailableMonthsList = (): string[] => {
    const months = expenses.map((expense) => {
      const [, month, year] = expense.date.split("/"); // Use comma to skip 'day'
      return `${year}-${month.padStart(2, "0")}`;
    });

    const uniqueMonths = [...new Set(months)].sort().reverse();
    return uniqueMonths;
  };

  // Get available months from expenses
  const getAvailableMonths = (): string[] => {
    return getAvailableMonthsList();
  };

  // Load more months for infinite scroll
  const loadMoreMonths = async (): Promise<void> => {
    const availableMonthsList = getAvailableMonthsList();
    if (displayedMonthsCount >= availableMonthsList.length) {
      return; // No more months to load
    }

    setIsLoadingMore(true);
    
    // Simulate a brief loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setDisplayedMonthsCount(prev => prev + 1);
    setIsLoadingMore(false);
  };

  // Format month for display
  const formatMonthDisplay = (monthValue: string): string => {
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

  // Update the validation function
  const validateExpenseInput = (data: ExpenseInput): string[] => {
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

    // Validate category - Updated list
    const validCategories = [
      "groceries",
      "bakery",
      "pharm",
      "clothing",
      "apartment",
      "electricity",
      "water",
      "gas",
      "internet",
      "transport",
      "travel",
      "mobile",
      "electronics",
      "subscriptions",
      "restaurant",
      "entertainment",
      "health",
      "education",
      "insurance",
      "beauty",
      "gifts",
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle receipt processing result
  const handleReceiptProcessed = async (data: {
    storeName: string;
    totalAmount: number;
  }) => {
    try {
      // First, check the conversion table for this store name
      const conversionResponse = await fetch(`/api/conversion?id_name=${encodeURIComponent(data.storeName.toLowerCase())}`);
      
      if (conversionResponse.ok) {
        const conversionResult = await conversionResponse.json();
        
        if (conversionResult.success && conversionResult.entry) {
          // Found in conversion table - use predefined values
          const entry = conversionResult.entry;
          setStoreName(entry.store_name);
          setAmount(data.totalAmount.toString());
          setCategory(entry.category);
          setDescription(entry.comment || "Added from receipt scan (auto-converted)");
          
          console.log("Store converted using conversion table:", {
            original: data.storeName,
            converted: entry.store_name,
            category: entry.category
          });
        } else {
          // Not found in conversion table - use original AI results
          setStoreName(data.storeName);
          setAmount(data.totalAmount.toString());
          setDescription("Added from receipt scan");
        }
      } else {
        // Error accessing conversion table - use original AI results
        console.warn("Failed to access conversion table, using original store name");
        setStoreName(data.storeName);
        setAmount(data.totalAmount.toString());
        setDescription("Added from receipt scan");
      }
    } catch (error) {
      console.error("Error checking conversion table:", error);
      // Fallback to original AI results
      setStoreName(data.storeName);
      setAmount(data.totalAmount.toString());
      setDescription("Added from receipt scan");
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingReceipt(true); // Start loading

      // Convert to base64
      const base64Image = await convertToBase64(file);

      // Send to API
      const response = await fetch("/api/receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Image,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await handleReceiptProcessed(result.data);
      } else {
        alert("Failed to process receipt. Please try manual entry.");
      }
    } catch (error) {
      console.error("Error processing receipt:", error);
      alert("Error processing receipt. Please try manual entry.");
    } finally {
      setIsProcessingReceipt(false); // Stop loading
    }
  };

  const addExpense = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    if (!amount || !storeName) return;

    try {
      const inputData: ExpenseInput = {
        amount,
        storeName,
        description,
        category,
        person,
      };
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
        
        // Reset to current month view to show the new expense
        setDisplayedMonthsCount(1);
        setSearchMonth("");
        setShowSearchResults(false);
      } else {
        console.error("Failed to add expense");
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("Failed to add expense. Please try again.");
    }
  };

  const handleDeleteClick = (id: number): void => {
    setExpenseToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async (): Promise<void> => {
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

  const cancelDelete = (): void => {
    setShowDeleteModal(false);
    setExpenseToDelete(null);
  };

  const handleStoreSelect = (store: string): void => {
    setStoreName(store);
    setShowStoreDropdown(false);
  };

  // Function to handle person selection and save to cookies
  const handlePersonChange = (selectedPerson: string): void => {
    setPerson(selectedPerson);
    // Save to cookies with 365 days expiration
    Cookies.set("selectedPerson", selectedPerson, { expires: 365 });
  };

  const updateSharedAccountSettings = async (
    sharedAccountBalance: number
  ): Promise<void> => {
    try {
      const newSettings: SharedAccountSettings = {
        sharedAccountBalance: sharedAccountBalance,
      };

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        setSharedAccountSettings(newSettings);
        setShowSettingsModal(false);
      } else {
        console.error("Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  // Conversion table management functions
  const loadConversionEntries = async (): Promise<void> => {
    try {
      const response = await fetch("/api/conversion");
      if (response.ok) {
        const data = await response.json();
        setConversionEntries(data.entries || []);
      }
    } catch (error) {
      console.error("Error loading conversion entries:", error);
    }
  };

  const addConversionEntry = async (): Promise<void> => {
    if (!newConversionEntry.id_name || !newConversionEntry.store_name || !newConversionEntry.category) {
      setConversionMessage("Please fill in all required fields (ID Name, Store Name, Category)");
      // Clear message after 3 seconds
      setTimeout(() => setConversionMessage(""), 3000);
      return;
    }

    try {
      setConversionMessage(""); // Clear any previous messages
      
      const response = await fetch("/api/conversion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newConversionEntry),
      });

      if (response.ok) {
        await loadConversionEntries();
        setNewConversionEntry({
          id_name: "",
          store_name: "",
          category: "groceries",
          comment: ""
        });
        setConversionMessage("Entry added successfully!");
        // Clear success message after 3 seconds
        setTimeout(() => setConversionMessage(""), 3000);
      } else {
        const errorData = await response.json();
        setConversionMessage(`Failed to add entry: ${errorData.error || 'Unknown error'}`);
        // Clear error message after 5 seconds
        setTimeout(() => setConversionMessage(""), 5000);
      }
    } catch (error) {
      console.error("Error adding conversion entry:", error);
      setConversionMessage("Error adding entry. Please try again.");
      // Clear error message after 5 seconds
      setTimeout(() => setConversionMessage(""), 5000);
    }
  };

  // Export data functionality - Updated to export as Excel
  const exportData = async (): Promise<void> => {
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

      // Create summary data using current month data
      const currentMonthExpenses = getCurrentMonthExpenses();
      const currentMonthTotals = getMonthlyTotals(currentMonthExpenses);

      const summaryData = [
        {
          Category: "Current Month Expenses",
          "Amount (₪)": currentMonthTotals.monthTotal.toFixed(2),
        },
        {
          Category: "Shared Account Balance",
          "Amount (₪)": sharedAccountSettings.sharedAccountBalance.toFixed(2),
        },
        { Category: "", "Amount (₪)": "" }, // Empty row
        {
          Category: "Ana - Current Month Spent",
          "Amount (₪)": currentMonthTotals.anaTotal.toFixed(2),
        },
        {
          Category: "Eido - Current Month Spent",
          "Amount (₪)": currentMonthTotals.eidoTotal.toFixed(2),
        },
        { Category: "", "Amount (₪)": "" }, // Empty row
        {
          Category: "Remaining Balance",
          "Amount (₪)": (
            sharedAccountSettings.sharedAccountBalance -
            currentMonthTotals.monthTotal
          ).toFixed(2),
        },
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

      // Create category breakdown data for current month
      const categoryBreakdown: CategoryBreakdown = currentMonthExpenses.reduce(
        (acc, expense) => {
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
        },
        {} as CategoryBreakdown
      );

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
  const clearAllData = async (): Promise<void> => {
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
      await updateSharedAccountSettings(1000);

      setExpenses([]);
    } catch (error) {
      console.error("Error clearing data:", error);
    }
  };

  // Handle search button click
  const handleSearchClick = (): void => {
    setShowMonthlySearch(!showMonthlySearch);
    // If hiding search, also clear any active search
    if (showMonthlySearch) {
      setSearchMonth("");
      setShowSearchResults(false);
      // Reset to current month when exiting search
      setDisplayedMonthsCount(1);
    }
  };

  // Calculate summary data - Updated for shared account logic
  const currentMonthExpenses = getCurrentMonthExpenses();
  const currentMonthTotals = getMonthlyTotals(currentMonthExpenses);

  const totalMonthlySpending: number = currentMonthTotals.monthTotal;
  const anaActualSpent: number = currentMonthTotals.anaTotal;
  const husbandActualSpent: number = currentMonthTotals.eidoTotal;

  // Get filtered expenses and monthly totals for display
  const filteredExpenses: Expense[] = getFilteredExpenses();
  const monthlyTotals: MonthlyTotals = getMonthlyTotals(filteredExpenses);
  const availableMonths: string[] = getAvailableMonths();
  
  // Check if there are more months to load
  const hasMoreMonths = displayedMonthsCount < getAvailableMonthsList().length;

  // Show heart animation while loading
  if (isLoading) {
    return <HeartAnimation isLoading={isLoading} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto">
      {/* Hidden file input for camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Header 
        exportData={exportData}
        setShowSettingsModal={setShowSettingsModal}
      />

      <SummaryDashboard
        totalMonthlySpending={totalMonthlySpending}
        sharedAccountBalance={sharedAccountSettings.sharedAccountBalance}
        anaActualSpent={anaActualSpent}
        husbandActualSpent={husbandActualSpent}
      />

      <ExpenseForm
        amount={amount}
        setAmount={setAmount}
        category={category}
        setCategory={setCategory}
        person={person}
        handlePersonChange={handlePersonChange}
        storeName={storeName}
        setStoreName={setStoreName}
        description={description}
        setDescription={setDescription}
        showStoreDropdown={showStoreDropdown}
        setShowStoreDropdown={setShowStoreDropdown}
        filteredStores={filteredStores}
        handleStoreSelect={handleStoreSelect}
        addExpense={addExpense}
        handleCameraCapture={handleCameraCapture}
        isProcessingReceipt={isProcessingReceipt}
      />

      <ExpensesList
        filteredExpenses={filteredExpenses}
        showSearchResults={showSearchResults}
        searchMonth={searchMonth}
        formatMonthDisplay={formatMonthDisplay}
        showMonthlySearch={showMonthlySearch}
        handleSearchClick={handleSearchClick}
        availableMonths={availableMonths}
        setSearchMonth={setSearchMonth}
        setShowSearchResults={setShowSearchResults}
        monthlyTotals={monthlyTotals}
        handleDeleteClick={handleDeleteClick}
        loadMoreMonths={loadMoreMonths}
        hasMoreMonths={hasMoreMonths}
        isLoadingMore={isLoadingMore}
      />

      <Modals
        showDeleteModal={showDeleteModal}
        confirmDelete={confirmDelete}
        cancelDelete={cancelDelete}
        showSettingsModal={showSettingsModal}
        setShowSettingsModal={setShowSettingsModal}
        sharedAccountSettings={sharedAccountSettings}
        setSharedAccountSettings={setSharedAccountSettings}
        updateSharedAccountSettings={updateSharedAccountSettings}
        exportData={exportData}
        clearAllData={clearAllData}
        showConversionTable={showConversionTable}
        setShowConversionTable={setShowConversionTable}
        loadConversionEntries={loadConversionEntries}
        conversionEntries={conversionEntries}
        newConversionEntry={newConversionEntry}
        setNewConversionEntry={setNewConversionEntry}
        addConversionEntry={addConversionEntry}
        conversionMessage={conversionMessage}
      />
    </div>
  );
}