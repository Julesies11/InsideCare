import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Users, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  User
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

// Mock data for shifts
const shifts = [
  {
    id: 1,
    date: "2024-01-22",
    time: "08:00 - 16:00",
    staff: { name: "Jennifer Adams", initials: "JA", photo: "/api/placeholder/150/150" },
    house: "Sunshine House",
    participants: ["Sarah Johnson", "David Rodriguez"],
    type: "SIL",
    status: "Scheduled"
  },
  {
    id: 2,
    date: "2024-01-22",
    time: "16:00 - 22:00",
    staff: { name: "Mark Thompson", initials: "MT", photo: "/api/placeholder/150/150" },
    house: "Sunshine House", 
    participants: ["Sarah Johnson", "David Rodriguez"],
    type: "SIL",
    status: "Scheduled"
  },
  {
    id: 3,
    date: "2024-01-22",
    time: "10:00 - 14:00",
    staff: { name: "Sarah Wilson", initials: "SW", photo: "/api/placeholder/150/150" },
    house: "Ocean View",
    participants: ["Michael Chen"],
    type: "Community",
    status: "Scheduled"
  },
  {
    id: 4,
    date: "2024-01-23",
    time: "08:00 - 16:00",
    staff: null,
    house: "Garden Villa",
    participants: ["Emma Williams"],
    type: "SIL",
    status: "Unassigned"
  },
  {
    id: 5,
    date: "2024-01-23",
    time: "09:00 - 17:00",
    staff: { name: "Lisa Chen", initials: "LC", photo: "/api/placeholder/150/150" },
    house: "Administration",
    participants: [],
    type: "Admin",
    status: "Scheduled"
  }
]

// Generate calendar days for the current week
const generateWeekDays = (startDate: Date) => {
  const days = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    days.push(date)
  }
  return days
}

