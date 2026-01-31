import { Search, User, Mic, ChevronDown, Settings, Download } from "lucide-react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import logoImage from "figma:asset/f3af992cac56995a6cdd26ba3daa4dafd2d831bf.png"

interface HeaderProps {
  onPageChange?: (page: string) => void
}

export function Header({ onPageChange }: HeaderProps = {}) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <img src={logoImage} alt="InsideCare" className="h-10 w-auto" />
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="Search participants, staff, incidents..."
              className="pl-10 pr-12 bg-gray-50 border-gray-200 focus:bg-white"
            />
            <Button 
              variant="ghost" 
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-gray-100"
            >
              <Mic className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </div>

        {/* Branch Selector and Profile */}
        <div className="flex items-center gap-4">
          <Select defaultValue="sil-care">
            <SelectTrigger className="w-48 bg-gray-50 border-gray-200">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sil-care">SIL Care PTY Ltd</SelectItem>
              <SelectItem value="branch-2">Branch 2</SelectItem>
              <SelectItem value="branch-3">Branch 3</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onPageChange?.('export-hub')}
            className="hidden md:flex"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onPageChange?.('settings')}
            className="hidden md:flex"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          
          <Button variant="ghost" size="icon">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-100 text-blue-600">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </div>
    </header>
  )
}