"use client";

interface SummaryDashboardProps {
  totalMonthlySpending: number;
  sharedAccountBalance: number;
  anaActualSpent: number;
  husbandActualSpent: number;
}

export default function SummaryDashboard({
  totalMonthlySpending,
  sharedAccountBalance,
  anaActualSpent,
  husbandActualSpent,
}: SummaryDashboardProps) {
  return (
    <div className="space-y-4 mb-4">
      {/* Current Month Header */}
      <div className="text-center">
        <div className="text-sm text-gray-500 mb-2">
          {new Date().toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}{" "}
          Summary
        </div>
      </div>

      {/* Total Monthly Spending Card */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 mb-2">
            ₪{totalMonthlySpending.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">Total Monthly Spending</div>
          <div className="text-xs text-gray-400 mt-1">
            Shared Account Balance: ₪{sharedAccountBalance.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Individual Spending Card */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-black-600">
              ₪{anaActualSpent.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">Ana's Spending</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-black-600">
              ₪{husbandActualSpent.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">Eido's Spending</div>
          </div>
        </div>
      </div>
    </div>
  );
}
