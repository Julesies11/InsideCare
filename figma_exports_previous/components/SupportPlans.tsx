import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Badge } from "./ui/badge"
import { Plus, Search, Filter, Download, Edit, Eye, FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

export function SupportPlans() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const supportPlans = [
    {
      id: 1,
      participantName: "Sarah Mitchell",
      planType: "SIL",
      responsibleRole: "House Manager",
      reviewDueDate: "2024-12-15",
      status: "On Track",
      lastReview: "2024-06-15",
      goals: 4,
      completedGoals: 3,
      coordinator: "Emma Davis"
    },
    {
      id: 2,
      participantName: "Michael Chen",
      planType: "Community",
      responsibleRole: "Support Coordinator",
      reviewDueDate: "2024-11-30",
      status: "On Track",
      lastReview: "2024-05-30",
      goals: 6,
      completedGoals: 4,
      coordinator: "Sarah Johnson"
    },
    {
      id: 3,
      participantName: "Emily Rodriguez",
      planType: "SIL",
      responsibleRole: "House Manager",
      reviewDueDate: "2024-10-20",
      status: "Due Soon",
      lastReview: "2024-04-20",
      goals: 5,
      completedGoals: 2,
      coordinator: "Michael Chen"
    },
    {
      id: 4,
      participantName: "David Park",
      planType: "Community",
      responsibleRole: "Support Coordinator",
      reviewDueDate: "2024-09-25",
      status: "Due Soon",
      lastReview: "2024-03-25",
      goals: 3,
      completedGoals: 3,
      coordinator: "Lisa Anderson"
    },
    {
      id: 5,
      participantName: "Jennifer Williams",
      planType: "SIL",
      responsibleRole: "House Manager",
      reviewDueDate: "2024-09-10",
      status: "Overdue",
      lastReview: "2024-03-10",
      goals: 7,
      completedGoals: 1,
      coordinator: "Tom Wilson"
    },
    {
      id: 6,
      participantName: "Alex Thompson",
      planType: "Community",
      responsibleRole: "Support Coordinator",
      reviewDueDate: "2024-11-05",
      status: "On Track",
      lastReview: "2024-05-05",
      goals: 4,
      completedGoals: 4,
      coordinator: "Emma Davis"
    },
    {
      id: 7,
      participantName: "Lisa Kim",
      planType: "SIL",
      responsibleRole: "House Manager",
      reviewDueDate: "2024-12-01",
      status: "On Track",
      lastReview: "2024-06-01",
      goals: 5,
      completedGoals: 2,
      coordinator: "David Wilson"
    }
  ]

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "On Track": return "default"
      case "Due Soon": return "outline"
      case "Overdue": return "destructive"
      default: return "secondary"
    }
  }

  const getTypeBadgeVariant = (type: string) => {
    return type === "SIL" ? "destructive" : "outline"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "On Track": return <CheckCircle className="h-4 w-4 text-green-600" />
      case "Due Soon": return <Clock className="h-4 w-4 text-orange-600" />
      case "Overdue": return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getGoalProgress = (completed: number, total: number) => {
    const percentage = (completed / total) * 100
    return { percentage, color: percentage >= 75 ? 'text-green-600' : percentage >= 50 ? 'text-orange-600' : 'text-red-600' }
  }

  const filteredPlans = supportPlans.filter(plan => {
    const matchesSearch = plan.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.coordinator.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || plan.planType === filterType
    const matchesStatus = filterStatus === "all" || plan.status === filterStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  const onTrackCount = supportPlans.filter(p => p.status === "On Track").length
  const dueSoonCount = supportPlans.filter(p => p.status === "Due Soon").length
  const overdueCount = supportPlans.filter(p => p.status === "Overdue").length
  const totalGoals = supportPlans.reduce((sum, p) => sum + p.goals, 0)
  const completedGoals = supportPlans.reduce((sum, p) => sum + p.completedGoals, 0)

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">Support Plans</h1>
          <p className="text-gray-600">Manage participant support plans and track goal achievement</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Log New Plan
          </Button>
        </div>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-blue-900 mb-1">Empowering Individual Goals</h3>
              <p className="text-blue-700 text-sm">Every support plan is a roadmap to independence, designed around each participant's unique goals and aspirations.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search participants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="SIL">SIL</SelectItem>
              <SelectItem value="Community">Community</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="On Track">On Track</SelectItem>
              <SelectItem value="Due Soon">Due Soon</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-green-600">{onTrackCount}</div>
              <div className="text-sm text-gray-600">On Track</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-orange-600">{dueSoonCount}</div>
              <div className="text-sm text-gray-600">Due Soon</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-red-600">{overdueCount}</div>
              <div className="text-sm text-gray-600">Overdue</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-blue-600">{totalGoals}</div>
              <div className="text-sm text-gray-600">Total Goals</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-purple-600">
                {Math.round((completedGoals / totalGoals) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Goals Achieved</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Support Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Support Plans ({filteredPlans.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant Name</TableHead>
                <TableHead>Plan Type</TableHead>
                <TableHead>Responsible Role</TableHead>
                <TableHead>Goal Progress</TableHead>
                <TableHead>Review Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.map((plan) => {
                const progress = getGoalProgress(plan.completedGoals, plan.goals)
                return (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{plan.participantName}</div>
                        <div className="text-sm text-gray-500">Coordinator: {plan.coordinator}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeBadgeVariant(plan.planType)}>
                        {plan.planType}
                      </Badge>
                    </TableCell>
                    <TableCell>{plan.responsibleRole}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${progress.color}`}>
                          {plan.completedGoals}/{plan.goals}
                        </span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${progress.percentage}%`,
                              backgroundColor: progress.percentage >= 75 ? '#16a34a' : 
                                              progress.percentage >= 50 ? '#ea580c' : '#dc2626'
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {Math.round(progress.percentage)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{plan.reviewDueDate}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(plan.status)}
                        <Badge variant={getStatusBadgeVariant(plan.status)}>
                          {plan.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}