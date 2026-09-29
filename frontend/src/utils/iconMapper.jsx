import React from 'react';
import {
  FileText,
  BookOpen,
  Calendar,
  GitBranch,
  HelpCircle,
  FileCheck,
  Info,
  Newspaper,
  Link2,
  Download,
  Settings,
  RefreshCw,
  Award,
  Gavel,
  ClipboardCheck,
  FilePlus2,
  GraduationCap,
  Mic2,
  MapPin,
  ExternalLink,
} from 'lucide-react';

const ICON_MAP = {
  FileText,
  BookOpen,
  Calendar,
  GitBranch,
  HelpCircle,
  FileCheck,
  Info,
  Newspaper,
  Link2,
  Download,
  Settings,
  RefreshCw,
  Award,
  Gavel,
  ClipboardCheck,
  FilePlus2,
  GraduationCap,
  Mic2,
  MapPin,
  ExternalLink,
};

export const getLucideIcon = (iconName, size = 20) => {
  const IconComponent = ICON_MAP[iconName] || FileText;
  return <IconComponent size={size} />;
};


export const getLucideIconComponent = (iconName) => {
  return ICON_MAP[iconName] || FileText;
};
