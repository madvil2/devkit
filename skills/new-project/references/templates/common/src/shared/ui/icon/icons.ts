import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  Info,
  LoaderCircle,
  Monitor,
  Moon,
  Plus,
  RotateCw,
  Search,
  Sun,
  TriangleAlert,
  X,
} from 'lucide-react'

export const ICONS = {
  alert: CircleAlert,
  check: Check,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  close: X,
  external: ExternalLink,
  info: Info,
  loader: LoaderCircle,
  moon: Moon,
  plus: Plus,
  retry: RotateCw,
  search: Search,
  sun: Sun,
  system: Monitor,
  warning: TriangleAlert,
} as const

export type IconName = keyof typeof ICONS
