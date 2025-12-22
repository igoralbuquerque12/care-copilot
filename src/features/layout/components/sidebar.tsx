"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LogOut, 
  ChevronRight, 
  ChevronDown,
  ChevronLeft,
} from "lucide-react";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { signOutAction } from "~/features/auth/actions/auth.actions";

import type { SidebarItemProps, SidebarItemType } from "~/features/layout/types/sidebar.types";

// Atualizando a importação para a nova logo
import logo from "../../../public/logo.jpg"; 

import { SIDEBAR_ITEMS } from "~/features/layout/constants/sidebarItems";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
     await signOutAction();
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative flex flex-col h-screen bg-card border-r border-border transition-all duration-300 ease-in-out font-sans shadow-sm z-20",
          isCollapsed ? "w-20" : "w-[260px]"
        )}
      >
        
        <div className="flex items-center justify-between h-16 px-4 mb-2 mt-2">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
             <div className="relative shrink-0 overflow-hidden rounded-lg">
                <Image 
                  src={logo} 
                  alt="Care Copilot Logo" 
                  width={36} 
                  height={36} 
                  className="object-cover" 
                />
             </div>
             
             <div className={cn(
               "flex flex-col transition-all duration-300 origin-left",
               isCollapsed ? "opacity-0 w-0 scale-0" : "opacity-100 w-auto scale-100"
             )}>
               <span className="font-bold text-lg text-primary tracking-tight">
                 Care Copilot
               </span>
               <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                 Medical AI
               </span>
             </div>
          </div>

          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full shrink-0"
              onClick={() => setIsCollapsed(true)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
        </div>

        {isCollapsed && (
             <div className="flex justify-center pb-4">
                 <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => setIsCollapsed(false)}
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>
        )}

        <ScrollArea className="flex-1 px-3 pt-2">
          <nav className="flex flex-col gap-2 pb-4">
            {SIDEBAR_ITEMS.map((item) => (
              <SidebarItem
                key={item.title}
                item={item as SidebarItemType}
                isCollapsed={isCollapsed}
                pathname={pathname}
              />
            ))}
          </nav>
        </ScrollArea>

        <div className="p-4 mt-auto border-t border-border">
             <Button 
                variant="ghost" 
                className={cn(
                    "w-full h-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                    isCollapsed ? "justify-center px-0" : "justify-start px-2 gap-3"
                )}
                onClick={handleLogout}
            >
                <LogOut className={cn("h-5 w-5", isCollapsed ? "mr-0" : "")} /> 
                {!isCollapsed && <span className="font-medium text-sm">Encerrar Sessão</span>}
            </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

export function SidebarItem({ item, isCollapsed, pathname }: SidebarItemProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Lógica aprimorada para manter menus abertos se um filho estiver ativo
  const isActive = item.href ? pathname === item.href : false;
  const isGroupActive = item.subItems?.some((sub) => pathname === sub.href);

  React.useEffect(() => {
    if (isGroupActive) setIsOpen(true);
  }, [isGroupActive]);


  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.href ?? "#"}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg transition-all mx-auto",
              (isActive || isGroupActive) 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-5 w-5" strokeWidth={2} />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-popover text-popover-foreground border-border ml-2 font-medium">
            <p>{item.title}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (item.type === "link" && item.href) {
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          isActive 
            ? "bg-primary/10 text-primary font-semibold" 
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
        {item.title}
      </Link>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-between px-3 py-2.5 h-auto text-sm font-medium transition-all hover:bg-accent",
            isGroupActive ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon className={cn("h-5 w-5", isGroupActive ? "text-primary" : "text-muted-foreground")} />
            <span>{item.title}</span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-transform duration-200" />
          )}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className="flex flex-col mt-1 ml-[1.15rem] pl-4 border-l border-border gap-1 pb-1">
          {item.subItems?.map((sub) => {
             const isSubActive = pathname === sub.href;
             
             return (
                <Link
                key={sub.title}
                href={sub.href}
                className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all",
                    isSubActive 
                        ? "text-primary font-semibold bg-primary/5" 
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
                >
                {sub.icon && <sub.icon className={cn("h-4 w-4", isSubActive ? "text-primary" : "text-muted-foreground/70")} />}
                
                {sub.title}
                </Link>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}