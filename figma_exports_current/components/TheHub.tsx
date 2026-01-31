import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible"
import { Progress } from "./ui/progress"
import { Textarea } from "./ui/textarea"
import { 
  Heart, 
  MessageCircle, 
  Star, 
  Coffee, 
  BookOpen, 
  Trophy, 
  Lightbulb, 
  Users, 
  Target, 
  Smile, 
  Frown, 
  Meh, 
  ThumbsUp, 
  ThumbsDown, 
  Sprout, 
  Sun, 
  ArrowUp, 
  ArrowDown, 
  Send, 
  Filter, 
  Search, 
  Gift, 
  Crown, 
  Zap, 
  Play, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp,
  Award,
  Calendar,
  BarChart3,
  Edit3,
  Plus,
  Eye,
  Clock,
  Flame,
  Brain,
  Sparkles,
  Music,
  Pizza,
  Car,
  Home,
  Stethoscope,
  Gamepad2
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

// Mock data
const moodOptions = [
  { emoji: "😊", label: "Great", value: "great", color: "bg-green-100 text-green-800" },
  { emoji: "😌", label: "Good", value: "good", color: "bg-blue-100 text-blue-800" },
  { emoji: "😐", label: "Okay", value: "okay", color: "bg-yellow-100 text-yellow-800" },
  { emoji: "😔", label: "Tough", value: "tough", color: "bg-orange-100 text-orange-800" },
  { emoji: "😓", label: "Difficult", value: "difficult", color: "bg-red-100 text-red-800" }
]

const motivationalQuotes = [
  "Your compassion makes a difference in someone's life every single day. 🌟",
  "Small acts of kindness create ripples of positive change. 💫",
  "You are not just doing a job, you are making lives better. ❤️",
  "Every participant's smile is a testament to your dedication. 😊",
  "Your patience and understanding create safe spaces for growth. 🌱"
]

const coffeeStarters = [
  "What's the best part of your shift so far? ☕",
  "Share a participant achievement that made you smile today! 🌟",
  "What's your go-to comfort food after a long shift? 🍕",
  "If you could have a superpower for one day, what would it be? ⚡",
  "What song always lifts your mood? 🎵"
]

const learningModules = [
  {
    id: 1,
    title: "Person-Centered Communication",
    duration: "3 min read",
    type: "Article",
    badge: "Communication",
    completed: false,
    popular: true
  },
  {
    id: 2,
    title: "De-escalation Techniques",
    duration: "5 min video",
    type: "Video",
    badge: "Behavior Support",
    completed: true,
    popular: true
  },
  {
    id: 3,
    title: "Cultural Competency Basics",
    duration: "4 min read",
    type: "Article",
    badge: "Inclusion",
    completed: false,
    popular: false
  }
]

const commsFeed = [
  {
    id: 1,
    house: "Sunshine House",
    author: "Jennifer Adams",
    message: "Amazing progress with Sarah's cooking skills today! She made scrambled eggs independently 🍳",
    time: "2 hours ago",
    reactions: { heart: 5, thumbsUp: 3 },
    tags: ["achievement", "independence"]
  },
  {
    id: 2,
    house: "Ocean View",
    author: "Mark Thompson",
    message: "Michael had a fantastic community outing - his confidence is really growing! 🌟",
    time: "4 hours ago",
    reactions: { heart: 8, thumbsUp: 2 },
    tags: ["community", "growth"]
  },
  {
    id: 3,
    house: "Garden Villa",
    author: "Sarah Wilson",
    message: "Looking for activity ideas for rainy days - what works well at your house? ☔",
    time: "6 hours ago",
    reactions: { thumbsUp: 4 },
    tags: ["ideas", "activities"]
  }
]

const ideaGarden = [
  {
    id: 1,
    title: "Weekly Cooking Challenge",
    author: "Lisa Chen",
    description: "Each week, participants choose a new recipe to try together",
    votes: { sprout: 12, bloom: 8, compost: 1 },
    status: "Growing",
    category: "Activities"
  },
  {
    id: 2,
    title: "Digital Memory Wall",
    author: "David Martinez",
    description: "Interactive display showcasing participant achievements and photos",
    votes: { sprout: 15, bloom: 12, compost: 0 },
    status: "Implemented",
    category: "Recognition"
  },
  {
    id: 3,
    title: "Pet Therapy Sessions",
    author: "Jennifer Adams",
    description: "Monthly visits from therapy animals",
    votes: { sprout: 8, bloom: 5, compost: 3 },
    status: "Under Review",
    category: "Wellbeing"
  }
]

const monthlyTheme = {
  name: "Wellbeing September",
  description: "Focus on mental health, self-care, and participant wellbeing",
  progress: 65,
  challenges: [
    { title: "Mindfulness Moment", completed: true, points: 10 },
    { title: "Wellbeing Check-in", completed: true, points: 15 },
    { title: "Self-care Activity", completed: false, points: 20 },
    { title: "Team Wellness Walk", completed: false, points: 25 }
  ]
}

const quizzes = [
  {
    id: 1,
    title: "Which SIL Care Value Are You?",
    description: "Discover your core strength!",
    type: "personality",
    completions: 234,
    icon: Heart
  },
  {
    id: 2,
    title: "Spot the Documentation Error",
    description: "Test your attention to detail",
    type: "skill",
    completions: 156,
    icon: Eye
  },
  {
    id: 3,
    title: "Medication Safety Quick Check",
    description: "Essential safety knowledge",
    type: "compliance",
    completions: 189,
    icon: Stethoscope
  }
]

export function TheHub() {
  const [currentMood, setCurrentMood] = useState<string>("")
  const [currentQuote, setCurrentQuote] = useState(0)
  const [currentStarter, setCurrentStarter] = useState(0)
  const [shoutoutText, setShoutoutText] = useState("")
  const [messageText, setMessageText] = useState("")
  const [journalText, setJournalText] = useState("")
  const [showJournal, setShowJournal] = useState(false)
  const [openSections, setOpenSections] = useState<string[]>(["lounge", "learning"])
  const [userStreak, setUserStreak] = useState(7)
  const [userBadges] = useState(["Communication Pro", "Team Player", "Learning Enthusiast"])
  const [commsFilter, setCommsFilter] = useState("all")
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null)
  const [showQuizDialog, setShowQuizDialog] = useState(false)

  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % motivationalQuotes.length)
    }, 8000)
    
    const starterInterval = setInterval(() => {
      setCurrentStarter((prev) => (prev + 1) % coffeeStarters.length)
    }, 12000)

    return () => {
      clearInterval(quoteInterval)
      clearInterval(starterInterval)
    }
  }, [])

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(s => s !== sectionId)
        : [...prev, sectionId]
    )
  }

  const submitMoodCheck = () => {
    if (currentMood) {
      // Mock submission
      console.log("Mood submitted:", currentMood)
    }
  }

  const submitShoutout = () => {
    if (shoutoutText.trim()) {
      setShoutoutText("")
      // Mock submission
    }
  }

  const submitMessage = () => {
    if (messageText.trim()) {
      setMessageText("")
      // Mock submission
    }
  }

  const saveJournal = () => {
    // Mock save
    setShowJournal(false)
    setJournalText("")
  }

  const startQuiz = (quiz: any) => {
    setSelectedQuiz(quiz)
    setShowQuizDialog(true)
  }

  const filteredComms = commsFeed.filter(item => {
    if (commsFilter === "all") return true
    return item.tags.includes(commsFilter)
  })

  const QuizDialog = () => (
    <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{selectedQuiz?.title}</DialogTitle>
          <DialogDescription>
            {selectedQuiz?.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 text-center">
          <div className="h-16 w-16 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
            {selectedQuiz && <selectedQuiz.icon className="h-8 w-8 text-purple-600" />}
          </div>
          <p className="text-muted-foreground">
            {selectedQuiz?.completions} people have taken this quiz
          </p>
          <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
            <Play className="h-4 w-4 mr-2" />
            Start Quiz
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <h1 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            The Hub
          </h1>
        </div>
        <p className="text-muted-foreground">Your digital lounge for connection, learning, and fun! 🎉</p>
      </div>

      {/* Rotating Motivational Quote */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center animate-pulse">
              <Sun className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-yellow-900 font-medium animate-fade-in">
                {motivationalQuotes[currentQuote]}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <Flame className="h-8 w-8 mx-auto text-orange-500 mb-2" />
            <h3 className="text-blue-900">Learning Streak</h3>
            <p className="text-2xl font-bold text-blue-800">{userStreak} days</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <h3 className="text-purple-900">Badges Earned</h3>
            <p className="text-2xl font-bold text-purple-800">{userBadges.length}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4 text-center">
            <Heart className="h-8 w-8 mx-auto text-red-500 mb-2" />
            <h3 className="text-green-900">Impact Score</h3>
            <p className="text-2xl font-bold text-green-800">98%</p>
          </CardContent>
        </Card>
      </div>

      {/* The Lounge */}
      <Card>
        <Collapsible
          open={openSections.includes("lounge")}
          onOpenChange={() => toggleSection("lounge")}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-pink-100 to-rose-100 rounded-lg flex items-center justify-center">
                    <Coffee className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <CardTitle className="text-pink-900">The Lounge</CardTitle>
                    <p className="text-muted-foreground">Connect with your team and share the love</p>
                  </div>
                </div>
                {openSections.includes("lounge") ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Mood Check-in */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-2">
                  <Smile className="h-4 w-4" />
                  How's your shift going?
                </h4>
                <div className="flex gap-2 flex-wrap">
                  {moodOptions.map((mood) => (
                    <Button
                      key={mood.value}
                      variant={currentMood === mood.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentMood(mood.value)}
                      className={currentMood === mood.value ? mood.color : ""}
                    >
                      <span className="mr-2">{mood.emoji}</span>
                      {mood.label}
                    </Button>
                  ))}
                </div>
                {currentMood && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={submitMoodCheck}>
                      Submit Check-in
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowJournal(true)}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Add Journal Note
                    </Button>
                  </div>
                )}
              </div>

              {/* Shout-out Wall */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Shout-out Wall
                </h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Give someone a shout-out! 🌟"
                    value={shoutoutText}
                    onChange={(e) => setShoutoutText(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={submitShoutout} disabled={!shoutoutText.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm">🎉 <strong>Sarah:</strong> Jennifer's patience with medication training was amazing today!</p>
                    <div className="flex gap-2 mt-2">
                      <Button variant="ghost" size="sm">❤️ 5</Button>
                      <Button variant="ghost" size="sm">👏 3</Button>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm">⭐ <strong>Mark:</strong> Team effort on the community BBQ was fantastic!</p>
                    <div className="flex gap-2 mt-2">
                      <Button variant="ghost" size="sm">❤️ 8</Button>
                      <Button variant="ghost" size="sm">🔥 2</Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Virtual Coffee Corner */}
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                <h4 className="flex items-center gap-2 mb-3">
                  <Coffee className="h-4 w-4 text-amber-600" />
                  Coffee Corner Chat
                </h4>
                <div className="space-y-3">
                  <p className="text-amber-800 font-medium animate-fade-in">
                    {coffeeStarters[currentStarter]}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Share your thoughts..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="flex-1 bg-white"
                    />
                    <Button 
                      onClick={submitMessage} 
                      disabled={!messageText.trim()}
                      className="bg-amber-500 hover:bg-amber-600"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Learning Arcade */}
      <Card>
        <Collapsible
          open={openSections.includes("learning")}
          onOpenChange={() => toggleSection("learning")}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                    <Gamepad2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-green-900">Learning Arcade</CardTitle>
                    <p className="text-muted-foreground">Level up your skills with bite-sized learning</p>
                  </div>
                </div>
                {openSections.includes("learning") ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* User Badges */}
              <div className="flex gap-2 flex-wrap">
                {userBadges.map((badge, index) => (
                  <Badge key={index} className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800">
                    <Crown className="h-3 w-3 mr-1" />
                    {badge}
                  </Badge>
                ))}
              </div>
              
              {/* Learning Modules */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {learningModules.map((module) => (
                  <div key={module.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={module.completed ? "default" : "outline"}>
                        {module.badge}
                      </Badge>
                      {module.completed && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {module.popular && <Flame className="h-4 w-4 text-orange-500" />}
                    </div>
                    <h4 className="font-medium mb-1">{module.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{module.duration}</p>
                    <Button size="sm" className="w-full">
                      {module.completed ? "Review" : "Start"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Monthly Theme */}
      <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-purple-900">{monthlyTheme.name}</CardTitle>
              <p className="text-purple-700">{monthlyTheme.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{monthlyTheme.progress}%</span>
            </div>
            <Progress value={monthlyTheme.progress} className="h-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {monthlyTheme.challenges.map((challenge, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                {challenge.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{challenge.title}</p>
                  <p className="text-sm text-muted-foreground">{challenge.points} points</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comms Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-blue-900">Comms Feed</CardTitle>
                <p className="text-muted-foreground">What's happening across all houses</p>
              </div>
            </div>
            <Select value={commsFilter} onValueChange={setCommsFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="achievement">Achievements</SelectItem>
                <SelectItem value="ideas">Ideas</SelectItem>
                <SelectItem value="community">Community</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredComms.map((item) => (
            <div key={item.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{item.house}</Badge>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{item.author}</span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{item.time}</span>
              </div>
              <p className="mb-3">{item.message}</p>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm">
                  ❤️ {item.reactions.heart || 0}
                </Button>
                <Button variant="ghost" size="sm">
                  👍 {item.reactions.thumbsUp || 0}
                </Button>
                <div className="flex gap-1">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quiz Corner */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-indigo-900">Quiz Corner</CardTitle>
              <p className="text-muted-foreground">Test your knowledge and have fun!</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quizzes.map((quiz) => {
              const Icon = quiz.icon
              return (
                <div key={quiz.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer" onClick={() => startQuiz(quiz)}>
                  <div className="text-center space-y-3">
                    <div className="h-12 w-12 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                      <Icon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{quiz.title}</h4>
                      <p className="text-sm text-muted-foreground">{quiz.description}</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{quiz.completions} completed</span>
                    </div>
                    <Button size="sm" className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Take Quiz
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Idea Garden */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-green-100 to-lime-100 rounded-lg flex items-center justify-center">
              <Lightbulb className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-green-900">Idea Garden</CardTitle>
              <p className="text-muted-foreground">Plant seeds of innovation and watch them grow</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {ideaGarden.map((idea) => (
            <div key={idea.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium">{idea.title}</h4>
                  <p className="text-sm text-muted-foreground">by {idea.author}</p>
                </div>
                <Badge 
                  variant={idea.status === "Implemented" ? "default" : "outline"}
                  className={idea.status === "Growing" ? "bg-green-100 text-green-800" : ""}
                >
                  {idea.status}
                </Badge>
              </div>
              <p className="text-sm mb-3">{idea.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <Button variant="ghost" size="sm">
                    🌱 {idea.votes.sprout}
                  </Button>
                  <Button variant="ghost" size="sm">
                    🌻 {idea.votes.bloom}
                  </Button>
                  <Button variant="ghost" size="sm">
                    🗑️ {idea.votes.compost}
                  </Button>
                </div>
                <Badge variant="outline">{idea.category}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Journal Dialog */}
      <Dialog open={showJournal} onOpenChange={setShowJournal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Journal Reflection</DialogTitle>
            <DialogDescription>
              Take a moment to reflect on your shift and feelings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="How are you feeling? What went well today? Any challenges?"
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              rows={6}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowJournal(false)}>
                Cancel
              </Button>
              <Button onClick={saveJournal}>
                Save Reflection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <QuizDialog />
    </div>
  )
}