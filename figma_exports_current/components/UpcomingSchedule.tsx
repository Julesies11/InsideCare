import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Calendar, Clock, MapPin } from "lucide-react"

const upcomingEvents = [
  {
    time: "9:00 AM",
    title: "Home visit - Sarah with John",
    type: "Support",
    location: "Client Home",
    color: "bg-blue-100 text-blue-700"
  },
  {
    time: "11:30 AM", 
    title: "Team meeting - Weekly review",
    type: "Meeting",
    location: "Office",
    color: "bg-purple-100 text-purple-700"
  },
  {
    time: "2:00 PM",
    title: "Medical appointment - David",
    type: "Appointment",
    location: "Clinic",
    color: "bg-green-100 text-green-700"
  },
  {
    time: "4:00 PM",
    title: "Community outing - Emma",
    type: "Activity", 
    location: "Shopping Centre",
    color: "bg-orange-100 text-orange-700"
  }
]

export function UpcomingSchedule() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Today's Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingEvents.map((event, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                {index < upcomingEvents.length - 1 && (
                  <div className="w-px h-8 bg-gray-200 mt-1"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-600">{event.time}</span>
                  <Badge variant="secondary" className={event.color}>
                    {event.type}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">{event.title}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  {event.location}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}