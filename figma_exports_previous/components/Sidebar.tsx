import { 
  Home, 
  Settings, 
  Building, 
  Users, 
  Shield, 
  BookOpen, 
  MapPin, 
  Network, 
  ClipboardCheck, 
  Search, 
  AlertTriangle, 
  FileText, 
  FormInput, 
  BarChart3, 
  User, 
  StickyNote, 
  DollarSign, 
  UserCheck, 
  Folder, 
  Calendar, 
  Clock, 
  FileCheck, 
  List, 
  HelpCircle
} from "lucide-react"
import { Button } from "./ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible"
import { useState } from "react"

interface NavItem {
  label: string
  icon: any
  children?: NavItem[]
  pageId?: string
}

const navigationItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: Home,
    pageId: "dashboard"
  },
  {
    label: "Admin Centre",
    icon: Settings,
    children: [
      { label: "Branch Details", icon: Building, pageId: "branch-details" },
      { label: "Team Structure", icon: Users, pageId: "team-structure" },
      { label: "Access Control", icon: Shield, pageId: "access-control" },
      { label: "Service Directory", icon: BookOpen, pageId: "service-directory" },
      { label: "House Directory", icon: MapPin, pageId: "house-directory" },
      { label: "Providers Directory", icon: Network, pageId: "providers-directory" },
      { label: "Compliance Directory", icon: ClipboardCheck, pageId: "compliance-directory" },
      { label: "Internal Audits", icon: Search, pageId: "internal-audits" },
      { label: "Incident Reports", icon: AlertTriangle, pageId: "incident-reports" },
      { label: "Support Plans", icon: FileText, pageId: "support-plans" },
      { label: "Form Builder", icon: FormInput, pageId: "form-builder" },
      { label: "Reports", icon: BarChart3, pageId: "reports" }
    ]
  },
  {
    label: "Participants",
    icon: User,
    children: [
      { label: "Participant Profiles", icon: User, pageId: "participant-profiles" },
      { label: "Shift Notes", icon: StickyNote, pageId: "shift-notes" },
      { label: "Funding", icon: DollarSign, pageId: "funding" }
    ]
  },
  {
    label: "Employees",
    icon: UserCheck,
    children: [
      { label: "Staff Profiles", icon: UserCheck, pageId: "staff-profiles" },
      { label: "Resources", icon: Folder, pageId: "employee-resources" },
      { label: "The Hub", icon: HelpCircle, pageId: "the-hub" }
    ]
  },
  {
    label: "Roster Board",
    icon: Calendar,
    pageId: "roster-board"
  },
  {
    label: "Houses",
    icon: MapPin,
    children: [
      { label: "Files", icon: Folder, pageId: "house-files" },
      { label: "Checklist", icon: FileCheck, pageId: "house-checklist" },
      { label: "Forms", icon: List, pageId: "house-forms" },
      { label: "Calendar", icon: Calendar, pageId: "house-calendar" },
      { label: "Resources", icon: Folder, pageId: "house-resources" }
    ]
  }
]

interface SidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  const handleNavClick = (item: NavItem) => {
    if (item.pageId) {
      onPageChange(item.pageId)
    }
  }

  const renderNavItem = (item: NavItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.label)
    const isActive = item.pageId === currentPage
    const Icon = item.icon

    if (hasChildren) {
      return (
        <Collapsible key={item.label} open={isExpanded} onOpenChange={() => toggleExpanded(item.label)}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 px-3 py-2 h-auto font-normal hover:bg-blue-50 text-gray-700"
              style={{ paddingLeft: `${12 + level * 16}px` }}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              <div className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                ▶
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1">
            {item.children?.map(child => renderNavItem(child, level + 1))}
          </CollapsibleContent>
        </Collapsible>
      )
    }

    return (
      <Button 
        key={item.label}
        variant="ghost" 
        className={`w-full justify-start gap-3 px-3 py-2 h-auto font-normal hover:bg-blue-50 ${
          isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
        }`}
        style={{ paddingLeft: `${12 + level * 16}px` }}
        onClick={() => handleNavClick(item)}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
      </Button>
    )
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-medium text-gray-900">Navigation</h2>
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navigationItems.map(item => renderNavItem(item))}
      </nav>
    </div>
  )
}