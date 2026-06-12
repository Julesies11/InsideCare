import { lazy, Suspense } from 'react';
import { AuthRouting } from '@/auth/auth-routing';
import {
  RequireAdmin,
  RequireAuth,
  RequirePermission,
} from '@/auth/require-auth';
import { ErrorRouting } from '@/errors/error-routing';
import { Demo1Layout } from '@/layouts/demo1/layout';
import { Loader2 } from 'lucide-react';
import { Navigate, Route, Routes } from 'react-router';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { ROUTES } from '@/config/routes.config';

// Lazy load pages
const ParticipantsProfilesPage = lazy(() =>
  import('@/pages/participants').then((m) => ({
    default: m.ParticipantsProfilesPage,
  })),
);
const ParticipantDetailPage = lazy(() =>
  import('@/pages/participants').then((m) => ({
    default: m.ParticipantDetailPage,
  })),
);
const MedicationRegisterPage = lazy(() =>
  import('@/pages/participants/medication-register/medication-register-page').then(
    (m) => ({ default: m.MedicationRegisterPage }),
  ),
);
const MedicationDetailPage = lazy(() =>
  import('@/pages/participants/medication-register/medication-detail-page').then(
    (m) => ({ default: m.MedicationDetailPage }),
  ),
);
const ShiftNotesPage = lazy(() =>
  import('@/pages/participants').then((m) => ({ default: m.ShiftNotesPage })),
);
const ShiftNoteDetailPage = lazy(() =>
  import('@/pages/shift-notes').then((m) => ({
    default: m.ShiftNoteDetailPage,
  })),
);

const HousesProfilesPage = lazy(() =>
  import('@/pages/houses').then((m) => ({ default: m.HousesProfilesPage })),
);
const HouseDetailPage = lazy(() =>
  import('@/pages/houses').then((m) => ({ default: m.HouseDetailPage })),
);

const StaffProfilesPage = lazy(() =>
  import('@/pages/employees').then((m) => ({ default: m.StaffProfilesPage })),
);
const StaffDetailPage = lazy(() =>
  import('@/pages/employees').then((m) => ({ default: m.StaffDetailPage })),
);
const ShiftTemplatesPage = lazy(() =>
  import('@/pages/roster-board/shift-templates').then((m) => ({
    default: m.ShiftTemplatesPage,
  })),
);
const ShiftTemplatesEditPage = lazy(() =>
  import('@/pages/roster-board/shift-templates-edit').then((m) => ({
    default: m.ShiftTemplatesEditPage,
  })),
);
const AdminTimesheetsPage = lazy(() =>
  import('@/pages/employees').then((m) => ({ default: m.AdminTimesheetsPage })),
);
const AdminLeaveRequestsPage = lazy(() =>
  import('@/pages/employees').then((m) => ({
    default: m.AdminLeaveRequestsPage,
  })),
);

const RosterBoard = lazy(() => import('@/pages/roster-board'));

const AuthAccountDeactivatedPage = lazy(() =>
  import('@/pages/auth').then((m) => ({
    default: m.AuthAccountDeactivatedPage,
  })),
);
const AuthWelcomeMessagePage = lazy(() =>
  import('@/pages/auth').then((m) => ({ default: m.AuthWelcomeMessagePage })),
);

const HomePage = lazy(() =>
  import('@/pages/dashboards').then((m) => ({ default: m.HomePage })),
);

const StaffDashboard = lazy(() =>
  import('@/pages/staff').then((m) => ({ default: m.StaffDashboard })),
);
const StaffRoster = lazy(() =>
  import('@/pages/staff').then((m) => ({ default: m.StaffRoster })),
);
const StaffTimesheetForm = lazy(() =>
  import('@/pages/staff').then((m) => ({ default: m.StaffTimesheetForm })),
);
const StaffTimesheetList = lazy(() =>
  import('@/pages/staff').then((m) => ({ default: m.StaffTimesheetList })),
);
const StaffLeaveList = lazy(() =>
  import('@/pages/staff').then((m) => ({ default: m.StaffLeaveList })),
);
const StaffLeaveForm = lazy(() =>
  import('@/pages/staff').then((m) => ({ default: m.StaffLeaveForm })),
);
const StaffProfile = lazy(() =>
  import('@/pages/staff').then((m) => ({ default: m.StaffProfile })),
);
const StaffChecklists = lazy(() =>
  import('@/pages/staff').then((m) => ({ default: m.StaffChecklists })),
);

