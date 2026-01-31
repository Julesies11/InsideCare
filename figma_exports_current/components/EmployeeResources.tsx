import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible"
import { Progress } from "./ui/progress"
import { 
  Search, 
  Star, 
  BookOpen, 
  User, 
  Shield, 
  FileText, 
  Edit3, 
  Pill, 
  Users, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  ExternalLink, 
  Heart, 
  Award, 
  CheckCircle, 
  Play,
  Lightbulb,
  Target,
  Eye
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

// Mock data for resources
const resourceCategories = [
  {
    id: "sil-policies",
    title: "SIL Care Policies & Other Resources",
    icon: "SC",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    bgColor: "from-orange-50 to-amber-50",
    description: "General policies, onboarding guides, and orientation materials",
    resources: [
      { title: "New Staff Orientation Guide", type: "PDF", size: "2.3MB", popular: true },
      { title: "SIL Care Code of Conduct", type: "PDF", size: "1.8MB", popular: true },
      { title: "Emergency Procedures Manual", type: "PDF", size: "3.1MB", popular: false },
      { title: "Participant Rights & Dignity Policy", type: "PDF", size: "1.2MB", popular: true },
      { title: "Privacy & Confidentiality Guidelines", type: "PDF", size: "900KB", popular: false }
    ]
  },
  {
    id: "other-resources",
    title: "Other Resources",
    icon: User,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    bgColor: "from-blue-50 to-cyan-50",
    description: "External links, community services, and printable guides",
    resources: [
      { title: "NDIS Provider Portal", type: "Link", url: "https://ndis.gov.au", popular: true },
      { title: "Local Community Services Directory", type: "PDF", size: "4.2MB", popular: false },
      { title: "Transport Options Guide", type: "PDF", size: "1.5MB", popular: true },
      { title: "Cultural Competency Resources", type: "Link", url: "#", popular: false },
      { title: "Mental Health First Aid Resources", type: "PDF", size: "2.8MB", popular: true }
    ]
  },
  {
    id: "policies-documents",
    title: "Policies & Supporting Documents",
    icon: Shield,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    bgColor: "from-indigo-50 to-blue-50",
    description: "HR policies, code of conduct, and reporting procedures",
    resources: [
      { title: "Staff Code of Conduct", type: "PDF", size: "2.1MB", popular: true },
      { title: "Grievance & Complaints Procedure", type: "PDF", size: "1.7MB", popular: false },
      { title: "Work Health & Safety Policy", type: "PDF", size: "3.4MB", popular: true },
      { title: "Professional Development Guidelines", type: "PDF", size: "1.9MB", popular: false },
      { title: "Performance Management Framework", type: "PDF", size: "2.6MB", popular: false }
    ]
  },
  {
    id: "compliance",
    title: "SIL Care Processes & Compliance",
    icon: Clock,
    color: "bg-pink-100 text-pink-800 border-pink-200",
    bgColor: "from-pink-50 to-rose-50",
    description: "Workflows, compliance checklists, and audit templates",
    resources: [
      { title: "Monthly Compliance Checklist", type: "PDF", size: "1.4MB", popular: true },
      { title: "Audit Preparation Guide", type: "PDF", size: "2.8MB", popular: false },
      { title: "Quality Indicators Framework", type: "PDF", size: "3.2MB", popular: true },
      { title: "Continuous Improvement Process", type: "PDF", size: "1.8MB", popular: false },
      { title: "Risk Management Templates", type: "PDF", size: "2.3MB", popular: true }
    ]
  },
  {
    id: "documenting",
    title: "Documenting",
    icon: Edit3,
    color: "bg-orange-100 text-orange-800 border-orange-200",
    bgColor: "from-orange-50 to-yellow-50",
    description: "Guides on writing shift notes, incident reports, and support plans",
    highlighted: true,
    resources: [
      { title: "Shift Notes Writing Guide", type: "Interactive", interactive: true, popular: true },
      { title: "Incident Report Templates", type: "PDF", size: "1.6MB", popular: true },
      { title: "Support Plan Documentation", type: "Interactive", interactive: true, popular: false },
      { title: "Progress Notes Best Practices", type: "Video", duration: "12 min", popular: true },
      { title: "Legal Documentation Requirements", type: "PDF", size: "2.1MB", popular: false }
    ],
    quiz: {
      title: "Documentation Quiz",
      questions: [
        {
          question: "What is the most important principle when writing shift notes?",
          options: ["Be objective and factual", "Write as much as possible", "Use medical terminology", "Include personal opinions"],
          correct: 0
        },
        {
          question: "How soon should incident reports be completed?",
          options: ["Within 1 week", "Within 24 hours", "Within 1 hour", "At the end of shift"],
          correct: 1
        }
      ]
    }
  },
  {
    id: "medication",
    title: "Medication & Compliance",
    icon: Pill,
    color: "bg-red-100 text-red-800 border-red-200",
    bgColor: "from-red-50 to-pink-50",
    description: "Medication administration guides, PRN protocols, and compliance tips",
    resources: [
      { title: "Medication Administration Guide", type: "PDF", size: "4.1MB", popular: true },
      { title: "PRN Medication Protocols", type: "PDF", size: "2.7MB", popular: true },
      { title: "Medication Storage Requirements", type: "PDF", size: "1.8MB", popular: false },
      { title: "Drug Interaction Checker", type: "Link", url: "#", popular: true },
      { title: "Medication Error Reporting", type: "PDF", size: "1.5MB", popular: false }
    ]
  },
  {
    id: "ndis-teams",
    title: "NDIS Teams",
    icon: Users,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    bgColor: "from-purple-50 to-violet-50",
    description: "Contact info, referral pathways, and collaboration tips",
    resources: [
      { title: "NDIS Team Contact Directory", type: "PDF", size: "1.9MB", popular: true },
      { title: "Referral Process Guidelines", type: "PDF", size: "2.4MB", popular: false },
      { title: "Plan Review Procedures", type: "PDF", size: "3.1MB", popular: true },
      { title: "Collaboration Best Practices", type: "PDF", size: "1.7MB", popular: false },
      { title: "NDIS Portal Quick Start Guide", type: "PDF", size: "2.2MB", popular: true }
    ]
  },
  {
    id: "sil-processes",
    title: "SIL Care Processes",
    icon: FileText,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    bgColor: "from-yellow-50 to-amber-50",
    description: "Daily routines, hygiene prompts, and house-specific procedures",
    resources: [
      { title: "Daily Routine Checklists", type: "PDF", size: "2.8MB", popular: true },
      { title: "Hygiene Support Guidelines", type: "PDF", size: "1.9MB", popular: true },
      { title: "Meal Preparation Procedures", type: "PDF", size: "3.3MB", popular: false },
      { title: "Household Management Guide", type: "PDF", size: "2.6MB", popular: true },
      { title: "Community Access Protocols", type: "PDF", size: "2.1MB", popular: false }
    ]
  }
]

const didYouKnowFacts = [
  "Person-first language is essential - say 'person with disability' not 'disabled person'",
  "Documentation should be completed within 24 hours of service delivery",
  "NDIS reviews happen annually unless circumstances change significantly",
  "Every participant has the right to choose their own support workers",
  "SIL focuses on building independence, not creating dependency"
]

export function EmployeeResources() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showPopular, setShowPopular] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [openSections, setOpenSections] = useState<string[]>(["documenting"])
  const [selectedResource, setSelectedResource] = useState<any>(null)
  const [showResourceDialog, setShowResourceDialog] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [quizScore, setQuizScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showQuizResult, setShowQuizResult] = useState(false)
  const [currentFact, setCurrentFact] = useState(0)

  const filteredCategories = resourceCategories.filter(category => {
    const matchesSearch = category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.resources.some(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = categoryFilter === "all" || category.id === categoryFilter
    const matchesPopular = !showPopular || category.resources.some(r => r.popular)
    
    return matchesSearch && matchesCategory && matchesPopular
  })

  const toggleFavorite = (categoryId: string, resourceTitle: string) => {
    const key = `${categoryId}-${resourceTitle}`
    setFavorites(prev => 
      prev.includes(key) 
        ? prev.filter(f => f !== key)
        : [...prev, key]
    )
  }

  const isFavorite = (categoryId: string, resourceTitle: string) => {
    return favorites.includes(`${categoryId}-${resourceTitle}`)
  }

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(s => s !== sectionId)
        : [...prev, sectionId]
    )
  }

  const startQuiz = (category: any) => {
    setSelectedResource(category)
    setCurrentQuestion(0)
    setQuizScore(0)
    setSelectedAnswer(null)
    setShowQuizResult(false)
    setShowQuiz(true)
  }

  const submitAnswer = () => {
    if (selectedAnswer === null) return
    
    const quiz = selectedResource.quiz
    if (selectedAnswer === quiz.questions[currentQuestion].correct) {
      setQuizScore(prev => prev + 1)
    }
    
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
      setSelectedAnswer(null)
    } else {
      setShowQuizResult(true)
    }
  }

  const renderIcon = (icon: any, size = "h-6 w-6") => {
    if (typeof icon === "string") {
      return (
        <div className={`${size} flex items-center justify-center rounded-md bg-white/80 backdrop-blur-sm text-sm font-bold`}>
          {icon}
        </div>
      )
    }
    const IconComponent = icon
    return <IconComponent className={size} />
  }

  const ResourceDialog = () => (
    <Dialog open={showResourceDialog} onOpenChange={setShowResourceDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Resource Details</DialogTitle>
          <DialogDescription>
            View and access resource information.
          </DialogDescription>
        </DialogHeader>
        
        {selectedResource && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${selectedResource.color}`}>
                {renderIcon(selectedResource.icon, "h-6 w-6")}
              </div>
              <div>
                <h3 className="text-lg">{selectedResource.title}</h3>
                <p className="text-muted-foreground">{selectedResource.description}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {selectedResource.resources.map((resource: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {resource.type === "PDF" && <FileText className="h-4 w-4 text-red-600" />}
                    {resource.type === "Link" && <ExternalLink className="h-4 w-4 text-blue-600" />}
                    {resource.type === "Video" && <Play className="h-4 w-4 text-green-600" />}
                    {resource.type === "Interactive" && <Target className="h-4 w-4 text-purple-600" />}
                    <div>
                      <p className="font-medium">{resource.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {resource.size && `${resource.type} • ${resource.size}`}
                        {resource.duration && `${resource.type} • ${resource.duration}`}
                        {resource.url && resource.type}
                        {resource.interactive && "Interactive Guide"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(selectedResource.id, resource.title)}
                    >
                      <Star className={`h-4 w-4 ${isFavorite(selectedResource.id, resource.title) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </Button>
                    <Button variant="outline" size="sm">
                      {resource.url ? <ExternalLink className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )

  const QuizDialog = () => (
    <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{selectedResource?.quiz?.title}</DialogTitle>
          <DialogDescription>
            Test your knowledge on documentation best practices.
          </DialogDescription>
        </DialogHeader>
        
        {selectedResource?.quiz && !showQuizResult && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Question {currentQuestion + 1} of {selectedResource.quiz.questions.length}
              </span>
              <Progress value={((currentQuestion + 1) / selectedResource.quiz.questions.length) * 100} className="w-24" />
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">{selectedResource.quiz.questions[currentQuestion].question}</h3>
              
              <div className="space-y-2">
                {selectedResource.quiz.questions[currentQuestion].options.map((option: string, index: number) => (
                  <Button
                    key={index}
                    variant={selectedAnswer === index ? "default" : "outline"}
                    className="w-full text-left justify-start"
                    onClick={() => setSelectedAnswer(index)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
              
              <Button 
                onClick={submitAnswer} 
                disabled={selectedAnswer === null}
                className="w-full"
              >
                {currentQuestion < selectedResource.quiz.questions.length - 1 ? "Next Question" : "Finish Quiz"}
              </Button>
            </div>
          </div>
        )}
        
        {showQuizResult && (
          <div className="space-y-4 text-center">
            <div className="h-16 w-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Quiz Complete!</h3>
              <p className="text-muted-foreground">
                You scored {quizScore} out of {selectedResource.quiz.questions.length}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowQuiz(false)}>
                Close
              </Button>
              <Button onClick={() => startQuiz(selectedResource)}>
                Retake Quiz
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1>Employee Resources</h1>
          <p className="text-muted-foreground">Access policies, guides, and training materials</p>
        </div>
        <Button variant="outline">
          <BookOpen className="h-4 w-4 mr-2" />
          Resource Library
        </Button>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <Award className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-emerald-900">Empowering Excellence</h3>
              <p className="text-emerald-700">
                Access the knowledge and tools you need to deliver exceptional care. 
                Your commitment to learning creates positive outcomes for every participant.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Did You Know Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <span className="text-blue-900 font-medium">Did you know? </span>
              <span className="text-blue-700">{didYouKnowFacts[currentFact]}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentFact((prev) => (prev + 1) % didYouKnowFacts.length)}
            >
              Next Tip
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search resources..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {resourceCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button
                variant={showPopular ? "default" : "outline"}
                size="sm"
                onClick={() => setShowPopular(!showPopular)}
              >
                <Star className="h-4 w-4 mr-2" />
                Popular
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Categories */}
      <div className="space-y-4">
        {filteredCategories.map((category) => (
          <Card key={category.id} className={category.highlighted ? "ring-2 ring-orange-200" : ""}>
            <Collapsible
              open={openSections.includes(category.id)}
              onOpenChange={() => toggleSection(category.id)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${category.color}`}>
                        {renderIcon(category.icon)}
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {category.title}
                          {category.highlighted && (
                            <Badge className="bg-orange-100 text-orange-800">Featured</Badge>
                          )}
                        </CardTitle>
                        <p className="text-muted-foreground">{category.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {category.resources.length} resources
                      </Badge>
                      {openSections.includes(category.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category.resources
                      .filter(resource => !showPopular || resource.popular)
                      .map((resource, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {resource.type === "PDF" && <FileText className="h-4 w-4 text-red-600" />}
                          {resource.type === "Link" && <ExternalLink className="h-4 w-4 text-blue-600" />}
                          {resource.type === "Video" && <Play className="h-4 w-4 text-green-600" />}
                          {resource.type === "Interactive" && <Target className="h-4 w-4 text-purple-600" />}
                          <div>
                            <p className="font-medium text-sm">{resource.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {resource.size && `${resource.type} • ${resource.size}`}
                              {resource.duration && `${resource.type} • ${resource.duration}`}
                              {resource.url && resource.type}
                              {resource.interactive && "Interactive Guide"}
                              {resource.popular && (
                                <Badge variant="secondary" className="ml-1 text-xs">Popular</Badge>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFavorite(category.id, resource.title)}
                          >
                            <Star className={`h-4 w-4 ${isFavorite(category.id, resource.title) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                          </Button>
                          <Button variant="ghost" size="sm">
                            {resource.url ? <ExternalLink className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Special Interactive Elements for Documenting Section */}
                  {category.id === "documenting" && (
                    <div className="mt-4 space-y-3">
                      <div className="flex gap-3">
                        <Button
                          onClick={() => startQuiz(category)}
                          className="bg-orange-100 text-orange-800 hover:bg-orange-200"
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Take Documentation Quiz
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedResource(category)
                            setShowResourceDialog(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View All Resources
                        </Button>
                      </div>
                      
                      <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="h-5 w-5 text-orange-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-orange-900">Documentation Tip</h4>
                            <p className="text-sm text-orange-700">
                              Always write in the participant's language level and focus on their strengths 
                              and achievements alongside any challenges or support needs.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {/* Favorites Section */}
      {favorites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Your Favorites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {favorites.slice(0, 6).map((favorite, index) => {
                const [categoryId, resourceTitle] = favorite.split('-', 2)
                const category = resourceCategories.find(c => c.id === categoryId)
                const resource = category?.resources.find(r => r.title === resourceTitle)
                
                return (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className={`h-8 w-8 rounded flex items-center justify-center ${category?.color}`}>
                      {category && renderIcon(category.icon, "h-4 w-4")}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{resourceTitle}</p>
                      <p className="text-xs text-muted-foreground">{category?.title}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <ResourceDialog />
      <QuizDialog />
    </div>
  )
}