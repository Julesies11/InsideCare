import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Textarea } from "./ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  FileText, 
  User, 
  Clock, 
  MapPin, 
  Tag, 
  Calendar, 
  Upload, 
  StickyNote 
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Label } from "./ui/label"
import { Checkbox } from "./ui/checkbox"

// Mock data for shift notes
const shiftNotes = [
  {
    id: 1,
    date: "2024-01-20",
    time: "14:30",
    staffMember: "Jennifer Adams",
    house: "Sunshine House",
    participant: "Sarah Johnson",
    summary: "Morning routine completed successfully, medication administered",
    tags: ["Medication", "Daily Care"],
    fullNote: "Sarah completed her morning routine independently today. All medications were administered on schedule at 9:00 AM. She participated actively in the physiotherapy session and showed good progress with mobility exercises. No concerns to report."
  },
  {
    id: 2,
    date: "2024-01-20",
    time: "08:15",
    staffMember: "Mark Thompson",
    house: "Ocean View",
    participant: "Michael Chen",
    summary: "Minor incident during breakfast, follow-up required",
    tags: ["Incident", "Follow-up"],
    fullNote: "During breakfast, Michael became upset about the change in routine. Used de-escalation techniques and provided additional support. Incident resolved peacefully. Recommend reviewing morning schedule with participant."
  },
  {
    id: 3,
    date: "2024-01-19",
    time: "20:45",
    staffMember: "Sarah Wilson",
    house: "Garden Villa",
    participant: null,
    summary: "Evening handover - all participants settled",
    tags: ["Handover", "General"],
    fullNote: "All participants have completed their evening routines. House is secure, all doors and windows checked. Tomorrow's schedule reviewed with incoming staff. No issues to report."
  },
  {
    id: 4,
    date: "2024-01-19",
    time: "16:20",
    staffMember: "David Martinez",
    house: "Sunshine House",
    participant: "Emma Williams",
    summary: "Successful community outing, goal achievement",
    tags: ["Community", "Goals"],
    fullNote: "Emma participated in a community shopping trip today. She successfully used public transport and made independent purchases. This aligns with her goal of increasing community participation. Excellent progress!"
  }
]

const tags = ["Medication", "Incident", "Follow-up", "Daily Care", "Goals", "Community", "Handover", "General", "Medical", "Behavioral"]

export function ShiftNotes() {
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [staffFilter, setStaffFilter] = useState("all")
  const [houseFilter, setHouseFilter] = useState("all")
  const [participantFilter, setParticipantFilter] = useState("all")
  const [selectedNote, setSelectedNote] = useState<any>(null)
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Form state for creating new notes
  const [newNote, setNewNote] = useState({
    house: "",
    participant: "",
    note: "",
    tags: [] as string[],
    attachment: null as File | null
  })

  const filteredNotes = shiftNotes.filter(note => {
    const matchesSearch = note.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.staffMember.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (note.participant && note.participant.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesDate = !dateFilter || note.date === dateFilter
    const matchesStaff = staffFilter === "all" || note.staffMember === staffFilter
    const matchesHouse = houseFilter === "all" || note.house === houseFilter
    const matchesParticipant = participantFilter === "all" || note.participant === participantFilter
    
    return matchesSearch && matchesDate && matchesStaff && matchesHouse && matchesParticipant
  })

  const viewNote = (note: any) => {
    setSelectedNote(note)
    setShowNoteDialog(true)
  }

  const handleTagToggle = (tag: string) => {
    setNewNote(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }))
  }

  const submitNote = () => {
    // Here you would typically submit to your backend
    console.log("Submitting note:", newNote)
    setShowCreateDialog(false)
    setNewNote({
      house: "",
      participant: "",
      note: "",
      tags: [],
      attachment: null
    })
  }

  const ViewNoteDialog = () => {
    if (!selectedNote) return null

    return (
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Shift Note Details</DialogTitle>
            <DialogDescription>
              View complete shift note information and details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Date & Time:</strong> {selectedNote.date} at {selectedNote.time}
              </div>
              <div>
                <strong>Staff Member:</strong> {selectedNote.staffMember}
              </div>
              <div>
                <strong>House:</strong> {selectedNote.house}
              </div>
              <div>
                <strong>Participant:</strong> {selectedNote.participant || "General/All"}
              </div>
            </div>
            
            <div>
              <strong>Tags:</strong>
              <div className="flex gap-1 mt-1">
                {selectedNote.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
            
            <div>
              <strong>Full Note:</strong>
              <div className="mt-2 p-4 bg-muted rounded-lg">
                {selectedNote.fullNote}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const CreateNoteDialog = () => (
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Write Shift Note</DialogTitle>
          <DialogDescription>
            Create a new shift note with details about participants and activities.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="house">House</Label>
              <Select value={newNote.house} onValueChange={(value) => setNewNote(prev => ({ ...prev, house: value }))}>
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
            
            <div>
              <Label htmlFor="participant">Participant (Optional)</Label>
              <Select value={newNote.participant} onValueChange={(value) => setNewNote(prev => ({ ...prev, participant: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select participant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">General/All</SelectItem>
                  <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                  <SelectItem value="Michael Chen">Michael Chen</SelectItem>
                  <SelectItem value="Emma Williams">Emma Williams</SelectItem>
                  <SelectItem value="David Rodriguez">David Rodriguez</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="note">Note</Label>
            <Textarea 
              id="note"
              placeholder="Enter your shift note here..."
              value={newNote.note}
              onChange={(e) => setNewNote(prev => ({ ...prev, note: e.target.value }))}
              rows={6}
            />
          </div>
          
          <div>
            <Label>Tags</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {tags.map(tag => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={tag}
                    checked={newNote.tags.includes(tag)}
                    onCheckedChange={() => handleTagToggle(tag)}
                  />
                  <Label htmlFor={tag} className="text-sm">{tag}</Label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="attachment">File Attachment</Label>
            <Input 
              id="attachment"
              type="file"
              onChange={(e) => setNewNote(prev => ({ ...prev, attachment: e.target.files?.[0] || null }))}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitNote}>
              Submit Note
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
          <h1>Shift Notes</h1>
          <p className="text-muted-foreground">Record and view shift notes and observations</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Write Shift Note
        </Button>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <StickyNote className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-green-900">Every Note Matters</h3>
              <p className="text-green-700">
                Your detailed observations and notes help create a complete picture of each participant's journey, 
                ensuring continuity of care and celebrating progress every step of the way.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search notes..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            
            <Select value={staffFilter} onValueChange={setStaffFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                <SelectItem value="Jennifer Adams">Jennifer Adams</SelectItem>
                <SelectItem value="Mark Thompson">Mark Thompson</SelectItem>
                <SelectItem value="Sarah Wilson">Sarah Wilson</SelectItem>
                <SelectItem value="David Martinez">David Martinez</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={houseFilter} onValueChange={setHouseFilter}>
              <SelectTrigger>
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
              <SelectTrigger>
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
        </CardContent>
      </Card>

      {/* Notes Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Staff Member</TableHead>
                <TableHead>House</TableHead>
                <TableHead>Participant</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotes.map((note) => (
                <TableRow key={note.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm">{note.date}</p>
                        <p className="text-xs text-muted-foreground">{note.time}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {note.staffMember}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {note.house}
                    </div>
                  </TableCell>
                  <TableCell>
                    {note.participant || (
                      <span className="text-muted-foreground italic">General</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="truncate">{note.summary}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {note.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {note.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{note.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => viewNote(note)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Full Note
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ViewNoteDialog />
      <CreateNoteDialog />
    </div>
  )
}