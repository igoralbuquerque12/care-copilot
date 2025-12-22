import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  Mic, 
  FileText, 
  Stethoscope, 
  Pill, 
  Settings, 
  History,
  Activity,
  FolderCode
} from "lucide-react";

export const SIDEBAR_ITEMS = [
  {
    title: "Visão Geral",
    icon: LayoutDashboard,
    href: "/",
    type: "link"
  },
  {
    title: "Atendimentos",
    icon: CalendarDays,
    type: "group",
    subItems: [
      { title: "Agenda do Dia", href: "/agenda", icon: CalendarDays },
      { title: "Histórico", href: "/agenda/historico", icon: History },
    ]
  },
  {
    title: "Pacientes",
    icon: Users,
    type: "group",
    subItems: [
      { title: "Lista de Pacientes", href: "/pacientes", icon: Users },
      { title: "Novo Prontuário", href: "/pacientes/novo", icon: FileText },
    ]
  },
  {
    title: "Care AI",
    icon: Mic,
    type: "group",
    subItems: [
      { title: "Captura de Voz", href: "/ai/captura", icon: Mic },
      { title: "Transcrições", href: "/ai/transcricoes", icon: FileText },
      { title: "Análises Clínicas", href: "/ai/insights", icon: Activity },
    ]
  },
  {
    title: "Clínico",
    icon: Stethoscope,
    type: "group",
    subItems: [
      { title: "Exames", href: "/clinico/exames", icon: FileText },
      { title: "Prescrições", href: "/clinico/prescricoes", icon: Pill },
    ]
  },
  {
    title: "Configurações",
    icon: Settings,
    href: "/profile",
    type: "link"
  },
  {
    title: "StyleGuide",
    icon: FolderCode,
    href: "/styleguide",
    type: "link"
  }
];