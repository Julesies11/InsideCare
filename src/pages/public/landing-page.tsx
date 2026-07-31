import { useEffect } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { Link, useNavigate } from 'react-router';
import { Card, CardContent } from '@/components/ui/card';
import { ScreenLoader } from '@/components/common/screen-loader';
import { 
  Activity, 
  Target, 
  Sparkles, 
  BookOpen, 
  ArrowRight, 
  Plus, 
  CheckCircle2, 
  ShieldCheck, 
  BarChart3,
  Users,
  UserCheck,
  Clock,
  ShieldAlert,
  FileText,
  CheckSquare,
  Home,
  Smartphone,
  CheckSquare2,
  Lock,
  ClipboardCheck,
  Building,
  User,
  MapPin,
  ChevronDown,
  CalendarRange,
  Pill,
  FileSpreadsheet,
  Sliders,
  UserPlus,
  ToggleLeft,
  FileDown,
  History,
  UserCog
} from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { ROUTES } from '@/config/routes.config';

export function LandingPage() {
  const { auth, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  // Role-based redirect if session exists
  useEffect(() => {
    if (loading) return;

    if (auth?.access_token) {
      if (isAdmin) {
        navigate(ROUTES.DASHBOARD, { replace: true });
      } else {
        navigate(ROUTES.MY_DASHBOARD, { replace: true });
      }
    }
  }, [auth, isAdmin, loading, navigate]);

  if (loading) {
    return <ScreenLoader />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col font-sans selection:bg-primary/30 select-none overflow-x-hidden w-full relative">
      
      {/* Background decoration elements */}
      <div className="hidden sm:block absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse duration-[8000ms]"></div>
      <div className="hidden sm:block absolute top-[20%] right-1/4 w-[400px] h-[400px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none -z-10 animate-pulse duration-[10000ms]"></div>

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-zinc-950/70 border-b border-slate-200/50 dark:border-zinc-800/50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={toAbsoluteUrl('/media/app/mini-logo.png')}
              className="h-[32px]"
              alt="Logo"
            />
            <span className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
              Inside<span className="text-primary">Care</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link 
              to={ROUTES.AUTH_SIGNIN}
              className="px-4 py-2 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 shadow-md shadow-primary/20 transition-all text-xs sm:text-sm cursor-pointer"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-6 md:pt-20 md:pb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary font-semibold text-xs animate-fade-in tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5" /> Disability Care Management Platform
        </div>
        
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tight text-slate-950 dark:text-white max-w-4xl mx-auto leading-[1.1]">
          Elevate Your Care. <br className="hidden md:block" />
          Empower Your <span className="text-primary relative inline-block">
            Team
            <span className="absolute bottom-1.5 left-0 w-full h-[6px] bg-primary/20 rounded"></span>
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto font-medium">
          Integrated houses, rosters, staff dashboards, checklists, compliance checks, and operational reporting built for disability care providers.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link 
            to={ROUTES.AUTH_SIGNIN} 
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary text-white font-extrabold text-base hover:bg-primary/90 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            Launch Platform <ArrowRight className="w-5 h-5" />
          </Link>
          <a 
            href="#features" 
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm font-bold text-base hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all text-center"
          >
            Explore Features
          </a>
        </div>
      </section>

      {/* Feature Showcases (6 Alternating Z-Pattern Sections) */}
      <section id="features" className="pt-4 pb-16 md:pt-6 md:pb-24 space-y-20 md:space-y-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Feature 1: Houses & Participants */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 space-y-5 text-left">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider inline-block">
              Houses & Participants
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
              Centralized Residence & Care Records
            </h2>
            <p className="text-slate-600 dark:text-zinc-400 text-base leading-relaxed font-medium">
              Manage facility details, resident care profiles, and medical histories. Setup dynamic clinical trackers based on individual care plan requirements.
            </p>
            <ul className="space-y-3 pt-2">
              <li className="flex items-start gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>House directory with occupancy and contact details.</span>
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>Preference-driven visibility for active clinical trackers.</span>
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>Centralized medication registers with precise categories.</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-300/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden text-slate-900 dark:text-zinc-100">
              <div className="h-7 flex items-center justify-between px-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-100/90 dark:bg-zinc-950/90 select-none">
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-500">insidecare.app/participants/detail</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Profile Mockup</span>
              </div>
              <div className="p-5 bg-white dark:bg-zinc-900 text-left space-y-4">
                <div className="flex items-center gap-3 border-b dark:border-zinc-800 pb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                    SC
                  </div>
                  <div>
                    {/* Steel Blue click navigate link style */}
                    <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline cursor-pointer">Sarah Connor</h3>
                    <p className="text-[10px] text-slate-500">Resident ID: Beachside Villa · <span className="text-green-800 dark:text-green-400 font-semibold bg-green-100 dark:bg-green-950/30 px-1.5 py-0.25 rounded">Active</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="border border-slate-100 dark:border-zinc-800 rounded-xl p-3 bg-slate-50/50 dark:bg-zinc-950/50">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Active Trackers</span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-[9px] font-extrabold rounded">Bowel</span>
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-[9px] font-extrabold rounded">Sleep</span>
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-[9px] font-extrabold rounded">Medication</span>
                    </div>
                  </div>
                  <div className="border border-slate-100 dark:border-zinc-800 rounded-xl p-3 bg-slate-50/50 dark:bg-zinc-950/50">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Primary Contact</span>
                    <span className="font-medium block mt-1 text-[11px] text-blue-700 dark:text-blue-400 hover:underline cursor-pointer">Dr. Miles Dyson</span>
                    <span className="text-[10px] text-slate-500 font-semibold">Ph: +61 411 222 333</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Staff Rostering */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 lg:order-1 order-2">
            <div className="rounded-2xl border border-slate-300/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden text-slate-900 dark:text-zinc-100">
              <div className="h-7 flex items-center justify-between px-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-100/90 dark:bg-zinc-950/90 select-none">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-400"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                  <span className="w-3 h-3 rounded-full bg-green-400"></span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-500 ml-2">insidecare.app/roster-board</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Roster Grid</span>
              </div>
              <div className="p-4 bg-white dark:bg-zinc-900 text-left overflow-x-auto">
                <div className="min-w-[640px]">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-3">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Roster: Beachside Villa</h3>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-[9px] font-black uppercase rounded border border-red-200/50">2 Open Slots</span>
                    </div>
                  </div>

                  {/* Dynamic color schemes mapping directly to getShiftTheme definitions */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {/* Mon - Morning Shift */}
                    <div className="border border-slate-100 dark:border-zinc-800 rounded-xl p-2 bg-slate-50/50 dark:bg-zinc-950/50">
                      <span className="text-[10px] font-bold text-slate-400 block border-b pb-1">MON 25 MAY</span>
                      {/* morning/amber color scheme: bg-amber-500/10 text-amber-700 border-amber-200 */}
                      <div className="bg-amber-500/10 text-amber-700 dark:text-amber-500 border border-amber-200 p-1.5 rounded text-[10px] mt-1 space-y-1">
                        <div className="font-extrabold">Morning Shift</div>
                        <div className="text-[9px] font-bold text-slate-600 dark:text-zinc-300 flex items-center gap-1"><User className="w-2.5 h-2.5" /> Sarah Connor</div>
                      </div>
                    </div>

                    {/* Tue - Afternoon Shift */}
                    <div className="border border-slate-100 dark:border-zinc-800 rounded-xl p-2 bg-slate-50/50 dark:bg-zinc-950/50">
                      <span className="text-[10px] font-bold text-slate-400 block border-b pb-1">TUE 26 MAY</span>
                      {/* afternoon/orange color scheme: bg-orange-500/10 text-orange-700 border-orange-200 */}
                      <div className="bg-orange-500/10 text-orange-700 dark:text-orange-500 border border-orange-200 p-1.5 rounded text-[10px] mt-1 space-y-1">
                        <div className="font-extrabold">Afternoon Shift</div>
                        <div className="text-[9px] font-bold text-slate-600 dark:text-zinc-300 flex items-center gap-1"><User className="w-2.5 h-2.5" /> John Doe</div>
                      </div>
                    </div>

                    {/* Wed - Open Shift */}
                    <div className="border border-slate-100 dark:border-zinc-800 rounded-xl p-2 bg-slate-50/50 dark:bg-zinc-950/50">
                      <span className="text-[10px] font-bold text-slate-400 block border-b pb-1">WED 27 MAY</span>
                      {/* unassigned / open shift styling: border-dashed border-gray-300 bg-gray-50/10 with Assign Staff badge */}
                      <div className="border border-dashed border-gray-300 dark:border-zinc-800 bg-gray-50/10 dark:bg-zinc-950/10 p-1.5 rounded text-[10px] mt-1 space-y-1">
                        <div className="font-extrabold text-amber-600 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> OPEN SHIFT</div>
                        {/* Assign Staff Button matching real Roster quick assign button */}
                        <button className="text-[9px] flex items-center justify-between gap-1 font-black text-amber-700 hover:text-amber-800 bg-amber-100 hover:bg-amber-200 px-1.5 py-0.5 rounded-md transition-all border border-amber-200 w-full cursor-pointer mt-1">
                          <span className="truncate">ASSIGN STAFF</span>
                          <ChevronDown className="w-2.5 h-2.5 shrink-0 opacity-70" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5 text-left lg:order-2 order-1">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider inline-block">
              Staff Rostering
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
              Skeleton Rosters & Smart Allocations
            </h2>
            <p className="text-slate-600 dark:text-zinc-400 text-base leading-relaxed font-medium">
              Plan shifts efficiently. Build skeleton rosters using custom house templates, leave allocation, and quickly identify uncovered slots using Open Shifts.
            </p>
            <ul className="space-y-3 pt-2">
              <li className="flex items-start gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>Materialize house templates to populate weeks.</span>
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>Open Shifts highlight missing staff slots.</span>
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>Copy Week action to roll rosters forward.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Feature 3: Staff App */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 space-y-5 text-left">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider inline-block">
              Staff App
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
              Support Worker Mobile Hub
            </h2>
            <p className="text-slate-600 dark:text-zinc-400 text-base leading-relaxed font-medium">
              Empower staff on site. Support workers log into their dedicated portal to view upcoming rosters, sign checklists, complete shift logs, and submit timesheets.
            </p>
            <ul className="space-y-3 pt-2">
              <li className="flex items-start gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>"My Roster" view showing personal upcoming commitments.</span>
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>Direct, secure logging for clinical shift notes.</span>
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>One-click timesheet creation from rostered shifts.</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-7">
            <div className="max-w-xs mx-auto rounded-3xl border-8 border-slate-800 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden text-slate-900 dark:text-zinc-100 aspect-[9/16] relative flex flex-col">
              {/* Speaker & camera slot */}
              <div className="h-6 bg-slate-800 flex items-center justify-center relative">
                <div className="w-16 h-3.5 bg-black rounded-full absolute top-1" />
              </div>
              <div className="p-4 bg-slate-50 dark:bg-zinc-950 flex-1 space-y-4 text-left overflow-y-auto">
                <div className="flex justify-between items-center border-b pb-2 dark:border-zinc-800">
                  <span className="text-xs font-black uppercase">My Dashboard</span>
                  <Smartphone className="w-4 h-4 text-slate-400" />
                </div>

                {/* Shift Card */}
                <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400">active shift today</span>
                  {/* morning/amber theme: bg-amber-500/10 text-amber-700 border-amber-200 */}
                  <div className="bg-amber-500/10 text-amber-700 border border-amber-200 p-2 rounded-xl text-xs space-y-0.5">
                    <h4 className="font-extrabold">Morning - Sanctuary House</h4>
                    <p className="text-[10px] opacity-80">07:00 - 15:00</p>
                  </div>
                  {/* warning-soft status tag: text-yellow-700 bg-yellow-100 */}
                  <div className="bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-600 text-[8px] font-black px-2 py-0.5 rounded-full inline-block mt-1 border border-yellow-200/50">
                    Checklist Pending
                  </div>
                </div>

                {/* Quick actions */}
                <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-extrabold text-blue-700 dark:text-blue-400">
                  <div className="bg-white dark:bg-zinc-900 p-2 border rounded-lg hover:underline cursor-pointer">My Roster</div>
                  <div className="bg-white dark:bg-zinc-900 p-2 border rounded-lg hover:underline cursor-pointer">New Leave</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 4: Checklists */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 lg:order-1 order-2">
            <div className="rounded-2xl border border-slate-300/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden text-slate-900 dark:text-zinc-100">
              <div className="h-7 flex items-center justify-between px-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-100/90 dark:bg-zinc-950/90 select-none">
                <div className="flex items-center gap-2">
                  <CheckSquare2 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-500">insidecare.app/my-checklists</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Routines Checklist</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-zinc-950 space-y-3 text-left">
                {/* Completed task signed off by worker */}
                <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-medium line-through text-slate-400 dark:text-zinc-500">Verify medication log matches blister pack count</div>
                      <div className="text-[9px] text-slate-500 font-bold">Signed: Sarah Connor at 07:15</div>
                    </div>
                  </div>
                </div>
                {/* Incomplete task blocking timesheet submission */}
                <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-zinc-700 shrink-0 mt-0.5 bg-white dark:bg-zinc-800" />
                    <div>
                      <div className="text-xs font-medium text-slate-900 dark:text-white">Record client daily activities log in shift notes</div>
                      {/* warning-soft / destructive-soft style blocks */}
                      <div className="text-[9px] text-red-700 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/30 border border-red-200/50 px-1.5 py-0.5 rounded mt-1.5 inline-block">
                        Mandatory - Timesheet block if incomplete
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5 text-left lg:order-2 order-1">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider inline-block">
              Checklists
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
              Enforced Shift Routines & Audits
            </h2>
            <p className="text-slate-600 dark:text-zinc-400 text-base leading-relaxed font-medium">
              Link checklists directly to rostered shifts. Complete and sign off shift routines (handover, safety checks, medication verification) to allow timesheet submission.
            </p>
            <ul className="space-y-3 pt-2">
              <li className="flex items-start gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>Individual accountability: sign-off tracking per staff.</span>
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>Timesheet blocking forces operational checklist adherence.</span>
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>House calendar tasks for shared daily facility cleaning/checks.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Feature 5: Compliance */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 space-y-5 text-left">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider inline-block">
              Compliance
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
              100-Point Checks & Compliance Monitoring
            </h2>
            <p className="text-slate-600 dark:text-zinc-400 text-base leading-relaxed font-medium">
              Setup onboarding workflows and track compliance documents. Automatically track expiring checks (Ndis screening, First aid, Driving license) with full attachment validation.
            </p>
            <ul className="space-y-3 pt-2">
              <li className="flex items-start gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>100-point point-based configuration settings for staff verification.</span>
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>Enforced attachments and document numbers for active status.</span>
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>Real-time monitoring console listing expiring checks.</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-300/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden text-slate-900 dark:text-zinc-100">
              <div className="h-7 flex items-center justify-between px-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-100/90 dark:bg-zinc-950/90 select-none">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-500">insidecare.app/admin/compliance-monitoring</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Monitoring View</span>
              </div>
              <div className="p-4 bg-white dark:bg-zinc-900 text-left space-y-3">
                <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-2">
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white">Active Compliance Audit</h4>
                  
                  {/* Item 1 - Expired using real destructive-soft badge color */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t dark:border-zinc-800">
                    <span className="font-bold text-slate-700 dark:text-zinc-300">NDIS Worker Screening Check</span>
                    <span className="px-2 py-0.5 text-[var(--color-destructive-accent,var(--color-red-700))] bg-[var(--color-destructive-soft,var(--color-red-50))] dark:bg-red-950/30 dark:text-red-400 text-[8px] font-black uppercase rounded border border-red-200/50">Expired</span>
                  </div>

                  {/* Item 2 - Expiring Soon using real warning-soft badge color */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-bold text-slate-700 dark:text-zinc-300">First Aid & CPR Certificate</span>
                    <span className="px-2 py-0.5 text-[var(--color-warning-accent,var(--color-yellow-700))] bg-[var(--color-warning-soft,var(--color-yellow-100))] dark:bg-yellow-950/30 dark:text-yellow-600 text-[8px] font-black uppercase rounded border border-yellow-200/50">Expiring Soon</span>
                  </div>

                  {/* Item 3 - Complete using real success-soft badge color */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-bold text-slate-700 dark:text-zinc-300">Working with Children Check (WWCC)</span>
                    <span className="px-2 py-0.5 text-[var(--color-success-accent,var(--color-green-800))] bg-[var(--color-success-soft,var(--color-green-100))] dark:bg-green-950/30 dark:text-green-400 text-[8px] font-black uppercase rounded border border-green-200/50">Complete</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 6: Reporting */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 lg:order-1 order-2">
            <div className="rounded-2xl border border-slate-300/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden text-slate-900 dark:text-zinc-100">
              <div className="h-7 flex items-center justify-between px-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-100/90 dark:bg-zinc-950/90 select-none">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-500">insidecare.app/incidents/INC-20260525-SC</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Lodged Report</span>
              </div>
              <div className="p-4 bg-white dark:bg-zinc-900 text-left space-y-3">
                <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      {/* Steel Blue click navigate link style */}
                      <h4 className="text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline cursor-pointer">Incident INC-20260525-1430-SC</h4>
                      <p className="text-[9px] text-slate-400">Severity: <span className="text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/30 px-1 py-0.25 rounded font-bold">High</span> | Status: <span className="text-yellow-700 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-950/30 px-1 py-0.25 rounded font-bold">Under Review</span></p>
                    </div>
                    {/* NDIS reportable flags */}
                    <span className="bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50 text-[8px] font-black px-2 py-0.5 rounded-full">Reportable</span>
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-zinc-400 leading-relaxed font-semibold">
                    Escalation observed during community transit. Brief restrictive practice applied as authorized in active care plan. Witnesses and dates captured.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5 text-left lg:order-2 order-1">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider inline-block">
              Reporting
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
              Structured Incident Audits & Exports
            </h2>
            <p className="text-slate-600 dark:text-zinc-400 text-base leading-relaxed font-medium">
              Lodge structured incident reports with restrictive practice tracking. Generate print-ready single participant profile reports and organizational compliance reviews.
            </p>
            <ul className="space-y-3 pt-2">
              <li className="flex items-start gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>Reference IDs computed using participant initials.</span>
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>Admin review console with actions and auditing trace.</span>
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>Print-optimized Single Incident layout previews.</span>
              </li>
            </ul>
          </div>
        </div>

      </section>

      {/* Secondary Features Grid (Additional Platform Pillars) */}
      <section className="py-20 bg-slate-100/50 dark:bg-zinc-900/30 border-y border-slate-200/50 dark:border-zinc-800/50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">Additional Platform Pillars</h2>
            <p className="text-slate-600 dark:text-zinc-400 font-medium">
              A comprehensive set of administrative tools, workflows, and access controls powering InsideCare.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Pillar 1: Leave & Availability */}
            <Card className="group border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:shadow-xl hover:border-primary/30 dark:hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CalendarRange className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">Leave & Availability</h3>
                <p className="text-sm text-slate-600 dark:text-zinc-400">
                  Workers log availability windows and request leave blocks. Admins manage and approve requests from a centralized calendar board.
                </p>
              </CardContent>
            </Card>

            {/* Pillar 2: Medication & Blister Registers */}
            <Card className="group border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:shadow-xl hover:border-primary/30 dark:hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Pill className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">Medication & Blister Registers</h3>
                <p className="text-sm text-slate-600 dark:text-zinc-400">
                  Track participant medication schedules, category classifications, and dosage confirmations aligned with shift handover logs.
                </p>
              </CardContent>
            </Card>

            {/* Pillar 3: Timesheet Approvals */}
            <Card className="group border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:shadow-xl hover:border-primary/30 dark:hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">Timesheet Approvals</h3>
                <p className="text-sm text-slate-600 dark:text-zinc-400">
                  Review and audit support worker hours. Auto-generate timesheets from rosters and sign off hours for payroll processing.
                </p>
              </CardContent>
            </Card>

            {/* Pillar 4: Checklist Templates */}
            <Card className="group border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:shadow-xl hover:border-primary/30 dark:hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sliders className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">Checklist Templates</h3>
                <p className="text-sm text-slate-600 dark:text-zinc-400">
                  Design granular template checklists for houses, shifts, or specific audits with strict requirements and mandatory flags.
                </p>
              </CardContent>
            </Card>

            {/* Pillar 5: Onboarding Settings */}
            <Card className="group border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:shadow-xl hover:border-primary/30 dark:hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">Onboarding Settings</h3>
                <p className="text-sm text-slate-600 dark:text-zinc-400">
                  Configure point-based onboarding metrics and document types. Easily track completion rates for newly hired employees.
                </p>
              </CardContent>
            </Card>

            {/* Pillar 6: Clinical Tracker Settings */}
            <Card className="group border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:shadow-xl hover:border-primary/30 dark:hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ToggleLeft className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">Clinical Tracker Settings</h3>
                <p className="text-sm text-slate-600 dark:text-zinc-400">
                  Enable or disable specific tracking modules (Meals, Bowels, Sleep) globally or per participant profile.
                </p>
              </CardContent>
            </Card>

            {/* Pillar 7: Access Control (RBAC) */}
            <Card className="group border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:shadow-xl hover:border-primary/30 dark:hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">Access Control & RBAC</h3>
                <p className="text-sm text-slate-600 dark:text-zinc-400">
                  Granular permission allocation mapping user roles to dynamic database modules (Full, Write, Read, None) with ghost-lock overrides.
                </p>
              </CardContent>
            </Card>

            {/* Pillar 8: Word Document Templates */}
            <Card className="group border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:shadow-xl hover:border-primary/30 dark:hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileDown className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">Word Document Templates</h3>
                <p className="text-sm text-slate-600 dark:text-zinc-400">
                  Upload custom `.docx` templates to automatically generate pre-formatted, print-ready reports containing live care data.
                </p>
              </CardContent>
            </Card>

            {/* Pillar 9: Business Auditing Logs */}
            <Card className="group border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:shadow-xl hover:border-primary/30 dark:hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <History className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">Business Auditing Logs</h3>
                <p className="text-sm text-slate-600 dark:text-zinc-400">
                  Complete operational accountability. Visual tracking of table updates, who changed what, when, and exact state histories.
                </p>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 md:py-24 text-center max-w-4xl mx-auto px-4 space-y-8">
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white leading-tight">
          Ready to Modernize Your Disability Care Operations?
        </h2>
        <p className="text-slate-600 dark:text-zinc-400 text-lg max-w-2xl mx-auto font-medium">
          Deploy unassigned rosters, monitor shift document compliance, track training certifications, and secure your files instantly.
        </p>
        <div>
          <Link 
            to={ROUTES.AUTH_SIGNIN} 
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-white font-extrabold text-base hover:bg-primary/90 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            Access Platform Dashboard <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-slate-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Column 1: Brand & Pitch */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
                  Inside<span className="text-primary">Care</span>
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-medium">
                Comprehensive care tracking, unassigned rosters, dynamic routines, and secure document access for care providers.
              </p>
              <div className="pt-2 flex items-center gap-2 text-2xs text-primary font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-primary" /> SECURE OPERATIONS PLATFORM
              </div>
            </div>

            {/* Column 2: Product Features */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Operations</h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                <li><a href="#features" className="hover:text-primary transition-colors">Roster Board</a></li>
                <li><a href="#features" className="hover:text-primary transition-colors">Shift Notes Log</a></li>
                <li><a href="#features" className="hover:text-primary transition-colors">Enforced Routines</a></li>
                <li><a href="#features" className="hover:text-primary transition-colors">Incident Reports</a></li>
              </ul>
            </div>

            {/* Column 3: Account & Access */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Access</h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                <li><Link to={ROUTES.AUTH_SIGNIN} className="hover:text-primary transition-colors">Sign In</Link></li>
              </ul>
            </div>

            {/* Column 4: Platform & Support */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Status</h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> System Active</li>
              </ul>
            </div>

          </div>

          {/* Bottom Copyright Divider */}
          <div className="pt-8 border-t border-slate-200/50 dark:border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
            <p>© {new Date().getFullYear()} InsideCare. All rights reserved.</p>
            <p className="text-2xs text-slate-400">Designed with React, Tailwind & Metronic UI</p>
          </div>

        </div>
      </footer>
    </div>
  );
}
