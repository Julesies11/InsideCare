import { AuthRouting } from '@/auth/auth-routing';
import { RequireAuth, RequireAdmin, RequirePermission } from '@/auth/require-auth';
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
  StaffChecklists,
} from '@/pages/staff';
import {
  AdminTimesheetsPage,
  AdminLeaveRequestsPage,
} from '@/pages/employees';
import { ChecklistMasterPage } from '@/pages/admin/checklists/checklist-master-page';
import { RolesPage } from '@/pages/admin/roles/roles-page';
import { NotificationCenter } from '@/pages/account/notifications/notification-center';

export function AppRoutingSetup() {
  return (
    <Routes>
      <Route element={<RequireAuth />}>
        <Route element={<Demo1Layout />}>
          <Route path="/account/notifications" element={<NotificationCenter />} />
          
          <Route element={<RequirePermission module="shift_routines" />}>
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
          </Route>
          
          <Route element={<RequirePermission module="house_checklists" />}>
            <Route path="/staff/checklists" element={<StaffChecklists />} />
          </Route>
          
          <Route element={<RequirePermission module="roster_board" />}>
            <Route path="/staff/roster" element={<StaffRoster />} />
          </Route>

          <Route element={<RequirePermission module="timesheets_submit" />}>
            <Route path="/staff/roster/:shiftId/timesheet" element={<StaffTimesheetForm />} />
            <Route path="/staff/timesheets" element={<StaffTimesheetList />} />
          </Route>

          <Route element={<RequirePermission module="leave_requests" />}>
            <Route path="/staff/leave" element={<StaffLeaveList />} />
            <Route path="/staff/leave/new" element={<StaffLeaveForm />} />
            <Route path="/staff/leave/:id/edit" element={<StaffLeaveForm />} />
          </Route>

          <Route path="/staff/profile" element={<StaffProfile />} />
          
          <Route path="/" element={<HomePage />} />
          
          <Route element={<RequirePermission module="participant_profiles" />}>
            <Route
              path="/participants/profiles"
              element={<ParticipantsProfilesPage />}
            />
            <Route
              path="/participants/detail/:id"
              element={<ParticipantDetailPage />}
            />
            <Route
              path="/participants/detail/:id/edit"
              element={<ParticipantDetailPage />}
            />
          </Route>

          <Route element={<RequirePermission module="shift_notes" />}>
            <Route
              path="/participants/shift-notes"
              element={<ShiftNotesPage />}
            />
          </Route>
          
          <Route element={<RequirePermission module="house_profiles" />}>
            <Route
              path="/houses/profiles"
              element={<HousesProfilesPage />}
            />
            <Route
              path="/houses/detail/:id"
              element={<HouseDetailPage />}
            />
          </Route>

          <Route element={<RequirePermission module="staff_profiles" />}>
            <Route
              path="/employees/staff-profiles"
              element={<StaffProfilesPage />}
            />
            <Route
              path="/employees/staff-detail/:id"
              element={<StaffDetailPage />}
            />
          </Route>

          <Route element={<RequirePermission module="timesheets_approve" />}>
            <Route
              path="/employees/timesheets"
              element={<AdminTimesheetsPage />}
            />
          </Route>

          <Route element={<RequirePermission module="leave_requests" />}>
            <Route
              path="/employees/leave-requests"
              element={<AdminLeaveRequestsPage />}
            />
          </Route>

          <Route element={<RequirePermission module="roster_board" />}>
            <Route
              path="/roster-board"
              element={<RosterBoard />}
            />
          </Route>
          
          <Route element={<RequireAdmin />}>
            <Route
              path="/admin/checklist-templates"
              element={<ChecklistMasterPage />}
            />
            <Route
              path="/admin/roles"
              element={<RolesPage />}
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