export function RosterBoard() {
  const [currentWeek, setCurrentWeek] = useState(new Date(2024, 0, 22)) // January 22, 2024
  const [viewMode, setViewMode] = useState("week")
  const [houseFilter, setHouseFilter] = useState("all")
  const [staffFilter, setStaffFilter] = useState("all")
  const [participantFilter, setParticipantFilter] = useState("all")
  const [showAddShiftDialog, setShowAddShiftDialog] = useState(false)
  const [showAssignStaffDialog, setShowAssignStaffDialog] = useState(false)
  const [selectedShift, setSelectedShift] = useState<any>(null)

  const weekDays = generateWeekDays(currentWeek)
  
  const filteredShifts = shifts.filter(shift => {
    const matchesHouse = houseFilter === "all" || shift.house === houseFilter
    const matchesStaff = staffFilter === "all" || (shift.staff && shift.staff.name === staffFilter)
    const matchesParticipant = participantFilter === "all" || 
      shift.participants.some(p => p === participantFilter)
    
    return matchesHouse && matchesStaff && matchesParticipant
  })

  const getShiftsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return filteredShifts.filter(shift => shift.date === dateStr)
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek)
    newDate.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newDate)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "SIL": return "bg-blue-100 text-blue-800"
      case "Community": return "bg-green-100 text-green-800"
      case "Admin": return "bg-purple-100 text-purple-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled": return "default"
      case "Unassigned": return "destructive"
      case "In Progress": return "secondary"
      default: return "outline"
    }
  }

  const assignStaff = (shift: any) => {
    setSelectedShift(shift)
    setShowAssignStaffDialog(true)
  }

  const AddShiftDialog = () => (
    <Dialog open={showAddShiftDialog} onOpenChange={setShowAddShiftDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Shift</DialogTitle>
          <DialogDescription>
            Create a new shift schedule and assign staff members.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Date</label>
              <input type="date" className="w-full p-2 border rounded-md" />
            </div>
            <div>
              <label className="text-sm font-medium">Time</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="08:00-16:00">08:00 - 16:00</SelectItem>
                  <SelectItem value="16:00-22:00">16:00 - 22:00</SelectItem>
                  <SelectItem value="22:00-08:00">22:00 - 08:00 (Night)</SelectItem>
                  <SelectItem value="10:00-14:00">10:00 - 14:00</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">House</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select house" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sunshine House">Sunshine House</SelectItem>
                  <SelectItem value="Ocean View">Ocean View</SelectItem>
                  <SelectItem value="Garden Villa">Garden Villa</SelectItem>
                  <SelectItem value="Administration">Administration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Shift Type</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIL">SIL</SelectItem>
                  <SelectItem value="Community">Community</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Linked Participants</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select participants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                <SelectItem value="Michael Chen">Michael Chen</SelectItem>
                <SelectItem value="Emma Williams">Emma Williams</SelectItem>
                <SelectItem value="David Rodriguez">David Rodriguez</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddShiftDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowAddShiftDialog(false)}>
              Create Shift
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  const AssignStaffDialog = () => (
    <Dialog open={showAssignStaffDialog} onOpenChange={setShowAssignStaffDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Staff to Shift</DialogTitle>
          <DialogDescription>
            Select a staff member to assign to this shift.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Available Staff</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Jennifer Adams">Jennifer Adams - House Manager</SelectItem>
                <SelectItem value="Mark Thompson">Mark Thompson - Support Worker</SelectItem>
                <SelectItem value="Sarah Wilson">Sarah Wilson - Team Leader</SelectItem>
                <SelectItem value="Lisa Chen">Lisa Chen - Admin Assistant</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAssignStaffDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowAssignStaffDialog(false)}>
              Assign Staff
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1>Roster Board</h1>
          <p className="text-muted-foreground">Manage shift schedules and staff assignments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddShiftDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Shift
          </Button>
        </div>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <CalendarIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-indigo-900">Orchestrating Quality Care</h3>
              <p className="text-indigo-700">
                Strategic roster management ensures consistent, reliable support for every participant. 
                Your planning creates stability and continuity in their daily lives.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Navigation */}
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <h3>Week of {weekDays[0].toLocaleDateString()}</h3>
                <p className="text-sm text-muted-foreground">
                  {weekDays[0].toLocaleDateString()} - {weekDays[6].toLocaleDateString()}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={houseFilter} onValueChange={setHouseFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Houses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Houses</SelectItem>
                  <SelectItem value="Sunshine House">Sunshine House</SelectItem>
                  <SelectItem value="Ocean View">Ocean View</SelectItem>
                  <SelectItem value="Garden Villa">Garden Villa</SelectItem>
                  <SelectItem value="Administration">Administration</SelectItem>
                </SelectContent>
              </Select>

              <Select value={staffFilter} onValueChange={setStaffFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  <SelectItem value="Jennifer Adams">Jennifer Adams</SelectItem>
                  <SelectItem value="Mark Thompson">Mark Thompson</SelectItem>
                  <SelectItem value="Sarah Wilson">Sarah Wilson</SelectItem>
                  <SelectItem value="Lisa Chen">Lisa Chen</SelectItem>
                </SelectContent>
              </Select>

              <Select value={participantFilter} onValueChange={setParticipantFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Participants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Participants</SelectItem>
                  <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                  <SelectItem value="Michael Chen">Michael Chen</SelectItem>
                  <SelectItem value="Emma Williams">Emma Williams</SelectItem>
                  <SelectItem value="David Rodriguez">David Rodriguez</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const dayShifts = getShiftsForDate(day)
          return (
            <div key={index} className="space-y-2">
              <div className="text-center p-2 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
                <p className="text-lg">
                  {day.getDate()}
                </p>
              </div>
              
              <div className="space-y-2">
                {dayShifts.map((shift) => (
                  <Card key={shift.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{shift.time}</span>
                        </div>
                        <Badge className={getTypeColor(shift.type)} variant="secondary">
                          {shift.type}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{shift.house}</span>
                      </div>
                      
                      {shift.staff ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={shift.staff.photo} alt={shift.staff.name} />
                            <AvatarFallback className="text-xs">{shift.staff.initials}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{shift.staff.name}</span>
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => assignStaff(shift)}
                        >
                          <Users className="h-3 w-3 mr-1" />
                          Assign Staff
                        </Button>
                      )}
                      
                      {shift.participants.length > 0 && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">
                            {shift.participants.length} participant{shift.participants.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                      
                      <Badge variant={getStatusColor(shift.status)} className="text-xs">
                        {shift.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
                
                {dayShifts.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-xs">
                    No shifts scheduled
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <AddShiftDialog />
      <AssignStaffDialog />
    </div>
  )
}