const ChecklistMasterPage = lazy(() =>
  import('@/pages/admin/checklists/checklist-master-page').then((m) => ({
    default: m.ChecklistMasterPage,
  })),
);
const LeaveTypeMasterPage = lazy(() =>
  import('@/pages/admin/leave-types/leave-type-master-page').then((m) => ({
    default: m.LeaveTypeMasterPage,
  })),
);
const ComplianceSettingsPage = lazy(() =>
  import('@/pages/admin/compliance-settings/compliance-settings-page').then(
    (m) => ({ default: m.ComplianceSettingsPage }),
  ),
);
const OnboardingSettingsPage = lazy(() =>
  import('@/pages/admin/onboarding-settings/onboarding-settings-page').then(
    (m) => ({ default: m.OnboardingSettingsPage }),
  ),
);
const ClinicalTrackersPage = lazy(() =>
  import('@/pages/admin/clinical-trackers').then(
    (m) => ({ default: m.ClinicalTrackersPage }),
  ),
);
const ComplianceMonitoringPage = lazy(() =>
  import('@/pages/admin/compliance-monitoring/compliance-monitoring-page').then(
    (m) => ({ default: m.ComplianceMonitoringPage }),
  ),
);
const OnboardingMonitoringPage = lazy(() =>
  import('@/pages/admin/onboarding-monitoring/onboarding-monitoring-page').then(
    (m) => ({ default: m.OnboardingMonitoringPage }),
  ),
);
const RolesPage = lazy(() =>
  import('@/pages/admin/roles/roles-page').then((m) => ({
    default: m.RolesPage,
  })),
);
const ActivityLogPage = lazy(() =>
  import('@/pages/admin/activity-log/activity-log-page').then((m) => ({
    default: m.ActivityLogPage,
  })),
);
const ReportingHubPage = lazy(() =>
  import('@/pages/admin/reporting/reporting-hub-page').then((m) => ({
    default: m.ReportingHubPage,
  })),
);
const IncidentManagementPage = lazy(() =>
  import('@/pages/admin/reporting/incident-management-page').then((m) => ({
    default: m.IncidentManagementPage,
  })),
);
const IncidentSummaryReportPage = lazy(() =>
  import('@/pages/admin/reporting/incident-summary-report-page').then((m) => ({
    default: m.IncidentSummaryReportPage,
  })),
);
const ParticipantsReportPage = lazy(() =>
  import('@/pages/admin/reporting/participants-report-page').then((m) => ({
    default: m.ParticipantsReportPage,
  })),
);
const ComplianceReportPage = lazy(() =>
  import('@/pages/admin/reporting/compliance-report-page').then((m) => ({
    default: m.ComplianceReportPage,
  })),
);
const OnboardingReportPage = lazy(() =>
  import('@/pages/admin/reporting/onboarding-report-page').then((m) => ({
    default: m.OnboardingReportPage,
  })),
);
const NotificationCenter = lazy(() =>
  import('@/pages/account/notifications/notification-center').then((m) => ({
    default: m.NotificationCenter,
  })),
);

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
            <Route
              path={ROUTES.NOTIFICATIONS}
              element={<NotificationCenter />}
            />

            <Route
              element={
                <RequirePermission module={RBAC_MODULES.SHIFT_ROUTINES} />
              }
            >
              <Route path={ROUTES.MY_DASHBOARD} element={<StaffDashboard />} />
            </Route>

            <Route
              element={
                <RequirePermission module={RBAC_MODULES.SHIFT_ROUTINES} />
              }
            >
              <Route
                path={ROUTES.MY_CHECKLISTS}
                element={<StaffChecklists />}
              />
            </Route>

            <Route
              element={<RequirePermission module={RBAC_MODULES.MY_ROSTER} />}
            >
              <Route path={ROUTES.MY_ROSTER} element={<StaffRoster />} />
            </Route>

            <Route
              element={
                <RequirePermission module={RBAC_MODULES.MY_TIMESHEETS} />
              }
            >
              <Route
                path={`${ROUTES.MY_TIMESHEETS}/:shiftId`}
                element={<StaffTimesheetForm />}
              />
              <Route
                path={ROUTES.MY_TIMESHEETS}
                element={<StaffTimesheetList />}
              />
            </Route>

            <Route
              element={<RequirePermission module={RBAC_MODULES.MY_LEAVE} />}
            >
              <Route path={ROUTES.MY_LEAVE} element={<StaffLeaveList />} />
              <Route
                path={`${ROUTES.MY_LEAVE}/new`}
                element={<StaffLeaveForm />}
              />
              <Route
                path={`${ROUTES.MY_LEAVE}/:id/edit`}
                element={<StaffLeaveForm />}
              />
            </Route>

            <Route path={ROUTES.STAFF_PROFILE} element={<StaffProfile />} />

            <Route path={ROUTES.HOME} element={<HomePage />} />

            <Route
              element={<RequirePermission module={RBAC_MODULES.PARTICIPANTS} />}
            >
              <Route
                path={ROUTES.PARTICIPANT_PROFILES}
                element={<ParticipantsProfilesPage />}
              />
              <Route
                path={`${ROUTES.PARTICIPANT_DETAIL}/:id`}
                element={<ParticipantDetailPage />}
              />
              <Route
                path={`${ROUTES.PARTICIPANT_DETAIL}/:id/edit`}
                element={<ParticipantDetailPage />}
              />
            </Route>

            <Route
              element={<RequirePermission module={RBAC_MODULES.MASTER_LISTS} />}
            >
              <Route
                path={ROUTES.MEDICATION_REGISTER}
                element={<MedicationRegisterPage />}
              />
              <Route
                path={`${ROUTES.MEDICATION_REGISTER}/:id`}
                element={<MedicationDetailPage />}
              />
            </Route>

            <Route
              element={
                <RequirePermission
                  module={RBAC_MODULES.PARTICIPANT_SHIFT_NOTES}
                />
              }
            >
              <Route path={ROUTES.SHIFT_NOTES} element={<ShiftNotesPage />} />
              <Route
                path={`${ROUTES.SHIFT_NOTES_DETAIL}/:id`}
                element={<ShiftNoteDetailPage />}
              />
            </Route>

            <Route element={<RequirePermission module={RBAC_MODULES.HOUSES} />}>
              <Route path={ROUTES.HOUSES} element={<HousesProfilesPage />} />
              <Route
                path={`${ROUTES.HOUSE_DETAIL}/:id`}
                element={<HouseDetailPage />}
              />
            </Route>

            <Route
              element={<RequirePermission module={RBAC_MODULES.EMPLOYEES} />}
            >
              <Route path={ROUTES.STAFF} element={<StaffProfilesPage />} />
              <Route
                path={`${ROUTES.STAFF_DETAIL}/:id`}
                element={<StaffDetailPage />}
              />
            </Route>

            <Route
              element={<RequirePermission module={RBAC_MODULES.TIMESHEETS} />}
            >
              <Route
                path={ROUTES.TIMESHEET_APPROVALS}
                element={<AdminTimesheetsPage />}
              />
            </Route>

            <Route
              element={
                <RequirePermission module={RBAC_MODULES.LEAVE_REQUESTS} />
              }
            >
              <Route
                path={ROUTES.LEAVE_APPROVALS}
                element={<AdminLeaveRequestsPage />}
              />
            </Route>

            <Route
              element={<RequirePermission module={RBAC_MODULES.ROSTER_BOARD} />}
            >
              <Route path={ROUTES.ROSTER_BOARD} element={<RosterBoard />} />
              <Route
                path={ROUTES.SHIFT_SETUP}
                element={<ShiftTemplatesPage />}
              />
              <Route
                path={`${ROUTES.SHIFT_SETUP}/:id`}
                element={<ShiftTemplatesEditPage />}
              />{' '}
            </Route>
            <Route
              element={<RequirePermission module={RBAC_MODULES.ACTIVITY_LOG} />}
            >
              <Route path={ROUTES.ACTIVITY_LOG} element={<ActivityLogPage />} />
            </Route>

            <Route path={ROUTES.REPORTING} element={<ReportingHubPage />} />
            <Route
              path={ROUTES.INCIDENT_REPORT}
              element={<IncidentManagementPage />}
            />
            <Route
              path={`${ROUTES.INCIDENT_REPORT}/new`}
              element={<IncidentManagementPage />}
            />
            <Route
              path={`${ROUTES.INCIDENT_REPORT}/:idOrRef`}
              element={<IncidentManagementPage />}
            />
            <Route
              path={`${ROUTES.INCIDENT_REPORT}/:idOrRef/print`}
              element={<IncidentManagementPage />}
            />
            <Route
              element={
                <RequirePermission module={RBAC_MODULES.REPORTING_CLINICAL} />
              }
            >
              <Route
                path={ROUTES.REPORTING_CLINICAL_INCIDENTS}
                element={<IncidentSummaryReportPage />}
              />
              <Route
                path={`${ROUTES.REPORTING_CLINICAL_PARTICIPANTS}/:id?`}
                element={<ParticipantsReportPage />}
              />
            </Route>

            {/* Combined Compliance & Onboarding Admin Protection */}
            <Route
              element={
                <RequirePermission module={RBAC_MODULES.ADMIN_COMPLIANCE} />
              }
            >
              <Route
                path={ROUTES.COMPLIANCE_SETTINGS}
                element={<ComplianceSettingsPage />}
              />
              <Route
                path={ROUTES.COMPLIANCE_MONITORING}
                element={<ComplianceMonitoringPage />}
              />
              <Route
                path={ROUTES.REPORT_COMPLIANCE}
                element={<ComplianceReportPage />}
              />
            </Route>

            <Route
              element={
                <RequirePermission module={RBAC_MODULES.ADMIN_ONBOARDING} />
              }
            >
              <Route
                path={ROUTES.ONBOARDING_SETTINGS}
                element={<OnboardingSettingsPage />}
              />
              <Route
                path={ROUTES.ONBOARDING_MONITORING}
                element={<OnboardingMonitoringPage />}
              />
              <Route
                path={ROUTES.REPORT_ONBOARDING}
                element={<OnboardingReportPage />}
              />
            </Route>

            <Route element={<RequireAdmin />}>
              <Route
                path={ROUTES.CHECKLIST_TEMPLATES}
                element={<ChecklistMasterPage />}
              />
              <Route
                element={
                  <RequirePermission module={RBAC_MODULES.MASTER_LISTS} />
                }
              >
                <Route
                  path={ROUTES.LEAVE_TYPES}
                  element={<LeaveTypeMasterPage />}
                />
                <Route
                  path={ROUTES.CLINICAL_TRACKER_SETTINGS}
                  element={<ClinicalTrackersPage />}
                />
              </Route>
              <Route path={ROUTES.ACCESS_CONTROL} element={<RolesPage />} />
            </Route>

            <Route
              path={ROUTES.AUTH_WELCOME}
              element={<AuthWelcomeMessagePage />}
            />
            <Route
              path={ROUTES.AUTH_DEACTIVATED}
              element={<AuthAccountDeactivatedPage />}
            />
          </Route>
        </Route>
        <Route path={`${ROUTES.ERROR}/*`} element={<ErrorRouting />} />
        <Route path={`${ROUTES.AUTH}/*`} element={<AuthRouting />} />
        <Route path="*" element={<Navigate to={ROUTES.ERROR_404} />} />
      </Routes>
    </Suspense>
  );
}
