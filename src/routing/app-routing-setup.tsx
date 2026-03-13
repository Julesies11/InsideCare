import { AuthRouting } from '@/auth/auth-routing';
import { RequireAuth, RequireAdmin } from '@/auth/require-auth';
import { ErrorRouting } from '@/errors/error-routing';
import { Demo1Layout } from '@/layouts/demo1/layout';
import {
  ParticipantsProfilesPage,
  ParticipantDetailPage,
  ShiftNotesPage,
} from '@/pages/participants';
import {
  HousesProfilesPage,
  HouseDetailPage,
} from '@/pages/houses';
import {
  StaffProfilesPage,
  StaffDetailPage,
} from '@/pages/employees';
import RosterBoard from '@/pages/roster-board';
import {
  AuthAccountDeactivatedPage,
  AuthWelcomeMessagePage,
} from '@/pages/auth';
import { HomePage } from '@/pages/dashboards';
import { Navigate, Route, Routes } from 'react-router';
import {
  StaffDashboard,
  StaffRoster,
  StaffTimesheetForm,
  StaffTimesheetList,
  StaffLeaveList,
  StaffLeaveForm,
  StaffProfile,
} from '@/pages/staff';
import {
  AdminTimesheetsPage,
  AdminLeaveRequestsPage,
} from '@/pages/employees';
import { ChecklistMasterPage } from '@/pages/admin/checklists/checklist-master-page';

export function AppRoutingSetup() {
  return (
    <Routes>
      <Route element={<RequireAuth />}>
        <Route element={<Demo1Layout />}>
          <Route path="/staff/dashboard" element={<StaffDashboard />} />
          <Route path="/staff/roster" element={<StaffRoster />} />
          <Route path="/staff/roster/:shiftId/timesheet" element={<StaffTimesheetForm />} />
          <Route path="/staff/timesheets" element={<StaffTimesheetList />} />
          <Route path="/staff/leave" element={<StaffLeaveList />} />
          <Route path="/staff/leave/new" element={<StaffLeaveForm />} />
          <Route path="/staff/leave/:id/edit" element={<StaffLeaveForm />} />
          <Route path="/staff/profile" element={<StaffProfile />} />
          
          <Route path="/" element={<HomePage />} />
          
          <Route
            path="/participants/profiles"
            element={<ParticipantsProfilesPage />}
          />
          <Route
            path="/participants/shift-notes"
            element={<ShiftNotesPage />}
          />
          <Route
            path="/participants/detail/:id"
            element={<ParticipantDetailPage />}
          />
          <Route
            path="/participants/detail/:id/edit"
            element={<ParticipantDetailPage />}
          />
          
          <Route element={<RequireAdmin />}>
            <Route
              path="/employees/staff-profiles"
              element={<StaffProfilesPage />}
            />
            <Route
              path="/employees/staff-detail/:id"
              element={<StaffDetailPage />}
            />
            <Route
              path="/employees/timesheets"
              element={<AdminTimesheetsPage />}
            />
            <Route
              path="/employees/leave-requests"
              element={<AdminLeaveRequestsPage />}
            />
            <Route
              path="/admin/checklist-templates"
              element={<ChecklistMasterPage />}
            />
            <Route
              path="/houses/profiles"
              element={<HousesProfilesPage />}
            />
            <Route
              path="/houses/detail/:id"
              element={<HouseDetailPage />}
            />
            <Route
              path="/roster-board"
              element={<RosterBoard />}
            />
          </Route>

          <Route
            path="/auth/welcome-message"
            element={<AuthWelcomeMessagePage />}
          />
          <Route
            path="/auth/account-deactivated"
            element={<AuthAccountDeactivatedPage />}
          />
        </Route>
      </Route>
      <Route path="error/*" element={<ErrorRouting />} />
      <Route path="auth/*" element={<AuthRouting />} />
      <Route path="*" element={<Navigate to="/error/404" />} />
    </Routes>
  );
}
