import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PrintableReport } from '@/components/common/printable-report';

interface ShiftNotePrintableProps {
  note: any;
}

export function ShiftNotePrintable({ note }: ShiftNotePrintableProps) {
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

  const formatTimeOnly = (timeStr?: string | null) => {
    if (!timeStr) return 'N/A';
    // If it's already HH:MM, just return it
    if (/^\d{2}:\d{2}/.test(timeStr)) {
      return timeStr.substring(0, 5);
    }
    return timeStr;
  };

  const participant = note.participant || {};
  const showBowel = !!participant.track_bowel;
  const showSeizure = !!participant.track_seizure;
  const showSleep = !!participant.track_sleep;
  const showBehaviour = !!participant.track_behaviour;
  const showCommunity = !!participant.track_community;
  const showNutrition = !!participant.track_nutrition;
  const showMtm = !!participant.track_mtm;
  const showHygiene = !!participant.track_hygiene;

  return (
    <div className="w-full max-w-[210mm] print:m-0 print:p-0 mx-auto">
      <PrintableReport
        title="Shift Note Record"
        subtitle="Confidential Daily Care & Progress Report"
        parameters={{
          'Reference ID': note.reference_id || 'N/A',
          'Document Status': note.status === 'active' ? 'Completed' : 'Draft',
        }}
      >
        <div className="space-y-6 pt-2 font-sans text-xs text-gray-800">
          {/* Section 1: Overview & Parties */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-900 pb-1">
              1. Overview & General Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3 bg-gray-50/50 p-3 rounded-lg border border-gray-200/60">
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                  Participant
                </span>
                <span className="font-semibold text-gray-950">
                  {participant.participant_name || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                  Support Worker (Staff)
                </span>
                <span className="font-semibold text-gray-950">
                  {note.staff?.staff_name || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                  Shift Date
                </span>
                <span className="font-semibold text-gray-950">
                  {formatDateOnly(note.start_date)}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                  Shift Start Time
                </span>
                <span className="font-semibold text-gray-950">
                  {formatTimeOnly(note.shift_time)}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                  House / Location
                </span>
                <span className="font-semibold text-gray-950">
                  {note.house?.house_name || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                  Shift Period
                </span>
                <span className="font-semibold text-gray-950 capitalize">
                  {note.shift_type || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                  Date Created
                </span>
                <span className="font-semibold text-gray-950">
                  {formatDateTime(note.created_at)}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                  Last Updated
                </span>
                <span className="font-semibold text-gray-950">
                  {formatDateTime(note.updated_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Narrative & Presentation */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-900 pb-1">
              2. Observation & General Presentation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 border border-gray-100 rounded-lg bg-gray-50/20">
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider mb-1">
                  Overall Presentation
                </span>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                  {note.overall_presentation || 'No presentation notes recorded.'}
                </p>
              </div>
              <div className="p-3 border border-gray-100 rounded-lg bg-gray-50/20">
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider mb-1">
                  Shift Summary
                </span>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {note.shift_summary || 'No summary recorded.'}
                </p>
              </div>
            </div>
            {note.notes && (
              <div className="p-3 border border-gray-100 rounded-lg bg-gray-50/20">
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider mb-1">
                  Additional Notes
                </span>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {note.notes}
                </p>
              </div>
            )}
            {note.risks_observed && (
              <div className="p-3 border border-red-200 rounded-lg bg-red-50/20">
                <span className="text-[9px] uppercase font-bold text-red-600 block tracking-wider mb-1">
                  Risks Observed
                </span>
                <p className="text-red-700 leading-relaxed whitespace-pre-wrap font-semibold">
                  {note.risk_description || 'No detailed risk description recorded.'}
                </p>
              </div>
            )}
          </div>

          {/* Section 3: Supports & Goals */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-900 pb-1">
              3. ADL & Goal Supports
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 border border-gray-100 rounded-lg bg-gray-50/20">
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider mb-1">
                  ADL Supports
                </span>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {note.adl_supports || 'No ADL support notes recorded.'}
                </p>
              </div>
              <div className="p-3 border border-gray-100 rounded-lg bg-gray-50/20">
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider mb-1">
                  Domestic Tasks
                </span>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {note.domestic_tasks || 'No domestic tasks recorded.'}
                </p>
              </div>
              <div className="p-3 border border-gray-100 rounded-lg bg-gray-50/20">
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider mb-1">
                  Capacity Building Goals
                </span>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                  {note.capacity_building_goals || 'No goal progress notes recorded.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Medications */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-900 pb-1">
              4. Medication Administration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-3 rounded-lg border border-gray-200/60">
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                  Regular Medication Status
                </span>
                <span className="font-semibold text-gray-950 capitalize">
                  {note.regular_medication_status || 'None'}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                  PRN Medication Given
                </span>
                <span className="font-semibold text-gray-950">
                  {note.prn_medication_given ? 'Yes' : 'No'}
                </span>
              </div>
              {note.prn_medication_given && (
                <div className="col-span-1 md:col-span-2 border-t border-gray-200/60 pt-3">
                  <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider mb-1">
                    PRN Details (Reason, Dosage, Effect)
                  </span>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {note.prn_description || 'No PRN description recorded.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: PBS & Restrictive Practices */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-900 pb-1 flex justify-between items-center">
              <span>5. PBS & Restrictive Practices</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter',
                  note.restrictive_practices_status !== 'none'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-gray-100 text-gray-500',
                )}
              >
                Restrictive Practices Status: {note.restrictive_practices_status || 'None'}
              </span>
            </h3>
            <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-200/60 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                    PBS Strategies Used
                  </span>
                  <span className="font-semibold text-gray-950">
                    {note.pbs_strategies_used ? 'Yes' : 'No'}
                  </span>
                </div>
                {note.pbs_strategies_used && (
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                      When Strategies Were Applied
                    </span>
                    <span className="font-semibold text-gray-950">
                      {note.pbs_when_used || 'N/A'}
                    </span>
                  </div>
                )}
              </div>
              {note.pbs_strategies_used && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-200/60 pt-3">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider mb-1">
                      PBS Strategies Details
                    </span>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {note.pbs_strategies_details}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider mb-1">
                      PBS Intervention Outcome
                    </span>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {note.pbs_outcome}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 6: Clinical Trackers */}
          <div className="space-y-4 page-break">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-900 pb-1">
              6. Clinical & Activity Trackers
            </h3>

            {/* Bowel */}
            {showBowel && note.bowel_movement_occurred && (
              <div className="p-3 border border-blue-100 rounded-lg bg-blue-50/10 space-y-2">
                <div className="flex justify-between items-center border-b border-blue-100 pb-1">
                  <span className="font-bold text-blue-900 uppercase text-[9px] tracking-wide">
                    Bowel Movement Logged
                  </span>
                  <span className="text-[10px] font-semibold text-blue-950">
                    Time: {formatTimeOnly(note.bowel_time)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Bristol Type</span>
                    <span className="font-semibold text-gray-900">Type {note.bowel_bristol_scale}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Amount</span>
                    <span className="font-semibold text-gray-900">{note.bowel_amount?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Assistance Level</span>
                    <span className="font-semibold text-gray-900">{note.bowel_assistance?.name || 'N/A'}</span>
                  </div>
                </div>
                {note.bowel_notes && (
                  <div className="pt-2 border-t border-blue-50/50">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">Bowel Notes</span>
                    <p className="text-gray-700">{note.bowel_notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Seizure */}
            {showSeizure && note.seizure_occurred && (
              <div className="p-3 border border-red-100 rounded-lg bg-red-50/10 space-y-2">
                <div className="flex justify-between items-center border-b border-red-100 pb-1">
                  <span className="font-bold text-red-900 uppercase text-[9px] tracking-wide">
                    Seizure Event Logged
                  </span>
                  <span className="text-[10px] font-semibold text-red-950">
                    Started: {formatTimeOnly(note.seizure_time_started)}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Duration</span>
                    <span className="font-semibold text-gray-900">{note.seizure_duration_minutes} mins</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Seizure Type</span>
                    <span className="font-semibold text-gray-900">{note.seizure_type?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Injury Occurred</span>
                    <span className="font-semibold text-gray-900">{note.seizure_injury_occurred ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Emergency Services</span>
                    <span className="font-semibold text-gray-900">{note.seizure_emergency_services ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                {note.seizure_injury_occurred && (
                  <div className="pt-2 border-t border-red-100/30">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">Injury Details</span>
                    <p className="text-gray-700">{note.seizure_injury_description}</p>
                  </div>
                )}
                {note.seizure_notes && (
                  <div className="pt-2 border-t border-red-100/30">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">Seizure Notes</span>
                    <p className="text-gray-700">{note.seizure_notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Behaviour */}
            {showBehaviour && note.behaviour_observed && (
              <div className="p-3 border border-purple-100 rounded-lg bg-purple-50/10 space-y-2">
                <span className="font-bold text-purple-900 uppercase text-[9px] tracking-wide block border-b border-purple-100 pb-1">
                  Behaviour of Concern Observed
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Behaviour Type</span>
                    <span className="font-semibold text-gray-900">{note.behaviour_type || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Intensity</span>
                    <span className="font-semibold text-gray-900">{note.behaviour_intensity?.name || 'N/A'}</span>
                  </div>
                </div>
                {note.behaviour_notes && (
                  <div className="pt-2 border-t border-purple-100/30">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">Context & Staff Response</span>
                    <p className="text-gray-700 whitespace-pre-wrap">{note.behaviour_notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Sleep */}
            {showSleep && note.sleep_occurred && (
              <div className="p-3 border border-indigo-100 rounded-lg bg-indigo-50/10 space-y-2">
                <span className="font-bold text-indigo-900 uppercase text-[9px] tracking-wide block border-b border-indigo-100 pb-1">
                  Sleep Intervals Recorded
                </span>
                <table className="w-full text-left border-collapse text-xs mt-2">
                  <thead>
                    <tr className="border-b border-indigo-100/60 text-[9px] uppercase tracking-wider text-gray-400">
                      <th className="py-1.5 font-bold">Start Time</th>
                      <th className="py-1.5 font-bold">Wake Time</th>
                      <th className="py-1.5 font-bold">Sleep Type</th>
                      <th className="py-1.5 font-bold">Quality</th>
                      <th className="py-1.5 font-bold">Support Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(note.sleep_records || []).map((record: any, idx: number) => (
                      <tr key={record.id || idx} className="border-b border-gray-100">
                        <td className="py-2 font-medium text-gray-900">{formatTimeOnly(record.sleep_start_time)}</td>
                        <td className="py-2 font-medium text-gray-900">{formatTimeOnly(record.sleep_wake_time)}</td>
                        <td className="py-2 text-gray-700">{record.sleep_type?.name || 'N/A'}</td>
                        <td className="py-2 text-gray-700">{record.sleep_quality?.name || 'N/A'}</td>
                        <td className="py-2 text-gray-600">{record.sleep_support_required || 'None'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Community Access */}
            {showCommunity && note.community_access_occurred && (
              <div className="p-3 border border-emerald-100 rounded-lg bg-emerald-50/10 space-y-2">
                <span className="font-bold text-emerald-900 uppercase text-[9px] tracking-wide block border-b border-emerald-100 pb-1">
                  Community Access & Outings
                </span>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Activity Type</span>
                    <span className="font-semibold text-gray-900">{note.community_activity_type || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Location</span>
                    <span className="font-semibold text-gray-900">{note.community_location || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Engagement Level</span>
                    <span className="font-semibold text-gray-900">{note.community_engagement_level || 'N/A'}</span>
                  </div>
                </div>
                {note.community_notes && (
                  <div className="pt-2 border-t border-emerald-100/30">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">Outing Summary & Notes</span>
                    <p className="text-gray-700">{note.community_notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Nutrition */}
            {showNutrition && note.meal_provided && (
              <div className="p-3 border border-amber-100 rounded-lg bg-amber-50/10 space-y-2">
                <span className="font-bold text-amber-900 uppercase text-[9px] tracking-wide block border-b border-amber-100 pb-1">
                  Nutrition & Meal Intake
                </span>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Meal Type</span>
                    <span className="font-semibold text-gray-900">{note.nutrition_meal_type?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Intake Level</span>
                    <span className="font-semibold text-gray-900">{note.nutrition_intake?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Fluids Intake</span>
                    <span className="font-semibold text-gray-900">{note.nutrition_fluids_intake || 'N/A'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-amber-100/30 pt-2">
                  {note.nutrition_assistance_needed && (
                    <div>
                      <span className="text-[9px] uppercase font-bold text-gray-400 block">Assistance Needed</span>
                      <p className="text-gray-700">{note.nutrition_assistance_needed}</p>
                    </div>
                  )}
                  {note.nutrition_refusal_alternatives && (
                    <div>
                      <span className="text-[9px] uppercase font-bold text-gray-400 block">Refusal / Alternatives Offered</span>
                      <p className="text-gray-700">{note.nutrition_refusal_alternatives}</p>
                    </div>
                  )}
                </div>
                {note.nutrition_notes && (
                  <div className="pt-2 border-t border-amber-100/30">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">Nutrition Notes</span>
                    <p className="text-gray-700">{note.nutrition_notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* MTM */}
            {showMtm && note.mtm_meal_provided && (
              <div className="p-3 border border-orange-100 rounded-lg bg-orange-50/10 space-y-2">
                <span className="font-bold text-orange-950 uppercase text-[9px] tracking-wide block border-b border-orange-200/50 pb-1">
                  Mealtime Management Plan (MTMP) Enforcement
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-orange-800/80 block">Correct Texture</span>
                    <span className="font-semibold text-gray-900">{note.mtm_texture_correct === null ? 'N/A' : note.mtm_texture_correct ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-orange-800/80 block">Correct Consistency</span>
                    <span className="font-semibold text-gray-900">{note.mtm_consistency_correct === null ? 'N/A' : note.mtm_consistency_correct ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-orange-800/80 block">Appropriate Position</span>
                    <span className="font-semibold text-gray-900">{note.mtm_positioning_appropriate === null ? 'N/A' : note.mtm_positioning_appropriate ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-orange-800/80 block">Supervision Maintained</span>
                    <span className="font-semibold text-gray-900">{note.mtm_supervision_required === null ? 'N/A' : note.mtm_supervision_required ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-orange-100/40 pt-2 text-[11px]">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Diet Type</span>
                    <span className="font-semibold text-gray-900">{note.mtm_diet_type?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Fluids Category</span>
                    <span className="font-semibold text-gray-900">{note.mtm_fluids?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Swallowing Concerns</span>
                    <span className="font-semibold text-gray-900">{note.mtm_swallowing_concerns?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Meal Intake Summary</span>
                    <span className="font-semibold text-gray-900">{note.mtm_meal_intake?.name || 'N/A'}</span>
                  </div>
                </div>
                {note.mtm_concerns && (
                  <div className="pt-2 border-t border-orange-100/40">
                    <span className="text-[9px] uppercase font-bold text-red-700 block">Swallowing or Positioning Concerns Details</span>
                    <p className="text-red-950 font-semibold">{note.mtm_concerns}</p>
                  </div>
                )}
                {note.mtm_notes && (
                  <div className="pt-2 border-t border-orange-100/40">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">Care plan instructions followed / Shift notes</span>
                    <p className="text-gray-700 whitespace-pre-wrap">{note.mtm_notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Hygiene */}
            {showHygiene && note.hygiene_support_required && (
              <div className="p-3 border border-teal-100 rounded-lg bg-teal-50/10 space-y-2">
                <span className="font-bold text-teal-900 uppercase text-[9px] tracking-wide block border-b border-teal-100 pb-1">
                  Personal Hygiene Support
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Shower / Bath</span>
                    <span className="font-semibold text-gray-900">{note.hygiene_shower?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Oral Care</span>
                    <span className="font-semibold text-gray-900">{note.hygiene_oral_care?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Toileting Support</span>
                    <span className="font-semibold text-gray-900">{note.hygiene_toileting?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Grooming</span>
                    <span className="font-semibold text-gray-900">{note.hygiene_grooming?.name || 'N/A'}</span>
                  </div>
                </div>
                {note.hygiene_observed_concerns && (
                  <div className="pt-2 border-t border-teal-100/30">
                    <span className="text-[9px] uppercase font-bold text-amber-700 block">Skin Integrity / Hygiene Concerns</span>
                    <p className="text-amber-950 font-semibold">{note.hygiene_observed_concerns}</p>
                  </div>
                )}
                {note.hygiene_notes && (
                  <div className="pt-2 border-t border-teal-100/30">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">Hygiene Support Notes</span>
                    <p className="text-gray-700">{note.hygiene_notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Verification Sign-offs */}
          <div className="mt-12 grid grid-cols-2 gap-10 pt-8 border-t border-gray-200 page-break">
            <div className="space-y-4">
              <div className="h-px bg-gray-400 w-full mb-4"></div>
              <div className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                Support Worker Signature
              </div>
            </div>
            <div className="space-y-4 text-right">
              <div className="h-px bg-gray-400 w-full mb-4"></div>
              <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 text-right">
                House Manager / Coordinator Sign-Off
              </div>
            </div>
          </div>
        </div>
      </PrintableReport>
    </div>
  );
}
