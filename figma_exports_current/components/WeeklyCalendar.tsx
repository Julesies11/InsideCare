import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Clock, MapPin } from "lucide-react"

const scheduleData = [
  {
    day: "Monday",
    date: "Dec 9",
    shifts: [
      { time: "9:00 AM", type: "Shift", staff: "Sarah M.", client: "John D.", location: "Home Visit" },
      { time: "2:00 PM", type: "Appointment", staff: "Mike R.", client: "Emma L.", location: "Clinic" },
      { time: "4:30 PM", type: "Shift", staff: "Lisa K.", client: "David W.", location: "Community" }
    ]
  },
  {
    day: "Tuesday", 
    date: "Dec 10",
    shifts: [
      { time: "8:30 AM", type: "Shift", staff: "Tom B.", client: "Mary S.", location: "Home Visit" },
      { time: "11:00 AM", type: "Assessment", staff: "Sarah M.", client: "Robert K.", location: "Office" },
      { time: "3:00 PM", type: "Shift", staff: "Anna P.", client: "Claire T.", location: "Shopping" }
    ]
  },
  {
    day: "Wednesday",
    date: "Dec 11", 
    shifts: [
      { time: "10:00 AM", type: "Shift", staff: "Mike R.", client: "James H.", location: "Medical" },
      { time: "1:00 PM", type: "Meeting", staff: "Lisa K.", client: "Team Review", location: "Office" },
      { time: "3:30 PM", type: "Shift", staff: "Tom B.", client: "Susan M.", location: "Community" }
    ]
  }
]

export function WeeklyCalendar() {
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "Shift": return "bg-blue-100 text-blue-700 hover:bg-blue-100"
      case "Appointment": return "bg-green-100 text-green-700 hover:bg-green-100"
      case "Assessment": return "bg-purple-100 text-purple-700 hover:bg-purple-100"
      case "Meeting": return "bg-orange-100 text-orange-700 hover:bg-orange-100"
      default: return "bg-gray-100 text-gray-700 hover:bg-gray-100"
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Upcoming Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-6">
          {scheduleData.map((day) => (
            <div key={day.day} className="space-y-3">
              <div className="pb-2 border-b border-gray-100">
                <h3 className="font-medium text-gray-900">{day.day}</h3>
                <p className="text-sm text-gray-500">{day.date}</p>
              </div>
              <div className="space-y-3">
                {day.shifts.map((shift, index) => (
                  <div key={index} className="bg-gray-50/50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">{shift.time}</span>
                      <Badge variant="secondary" className={getTypeBadgeColor(shift.type)}>
                        {shift.type}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">{shift.staff}</p>
                      <p className="text-sm text-gray-600">{shift.client}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        {shift.location}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}