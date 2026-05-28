import type { LucideIcon } from "lucide-react";

export interface SidebarItemProps {
  item: SidebarItemType;
  isCollapsed: boolean;
  pathname: string;
}

export type SubItemType = {
  title: string;
  href: string;
  icon?: LucideIcon;
  superAdminOnly?: boolean;
};

export type SidebarItemType = {
  title: string;
  icon: LucideIcon;
  href?: string;
  type: "link" | "group";
  subItems?: SubItemType[];
  superAdminOnly?: boolean;
};
