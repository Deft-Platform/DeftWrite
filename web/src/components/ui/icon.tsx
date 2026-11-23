import {
  ArrowLeft, ArrowRight, ArrowUp, Bold, Book, BookOpen, Check, ChevronDown,
  ChevronUp, Cloud, Code, Cpu, Download, Edit3, Eye, FilePlus, FileText,
  FolderTree, Image, Info, Italic, Linkedin, List, ListOrdered, Maximize, MessageCircle,
  Minus, Pencil, Plus, Quote, RefreshCw, Save, Share2, ShieldCheck, Sparkles, Strikethrough,
  Trash2, Twitter, X, type LucideIcon,
} from 'lucide-react';

// Central registry mapping the kebab-case icon names used across the app to
// lucide-react components. These render real <svg class="lucide ..."> elements
// that survive React re-renders — unlike the old `<i data-lucide>` + one-shot
// createIcons() approach, which left icons blank after the first render.
const REGISTRY: Record<string, LucideIcon> = {
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-up': ArrowUp,
  bold: Bold,
  book: Book,
  'book-open': BookOpen,
  check: Check,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  cloud: Cloud,
  code: Code,
  cpu: Cpu,
  download: Download,
  'edit-3': Edit3,
  eye: Eye,
  'file-plus': FilePlus,
  'file-text': FileText,
  'folder-tree': FolderTree,
  image: Image,
  info: Info,
  italic: Italic,
  linkedin: Linkedin,
  list: List,
  'list-ordered': ListOrdered,
  maximize: Maximize,
  'message-circle': MessageCircle,
  minus: Minus,
  pencil: Pencil,
  plus: Plus,
  quote: Quote,
  refresh: RefreshCw,
  save: Save,
  sparkles: Sparkles,
  'share-2': Share2,
  'shield-check': ShieldCheck,
  strikethrough: Strikethrough,
  trash: Trash2,
  twitter: Twitter,
  x: X,
};

interface IconProps {
  name: string;
  className?: string;
}

export function Icon({ name, className }: IconProps) {
  const Cmp = REGISTRY[name] ?? FileText;
  return <Cmp className={className} aria-hidden="true" />;
}
