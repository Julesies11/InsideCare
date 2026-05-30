import { lazy, Suspense } from 'react';
import { AuthRouting } from '@/auth/auth-routing';
import { RequireAuth, RequireAdmin, RequirePermission } from '@/auth/require-auth';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { ErrorRouting } from '@/errors/error-routing';
import { Demo1Layout } from '@/layouts/demo1/layout';
import { Navigate, Route, Routes } from 'react-router';
import { Loader2 } from 'lucide-react';

// Lazy load pages
const ParticipantsProfilesPage = lazy(() => import('@/pages/participants').then(m => ({ default: m.ParticipantsProfilesPage })));
const ParticipantDetailPage = lazy(() => import('@/pages/participants').then(m => ({ default: m.ParticipantDetailPage })));
const MedicationRegisterPage = lazy(() => import('@/pages/participants/medication-register/medication-register-page').then(m => ({ default: m.MedicationRegisterPage })));
const MedicationDetailPage = lazy(() => import('@/pages/participants/medication-register/medication-detail-page').then(m => ({ default: m.MedicationDetailPage })));
const ShiftNotesPage = lazy(() => import('@/pages/participants').then(m => ({ default: m.ShiftNotesPage })));
const ShiftNoteDetailPage = lazy(() => import('@/pages/shift-notes').then(m => ({ default: m.ShiftNoteDetailPage })));

const HousesProfilesPage = lazy(() => import('@/pages/houses').then(m => ({ default: m.HousesProfilesPage })));
const HouseDetailPage = lazy(() => import('@/pages/houses').then(m => ({ default: m.HouseDetailPage })));

const StaffProfilesPage = lazy(() => import('@/pages/employees').then(m => ({ default: m.StaffProfilesPage })));
const StaffDetailPage = lazy(() => import('@/pages/employees').then(m => ({ default: m.StaffDetailPage })));
const ShiftTemplatesPage = lazy(() => import('@/pages/roster-board/shift-templates').then(m => ({ default: m.ShiftTemplatesPage })));
const ShiftTemplatesEditPage = lazy(() => import('@/pages/roster-board/shift-templates-edit').then(m => ({ default: m.ShiftTemplatesEditPage })));
const AdminTimesheetsPage = lazy(() => import('@/pages/employees').then(m => ({ default: m.AdminTimesheetsPage })));
const AdminLeaveRequestsPage = lazy(() => import('@/pages/employees').then(m => ({ default: m.AdminLeaveRequestsPage })));

const RosterBoard = lazy(() => import('@/pages/roster-board'));

const AuthAccountDeactivatedPage = lazy(() => import('@/pages/auth').then(m => ({ default: m.AuthAccountDeactivatedPage })));
const AuthWelcomeMessagePage = lazy(() => import('@/pages/auth').then(m => ({ default: m.AuthWelcomeMessagePage })));

const HomePage = lazy(() => import('@/pages/dashboards').then(m => ({ default: m.HomePage })));

const StaffDashboard = lazy(() => import('@/pages/staff').then(m => ({ default: m.StaffDashboard })));
const StaffRoster = lazy(() => import('@/pages/staff').then(m => ({ default: m.StaffRoster })));
const StaffTimesheetForm = lazy(() => import('@/pages/staff').then(m => ({ default: m.StaffTimesheetForm })));
const StaffTimesheetList = lazy(() => import('@/pages/staff').then(m => ({ default: m.StaffTimesheetList })));
const StaffLeaveList = lazy(() => import('@/pages/staff').then(m => ({ default: m.StaffLeaveList })));
const StaffLeaveForm = lazy(() => import('@/pages/staff').then(m => ({ default: m.StaffLeaveForm })));
const StaffProfile = lazy(() => import('@/pages/staff').then(m => ({ default: m.StaffProfile })));
const StaffChecklists = lazy(() => import('@/pages/staff').then(m => ({ default: m.StaffChecklists })));

const ChecklistMasterPage = lazy(() => import('@/pages/admin/checklists/checklist-master-page').then(m => ({ default: m.ChecklistMasterPage })));
const LeaveTypeMasterPage = lazy(() => import('@/pages/admin/leave-types/leave-type-master-page').then(m => ({ default: m.LeaveTypeMasterPage })));
const RolesPage = lazy(() => import('@/pages/admin/roles/roles-page').then(m => ({ default: m.RolesPage })));
const ActivityLogPage = lazy(() => import('@/pages/admin/activity-log/activity-log-page').then(m => ({ default: m.ActivityLogPage })));
const ReportingHubPage = lazy(() => import('@/pages/admin/reporting/reporting-hub-page').then(m => ({ default: m.ReportingHubPage })));
const IncidentManagementReportPage = lazy(() => import('@/pages/admin/reporting/incident-management-report-page').then(m => ({ default: m.IncidentManagementReportPage })));
const NotificationCenter = lazy(() => import('@/pages/account/notifications/notification-center').then(m => ({ default: m.NotificationCenter })));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2 className="size-8 animate-spin text-primary" />
  </div>
);

