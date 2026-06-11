import { IncidentReport } from '@/models/incident-report';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PrintableReport } from '@/components/common/printable-report';

interface IncidentSingleReportProps {
  incident: IncidentReport & {
    participant?: { participant_name: string };
    staff?: { staff_name: string };
    reporter?: { staff_name: string };
    house?: { house_name: string };
    incident_type_info?: { name: string };
    restrictive_practice_type_info?: { name: string };
  };
}

export function IncidentSingleReport({ incident }: IncidentSingleReportProps) {
  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    const dateObj = new Date(dateStr);
    return isNaN(dateObj.getTime())
      ? 'N/A'
      : format(dateObj, 'dd MMM yyyy HH:mm');
  };

  const formatDateOnly = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    const dateObj = new Date(dateStr);
    return isNaN(dateObj.getTime()) ? 'N/A' : format(dateObj, 'dd MMM yyyy');
  };

  return (
    <div className="w-full max-w-[210mm] print:m-0 print:p-0 mx-auto">
      <PrintableReport
        title="Incident Investigation Report"
        subtitle="Confidential Internal Safety & Compliance Record"
        parameters={{
          'Reference ID': incident.reference_id || 'N/A',
          'Report Status': incident.admin_status || 'New',
        }}
      >
        <div className="space-y-8 pt-4 font-sans text-xs text-gray-800">
          {/* Section 1: Overview & Involved Parties */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 pb-1.5">
              1. Overview & Involved Parties
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 bg-gray-50/50 p-4 rounded-lg border border-gray-200/60">
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                  Involved Participant
                </span>
                <span className="font-semibold text-gray-950">
                  {incident.participant?.participant_name ||
                    'General (No Participant)'}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                  Witnessed by Staff
                </span>
                <span className="font-semibold text-gray-950">
                  {incident.staff?.staff_name || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                  Incident Date & Time
                </span>
                <span className="font-semibold text-gray-950">
                  {formatDateTime(incident.incident_date)}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                  Date & Time Lodged
                </span>
                <span className="font-semibold text-gray-950">
                  {formatDateTime(incident.created_at)}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                  House/Facility
                </span>
                <span className="font-semibold text-gray-950">
                  {incident.house?.house_name || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                  Incident Category
                </span>
                <span className="font-semibold text-gray-950">
                  {incident.incident_type_info?.name || 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                  Severity Level
                </span>
                <span
                  className={cn(
                    'font-bold uppercase text-[10px]',
                    incident.severity === 'High'
                      ? 'text-red-600'
                      : incident.severity === 'Moderate'
                        ? 'text-orange-600'
                        : 'text-gray-600',
                  )}
                >
                  {incident.severity}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                  Priority Level
                </span>
                <span
                  className={cn(
                    'font-bold uppercase text-[10px]',
                    incident.priority === 'Critical'
                      ? 'text-red-700'
                      : incident.priority === 'High'
                        ? 'text-orange-700'
                        : 'text-gray-600',
                  )}
                >
                  {incident.priority}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                  Reported By
                </span>
                <span className="font-semibold text-gray-950">
                  {incident.reporter?.staff_name || 'System'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Narrative & Event Description */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 pb-1.5">
              2. Incident Narrative & Details
            </h3>

            <div className="space-y-3">
              <div className="p-3 border border-gray-100 rounded-lg bg-gray-50/20">
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider mb-1">
                  Brief Summary
                </span>
                <p className="font-semibold text-gray-900 italic">
                  "{incident.summary}"
                </p>
              </div>

              <div className="p-3 border border-gray-100 rounded-lg bg-gray-50/20">
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider mb-1">
                  Full Detailed Account
                </span>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {incident.details}
                </p>
              </div>

              <div className="p-3 border border-gray-100 rounded-lg bg-gray-50/20">
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider mb-1">
                  Immediate Actions & Outcome
                </span>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {incident.outcome}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: External Notifications */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 pb-1.5">
              3. External Notifications
            </h3>
            <div className="p-3 border border-gray-100 rounded-lg bg-gray-50/20">
              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider mb-1">
                Notified Parties (e.g. Guardians, Advocacy, Police)
              </span>
              <p className="text-gray-700 whitespace-pre-wrap">
                {incident.notified_parties ||
                  'No external notifications recorded.'}
              </p>
            </div>
          </div>

          {/* Section 4: Restrictive Practices (Conditional) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 pb-1.5 flex justify-between items-center">
              <span>4. Restrictive Practice Information</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter',
                  incident.is_restrictive_practice
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-gray-100 text-gray-500',
                )}
              >
                {incident.is_restrictive_practice
                  ? 'Restrictive Practice Used'
                  : 'No Restrictive Practice Used'}
              </span>
            </h3>

            {incident.is_restrictive_practice ? (
              <div className="space-y-4 bg-amber-50/20 p-4 rounded-lg border border-amber-100/60">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-amber-800/80 block tracking-wider">
                      Restraint Classification
                    </span>
                    <span className="font-semibold text-gray-900">
                      {incident.restrictive_practice_type_info?.name ||
                        'Not Specified'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-amber-800/80 block tracking-wider">
                      Restraint Start Time
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatDateTime(incident.rp_start_time)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-amber-800/80 block tracking-wider">
                      Restraint End Time
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatDateTime(incident.rp_end_time)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="border-t border-amber-100/40 pt-3">
                    <span className="text-[9px] uppercase font-bold text-amber-800/80 block tracking-wider mb-1">
                      Description of Restraint Used
                    </span>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {incident.restrictive_practice_description}
                    </p>
                  </div>
                  <div className="border-t border-amber-100/40 pt-3">
                    <span className="text-[9px] uppercase font-bold text-amber-800/80 block tracking-wider mb-1">
                      Reason Restraint was Deemed Necessary
                    </span>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {incident.rp_reason || 'Not documented.'}
                    </p>
                  </div>
                  <div className="border-t border-amber-100/40 pt-3">
                    <span className="text-[9px] uppercase font-bold text-amber-800/80 block tracking-wider mb-1">
                      Triggers leading to incident
                    </span>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {incident.rp_triggers || 'Not documented.'}
                    </p>
                  </div>
                  <div className="border-t border-amber-100/40 pt-3">
                    <span className="text-[9px] uppercase font-bold text-amber-800/80 block tracking-wider mb-1">
                      Observed Behaviours (Details)
                    </span>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {incident.rp_observed_behaviours || 'Not documented.'}
                    </p>
                  </div>
                  <div className="border-t border-amber-100/40 pt-3">
                    <span className="text-[9px] uppercase font-bold text-amber-800/80 block tracking-wider mb-1">
                      Restrictive Practice Outcome & Debriefing
                    </span>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {incident.rp_outcome || 'Not documented.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 italic text-[11px]">
                No restrictive practices or physical/chemical restraints were
                applied during this incident.
              </p>
            )}
          </div>

          {/* Section 5: NDIS Reportable details */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 pb-1.5 flex justify-between items-center">
              <span>5. NDIS Quality & Safeguards Commission</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter',
                  incident.is_ndis_reportable
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-500',
                )}
              >
                {incident.is_ndis_reportable
                  ? 'NDIS Reportable'
                  : 'Internal Report Only'}
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-lg border border-gray-200/60">
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                  NDIS Commission Reportable Status
                </span>
                <span className="font-semibold text-gray-900">
                  {incident.is_ndis_reportable
                    ? 'Yes - This incident qualifies as a reportable incident under NDIS rules.'
                    : 'No - This incident does not require direct reporting to the NDIS Commission.'}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                  Date Submitted to NDIS
                </span>
                <span className="font-semibold text-gray-950">
                  {incident.is_ndis_reportable
                    ? formatDateOnly(incident.ndis_reported_date)
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 6: Administrative Oversight & Resolutions */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 pb-1.5">
              6. Administrative Oversight & Resolutions
            </h3>
            <div className="space-y-3 bg-gray-50/50 p-4 rounded-lg border border-gray-200/60">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                    Oversight Status
                  </span>
                  <span className="font-semibold text-gray-950 capitalize">
                    {incident.admin_status || 'New'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                    Oversight Date Reviewed
                  </span>
                  <span className="font-semibold text-gray-950">
                    {formatDateTime(incident.updated_at)}
                  </span>
                </div>
              </div>
              <div className="border-t border-gray-200/60 pt-3">
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider mb-1">
                  Administrative Actions Taken & Notes
                </span>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {incident.admin_actions_taken ||
                    'No administrative follow-up action documented yet.'}
                </p>
              </div>
            </div>
          </div>

          {/* Verification Sign-offs */}
          <div className="mt-12 grid grid-cols-2 gap-10 pt-10 border-t border-gray-200">
            <div className="space-y-4">
              <div className="h-px bg-gray-400 w-full mb-6"></div>
              <div className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                Clinical safety / Delegated Officer Signature
              </div>
            </div>
            <div className="space-y-4 text-right">
              <div className="h-px bg-gray-400 w-full mb-6"></div>
              <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 text-right">
                Date of Review / Resolution
              </div>
            </div>
          </div>
        </div>
      </PrintableReport>
    </div>
  );
}
