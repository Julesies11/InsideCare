import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  User, 
  Users, 
  Stethoscope, 
  Car, 
  Coffee, 
  Heart
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

// Mock data for calendar events
const calendarEvents = [
  {
    id: 1,
    title: "Morning Physiotherapy",
    type: "Medical",
    house: "Sunshine House",
    participant: "Sarah Johnson",
    date: "2024-01-22",
    time: "09:00 - 10:00",
    staff: "Jennifer Adams",
    status: "Scheduled",
    description: "Weekly physiotherapy appointment with external provider"
  },
  {
    id: 2,
    title: "Community Shopping Trip",
    type: "Activity",
    house: "Ocean View",
    participant: "Michael Chen",
    date: "2024-01-22",
    time: "14:00 - 16:00",
    staff: "Mark Thompson",
    status: "Scheduled",
    description: "Weekly grocery shopping and community engagement"
  },
  {
    id: 3,
    title: "House Meeting",
    type: "Administrative",
    house: "Sunshine House",
    participant: null,
    date: "2024-01-23",
    time: "10:00 - 11:00",
    staff: "Jennifer Adams",
    status: "Scheduled",
    description: "Monthly house meeting with all residents"
  },
  {
    id: 4,
    title: "Medical Appointment - GP",
    type: "Medical",
    house: "Garden Villa",
    participant: "Emma Williams",
    date: "2024-01-24",
    time: "11:30 - 12:30",
    staff: "David Martinez",
    status: "Confirmed",
    description: "Regular check-up with general practitioner"
  },
  {
    id: 5,
    title: "Family Visit",
    type: "Social",
    house: "Sunshine House",
    participant: "David Rodriguez",
    date: "2024-01-24",
    time: "15:00 - 17:00",
    staff: null,
    status: "Confirmed",
    description: "Visit from family members"
  },
  {
    id: 6,
    title: "Cooking Workshop",
    type: "Activity",
    house: "Ocean View",
    participant: "Michael Chen",
    date: "2024-01-25",
    time: "16:00 - 18:00",
    staff: "Sarah Wilson",
    status: "Scheduled",
    description: "Weekly cooking skills development session"
  }
]

