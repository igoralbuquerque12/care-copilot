import {
  LayoutDashboard,
  Users,
  CalendarDays,
  CalendarPlus,
  Mic,
  FileText,
  Stethoscope,
  Pill,
  Settings,
  Activity,
  FolderCode,
  ClipboardList,
  BrainCircuit,
  ShieldCheck,
  HeartPulse
} from "lucide-react";
import type { SidebarItemType } from "~/features/layout/types/sidebar.types";

export const SIDEBAR_ITEMS: SidebarItemType[] = [
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
      { title: "Dashboard", href: "/consultas", icon: CalendarDays },
      { title: "Agendar Consulta", href: "/consultas/agendar", icon: CalendarPlus },
      { title: "Risco Cirúrgico", href: "/risco-cirurgico", icon: HeartPulse },
    ]
  },
  {
    title: "Pacientes",
    icon: Users,
    type: "group",
    subItems: [
      { title: "Buscar paciente", href: "/pacientes", icon: Users },
    ]
  },
  {
    title: "Anamneses",
    icon: Stethoscope,
    type: "group",
    subItems: [
      { title: "Nova Anamnese", href: "/anamnesis", icon: Stethoscope },
    ]
  },
  // {
  //   title: "Care AI",
  //   icon: Mic,
  //   type: "group",
  //   subItems: [
  //     { title: "Captura de Voz", href: "/anamnesis/audio", icon: Mic },
  //   ]
  // },
  {
    title: "Configurações",
    icon: Settings,
    type: "group",
    subItems: [
      { title: "Minha Conta", href: "/profile", icon: Settings },
      { title: "Formulários", href: "/configuracoes/formularios", icon: ClipboardList },
      { title: "Inteligência Artificial", href: "/configuracoes/ia", icon: BrainCircuit },
      {
        title: "Super Admin",
        href: "/configuracoes/superadmin",
        icon: ShieldCheck,
        superAdminOnly: true,
      },
    ]
  },
];

export const getVisibleSidebarItems = (isSuperAdmin: boolean) =>
  SIDEBAR_ITEMS
    .filter((item) => !item.superAdminOnly || isSuperAdmin)
    .map((item) => {
      if (!item.subItems) return item;

      return {
        ...item,
        subItems: item.subItems.filter(
          (subItem) => !subItem.superAdminOnly || isSuperAdmin,
        ),
      };
    })
    .filter((item) => item.type === "link" || (item.subItems?.length ?? 0) > 0);
