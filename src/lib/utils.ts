import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  Sun, CloudSun, Moon, Circle, Clock, Coffee, Star, Cloud, 
  Sunrise, Sunset, AlarmClock, Timer, Heart, Stethoscope, 
  Pill, Activity, Shield, User, Users, Baby, Accessibility,
  Home, Utensils, Bath, Bed, Trash2, WashingMachine, Sparkles,
  Car, Bike, MapPin, Briefcase, Clipboard, FileText, CheckCircle, Flag,
  Bell, Info, AlertTriangle, Zap, MoonStar, Key, Lock, Settings,
  Music, Camera, Book, Phone, Mail, Map,
  Apple, Beef, Beer, Cake, Pizza, Wine, Sandwich
} from 'lucide-react';

/**
 * Merges Tailwind class names, resolving any conflicts.
 *
 * @param inputs - An array of class names to merge.
 * @returns A string of merged and optimised class names.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Full set of available icons for Shift Models (~50 valid Lucide names)
export const SHIFT_ICONS: Record<string, any> = {
  'Clock': Clock,
  'Sun': Sun,
  'CloudSun': CloudSun,
  'Moon': Moon,
  'Sunrise': Sunrise,
  'Sunset': Sunset,
  'AlarmClock': AlarmClock,
  'Timer': Timer,
  'Coffee': Coffee,
  'Star': Star,
  'Cloud': Cloud,
  'Heart': Heart,
  'Stethoscope': Stethoscope,
  'Pill': Pill,
  'Activity': Activity,
  'Shield': Shield,
  'User': User,
  'Users': Users,
  'Baby': Baby,
  'Accessibility': Accessibility,
  'Home': Home,
  'Utensils': Utensils,
  'Bath': Bath,
  'Bed': Bed,
  'Trash2': Trash2,
  'WashingMachine': WashingMachine,
  'Sparkles': Sparkles,
  'Car': Car,
  'Bike': Bike,
  'MapPin': MapPin,
  'Briefcase': Briefcase,
  'Clipboard': Clipboard,
  'FileText': FileText,
  'CheckCircle': CheckCircle,
  'Flag': Flag,
  'Bell': Bell,
  'Info': Info,
  'AlertTriangle': AlertTriangle,
  'Zap': Zap,
  'MoonStar': MoonStar,
  'Key': Key,
  'Lock': Lock,
  'Settings': Settings,
  'Music': Music,
  'Camera': Camera,
  'Book': Book,
  'Phone': Phone,
  'Mail': Mail,
  'Map': Map,
  'Apple': Apple,
  'Beef': Beef,
  'Beer': Beer,
  'Cake': Cake,
  'Pizza': Pizza,
  'Sandwich': Sandwich,
  'Wine': Wine,
  'Circle': Circle
};

/**
 * Returns theme colors and icons for checklist periods (Morning, Day, Night, or dynamic)
 * Prioritizes DB-provided theme and iconName.
 */
export function getPeriodTheme(period?: string, theme?: string, iconName?: string) {
  // Use custom icon if provided
  const selectedIcon = iconName ? SHIFT_ICONS[iconName] : null;
  
  // Normalize theme for matching
  const t = (theme || '').toLowerCase();
  
  // 1. Check for specific color themes from DB
  if (t === 'morning' || t === 'amber') {
    return {
      name: period || 'Morning',
      color: 'amber',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: selectedIcon || Sun,
      dot: 'bg-amber-500'
    };
  }
  
  if (t === 'day' || t === 'sky' || t === 'blue') {
    return {
      name: period || 'Day',
      color: 'sky',
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200',
      icon: selectedIcon || CloudSun,
      dot: 'bg-sky-500'
    };
  }
  
  if (t === 'night' || t === 'evening' || t === 'indigo' || t === 'purple') {
    return {
      name: period || 'Night',
      color: 'indigo',
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      icon: selectedIcon || Moon,
      dot: 'bg-indigo-500'
    };
  }

  if (t === 'afternoon' || t === 'orange') {
    return {
      name: period || 'Afternoon',
      color: 'orange',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      icon: selectedIcon || Sun,
      dot: 'bg-orange-500'
    };
  }

  if (t === 'green' || t === 'emerald' || t === 'community') {
    return {
      name: period || 'Community',
      color: 'emerald',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: selectedIcon || Users,
      dot: 'bg-emerald-500'
    };
  }

  // 2. Legacy Fallback (String matching on name)
  const p = (period || '').toLowerCase();
  if (p.includes('morning')) return { name: period, color: 'amber', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: selectedIcon || Sun, dot: 'bg-amber-500' };
  if (p.includes('day')) return { name: period, color: 'sky', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: selectedIcon || CloudSun, dot: 'bg-sky-500' };
  if (p.includes('night')) return { name: period, color: 'indigo', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: selectedIcon || Moon, dot: 'bg-indigo-500' };

  // 3. Absolute Default
  return {
    name: period || 'Other',
    color: 'gray',
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    icon: selectedIcon || Circle,
    dot: 'bg-gray-500'
  };
}
