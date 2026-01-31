import { BranchDetailsMotivationalBanner } from "./BranchDetailsMotivationalBanner"
import { BranchInfoCards } from "./BranchInfoCards"
import { BranchTabs } from "./BranchTabs"
import { BranchSummary } from "./BranchSummary"

export function BranchDetails() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Motivational Banner */}
      <BranchDetailsMotivationalBanner />
      
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Branch Details</h1>
        <p className="text-gray-600">Manage and view comprehensive information about your branch operations</p>
      </div>

      {/* Main Content Layout */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Info Cards */}
          <BranchInfoCards />
          
          {/* Tabs Section */}
          <BranchTabs />
        </div>

        {/* Right Sidebar Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <BranchSummary />
          </div>
        </div>
      </div>
    </div>
  )
}