export function AppRoutingSetup() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route element={<Demo1Layout />}>
            <Route path="/account/notifications" element={<NotificationCenter />} />

            <Route element={<RequirePermission module={RBAC_MODULES.SHIFT_ROUTINES} />}>
              <Route path="/my-dashboard" element={<StaffDashboard />} />
            </Route>

            <Route element={<RequirePermission module={RBAC_MODULES.SHIFT_ROUTINES} />}>
              <Route path="/my-checklists" element={<StaffChecklists />} />
            </Route>

            <Route element={<RequirePermission module={RBAC_MODULES.MY_ROSTER} />}>
              <Route path="/my-roster" element={<StaffRoster />} />
            </Route>

            <Route element={<RequirePermission module={RBAC_MODULES.MY_TIMESHEETS} />}>
              <Route path="/my-roster/:shiftId/timesheet" element={<StaffTimesheetForm />} />
              <Route path="/my-timesheets" element={<StaffTimesheetList />} />
            </Route>

            <Route element={<RequirePermission module={RBAC_MODULES.MY_LEAVE} />}>
              <Route path="/my-leave" element={<StaffLeaveList />} />
              <Route path="/my-leave/new" element={<StaffLeaveForm />} />
              <Route path="/my-leave/:id/edit" element={<StaffLeaveForm />} />
            </Route>

            <Route path="/staff/profile" element={<StaffProfile />} />

            <Route path="/" element={<HomePage />} />

            <Route element={<RequirePermission module={RBAC_MODULES.PARTICIPANTS} />}>
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

            <Route element={<RequirePermission module={RBAC_MODULES.MASTER_LISTS} />}>
              <Route
                path="/participants/medication-register"
                element={<MedicationRegisterPage />}
              />
              <Route
                path="/participants/medication-register/:id"
                element={<MedicationDetailPage />}
              />
            </Route>

            <Route element={<RequirePermission module={RBAC_MODULES.SHIFT_NOTES} />}>
              <Route
                path="/participants/shift-notes"
                element={<ShiftNotesPage />}
              />
              <Route
                path="/shift-notes/detail/:id"
                element={<ShiftNoteDetailPage />}
              />
            </Route>

            <Route element={<RequirePermission module={RBAC_MODULES.HOUSES} />}>
              <Route path="/houses" element={<HousesProfilesPage />} />
              <Route path="/houses/detail/:id" element={<HouseDetailPage />} />
            </Route>

            <Route element={<RequirePermission module={RBAC_MODULES.EMPLOYEES} />}>
              <Route path="/staff" element={<StaffProfilesPage />} />
              <Route path="/employees/staff-detail/:id" element={<StaffDetailPage />} />
            </Route>

            <Route element={<RequirePermission module={RBAC_MODULES.TIMESHEETS} />}>
              <Route path="/timesheet-approvals" element={<AdminTimesheetsPage />} />
            </Route>

            <Route element={<RequirePermission module={RBAC_MODULES.LEAVE_REQUESTS} />}>
              <Route path="/leave-approvals" element={<AdminLeaveRequestsPage />} />
            </Route>

            <Route element={<RequirePermission module={RBAC_MODULES.ROSTER_BOARD} />}>
              <Route
                path="/roster-board"
                element={<RosterBoard />}
              />
              <Route
                path="/shift-setup"
                element={<ShiftTemplatesPage />}
              />
              <Route
                path="/shift-setup/:id"
                element={<ShiftTemplatesEditPage />}
              />            </Route>
            <Route element={<RequirePermission module={RBAC_MODULES.ACTIVITY_LOG} />}>
              <Route
                path="/activity-log"
                element={<ActivityLogPage />}
              />
            </Route>

            <Route element={<RequirePermission module={[RBAC_MODULES.REPORTING_CLINICAL, RBAC_MODULES.REPORTING_OPERATIONAL, RBAC_MODULES.REPORTING_COMPLIANCE]} />}>
              <Route path="/reporting" element={<ReportingHubPage />} />
            </Route>
            <Route element={<RequirePermission module={RBAC_MODULES.REPORTING_CLINICAL} />}>
              <Route path="/reporting/clinical/incidents" element={<IncidentManagementReportPage />} />
            </Route>

            <Route element={<RequireAdmin />}>
              <Route
                path="/checklist-templates"
                element={<ChecklistMasterPage />}
              />
              <Route element={<RequirePermission module={RBAC_MODULES.MASTER_LISTS} />}>
                <Route
                  path="/admin/leave-types"
                  element={<LeaveTypeMasterPage />}
                />
              </Route>
              <Route
                path="/access-control"
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
    </Suspense>
  );
}