const eventTypes = [
  { name: "Medical", icon: Stethoscope, color: "bg-red-100 text-red-800" },
  { name: "Activity", icon: Coffee, color: "bg-blue-100 text-blue-800" },
  { name: "Social", icon: Heart, color: "bg-pink-100 text-pink-800" },
  { name: "Administrative", icon: Users, color: "bg-purple-100 text-purple-800" },
  { name: "Transport", icon: Car, color: "bg-green-100 text-green-800" }
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

export function HouseCalendar() {
  const [currentWeek, setCurrentWeek] = useState(new Date(2024, 0, 22)) // January 22, 2024
  const [houseFilter, setHouseFilter] = useState("all")
  const [participantFilter, setParticipantFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)

  const weekDays = generateWeekDays(currentWeek)
  
  const filteredEvents = calendarEvents.filter(event => {
    const matchesHouse = houseFilter === "all" || event.house === houseFilter
    const matchesParticipant = participantFilter === "all" || event.participant === participantFilter
    const matchesType = typeFilter === "all" || event.type === typeFilter
    
    return matchesHouse && matchesParticipant && matchesType
  })

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return filteredEvents.filter(event => event.date === dateStr)
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek)
    newDate.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newDate)
  }

  const viewEvent = (event: any) => {
    setSelectedEvent(event)
    setShowEventDialog(true)
  }

  const getEventTypeConfig = (type: string) => {
    return eventTypes.find(t => t.name === type) || eventTypes[0]
  }

  const EventDialog = () => (
    <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Event Details</DialogTitle>
          <DialogDescription>
            View and manage event information.
          </DialogDescription>
        </DialogHeader>
        
        {selectedEvent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {(() => {
                const config = getEventTypeConfig(selectedEvent.type)
                const Icon = config.icon
                return <Icon className="h-8 w-8 text-muted-foreground" />
              })()}
              <div>
                <h3 className="text-lg">{selectedEvent.title}</h3>
                <Badge className={getEventTypeConfig(selectedEvent.type).color}>
                  {selectedEvent.type}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Date & Time</p>
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{selectedEvent.date}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{selectedEvent.time}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">House</p>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{selectedEvent.house}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Participant</p>
                <span className="text-sm text-muted-foreground">
                  {selectedEvent.participant || "All participants"}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">Assigned Staff</p>
                <span className="text-sm text-muted-foreground">
                  {selectedEvent.staff || "Not assigned"}
                </span>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium">Status</p>
              <Badge variant={selectedEvent.status === "Confirmed" ? "default" : "secondary"}>
                {selectedEvent.status}
              </Badge>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Edit Event
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowAssignDialog(true)}>
                <Users className="h-4 w-4 mr-2" />
                Assign Staff
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )

  const CreateEventDialog = () => (
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
          <DialogDescription>
            Create a new appointment, activity, or event.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Event Title</label>
            <Input placeholder="Enter event title" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Event Type</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Medical">Medical</SelectItem>
                  <SelectItem value="Activity">Activity</SelectItem>
                  <SelectItem value="Social">Social</SelectItem>
                  <SelectItem value="Administrative">Administrative</SelectItem>
                  <SelectItem value="Transport">Transport</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input type="date" />
            </div>
            <div>
              <label className="text-sm font-medium">Time</label>
              <Input type="time" />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Participant (Optional)</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select participant or leave blank for all" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All participants</SelectItem>
                <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                <SelectItem value="Michael Chen">Michael Chen</SelectItem>
                <SelectItem value="Emma Williams">Emma Williams</SelectItem>
                <SelectItem value="David Rodriguez">David Rodriguez</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea 
              placeholder="Enter event description..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowCreateDialog(false)}>
              Create Event
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  const AssignStaffDialog = () => (
    <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Staff to Event</DialogTitle>
          <DialogDescription>
            Select a staff member to assign to this event.
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
                <SelectItem value="David Martinez">David Martinez - Support Worker</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowAssignDialog(false)}>
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
          <h1>House Calendar</h1>
          <p className="text-muted-foreground">Manage appointments, events, and activities for each house</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center">
              <CalendarIcon className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <h3 className="text-teal-900">Coordinated Care Planning</h3>
              <p className="text-teal-700">
                Well-organized scheduling ensures participants never miss important appointments and activities. 
                Your planning creates structure and opportunities for growth and connection.
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

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Medical">Medical</SelectItem>
                  <SelectItem value="Activity">Activity</SelectItem>
                  <SelectItem value="Social">Social</SelectItem>
                  <SelectItem value="Administrative">Administrative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const dayEvents = getEventsForDate(day)
          const isToday = day.toDateString() === new Date().toDateString()
          
          return (
            <div key={index} className="space-y-2">
              <div className={`text-center p-2 rounded-lg ${isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <p className="text-sm font-medium">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
                <p className="text-lg">
                  {day.getDate()}
                </p>
              </div>
              
              <div className="space-y-2">
                {dayEvents.map((event) => {
                  const config = getEventTypeConfig(event.type)
                  const Icon = config.icon
                  
                  return (
                    <Card 
                      key={event.id} 
                      className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => viewEvent(event)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium truncate">{event.title}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{event.time}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground truncate">{event.house}</span>
                        </div>
                        
                        {event.participant && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground truncate">{event.participant}</span>
                          </div>
                        )}
                        
                        <Badge className={`${config.color} text-xs`} variant="secondary">
                          {event.type}
                        </Badge>
                      </div>
                    </Card>
                  )
                })}
                
                {dayEvents.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-xs">
                    No events scheduled
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <EventDialog />
      <CreateEventDialog />
      <AssignStaffDialog />
    </div>
  )
}