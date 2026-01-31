import { useState } from "react"
import { Header } from "./components/Header"
import { Sidebar } from "./components/Sidebar"
import { Dashboard } from "./components/Dashboard"
import { BranchDetails } from "./components/BranchDetails"
import { TeamStructure } from "./components/TeamStructure"
import { AccessControl } from "./components/AccessControl"
import { ServiceDirectory } from "./components/ServiceDirectory"
import { HouseDirectory } from "./components/HouseDirectory"
import { ProvidersDirectory } from "./components/ProvidersDirectory"
import { ComplianceDirectory } from "./components/ComplianceDirectory"
import { InternalAudits } from "./components/InternalAudits"
import { IncidentReports } from "./components/IncidentReports"
import { SupportPlans } from "./components/SupportPlans"
import { FormBuilder } from "./components/FormBuilder"
import { Reports } from "./components/Reports"
import { ParticipantProfiles } from "./components/ParticipantProfiles"
import { ShiftNotes } from "./components/ShiftNotes"
import { Funding } from "./components/Funding"
import { StaffProfiles } from "./components/StaffProfiles"
import { EmployeeResources } from "./components/EmployeeResources"
import { TheHub } from "./components/TheHub"
import { RosterBoard } from "./components/RosterBoard"
import { HouseFiles } from "./components/HouseFiles"
import { HouseChecklist } from "./components/HouseChecklist"
import { HouseForms } from "./components/HouseForms"
import { HouseCalendar } from "./components/HouseCalendar"
import { HouseResources } from "./components/HouseResources"
import { ExportHub } from "./components/ExportHub"
import { ScheduleAudit } from "./components/ScheduleAudit"
import { Settings } from "./components/Settings"
import { UserManagement } from "./components/UserManagement"

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onPageChange={setCurrentPage} />
      case 'branch-details':
        return <BranchDetails />
      case 'team-structure':
        return <TeamStructure />
      case 'access-control':
        return <AccessControl />
      case 'service-directory':
        return <ServiceDirectory />
      case 'house-directory':
        return <HouseDirectory />
      case 'providers-directory':
        return <ProvidersDirectory />
      case 'compliance-directory':
        return <ComplianceDirectory />
      case 'internal-audits':
        return <InternalAudits />
      case 'incident-reports':
        return <IncidentReports onPageChange={setCurrentPage} />
      case 'support-plans':
        return <SupportPlans />
      case 'form-builder':
        return <FormBuilder />
      case 'reports':
        return <Reports onPageChange={setCurrentPage} />
      case 'participant-profiles':
        return <ParticipantProfiles />
      case 'shift-notes':
        return <ShiftNotes />
      case 'funding':
        return <Funding />
      case 'staff-profiles':
        return <StaffProfiles />
      case 'employee-resources':
        return <EmployeeResources />
      case 'the-hub':
        return <TheHub />
      case 'roster-board':
        return <RosterBoard />
      case 'house-files':
        return <HouseFiles />
      case 'house-checklist':
        return <HouseChecklist />
      case 'house-forms':
        return <HouseForms />
      case 'house-calendar':
        return <HouseCalendar />
      case 'house-resources':
        return <HouseResources />
      case 'export-hub':
        return <ExportHub />
      case 'schedule-audit':
        return <ScheduleAudit />
      case 'settings':
        return <Settings />
      case 'user-management':
        return <UserManagement />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header onPageChange={setCurrentPage} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  )
}