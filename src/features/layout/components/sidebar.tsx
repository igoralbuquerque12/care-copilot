"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { LogOut, ChevronRight, ChevronDown, ChevronLeft } from "lucide-react";

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
import { api } from "~/trpc/react";

import type { SidebarItemProps } from "~/features/layout/types/sidebar.types";

import logo from "../../../public/logo.jpg";

import { getVisibleSidebarItems } from "~/features/layout/constants/sidebar-items";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const pathname = usePathname();
  const profile = api.profile.get.useQuery();
  const sidebarItems = React.useMemo(
    () => getVisibleSidebarItems(Boolean(profile.data?.superAdmin)),
    [profile.data?.superAdmin],
  );

  const handleLogout = async () => {
    await signOutAction();
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "bg-card border-border relative z-20 flex h-screen min-h-0 flex-col border-r font-sans shadow-sm transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-[260px]",
        )}
      >
        <div className="mt-2 mb-2 flex h-16 items-center justify-between px-4">
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

            <div
              className={cn(
                "flex origin-left flex-col transition-all duration-300",
                isCollapsed
                  ? "w-0 scale-0 opacity-0"
                  : "w-auto scale-100 opacity-100",
              )}
            >
              <span className="text-primary text-lg font-bold tracking-tight">
                Care Copilot
              </span>
              <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                Medical AI
              </span>
            </div>
          </div>

          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8 shrink-0 rounded-full"
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
              className="text-muted-foreground hover:text-primary h-8 w-8"
              onClick={() => setIsCollapsed(false)}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        <ScrollArea className="min-h-0 flex-1 px-3 pt-2">
          <nav className="flex flex-col gap-2 pb-4">
            {sidebarItems.map((item) => (
              <SidebarItem
                key={item.title}
                item={item}
                isCollapsed={isCollapsed}
                pathname={pathname}
              />
            ))}
          </nav>
        </ScrollArea>

        <div className="border-border mt-auto border-t p-4">
          <Button
            variant="ghost"
            className={cn(
              "text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-full",
              isCollapsed ? "justify-center px-0" : "justify-start gap-3 px-2",
            )}
            onClick={handleLogout}
          >
            <LogOut className={cn("h-5 w-5", isCollapsed ? "mr-0" : "")} />
            {!isCollapsed && (
              <span className="text-sm font-medium">Encerrar Sessão</span>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

export function SidebarItem({ item, isCollapsed, pathname }: SidebarItemProps) {
  const [isOpen, setIsOpen] = React.useState(false);

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
              "mx-auto flex h-10 w-10 items-center justify-center rounded-lg transition-all",
              isActive || isGroupActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <item.icon className="h-5 w-5" strokeWidth={2} />
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="bg-popover text-popover-foreground border-border ml-2 font-medium"
        >
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
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-primary/10 text-primary font-semibold"
            : "text-muted-foreground hover:text-foreground hover:bg-accent",
        )}
      >
        <item.icon
          className={cn(
            "h-5 w-5",
            isActive ? "text-primary" : "text-muted-foreground",
          )}
        />
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
            "hover:bg-accent h-auto w-full justify-between px-3 py-2.5 text-sm font-medium transition-all",
            isGroupActive ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon
              className={cn(
                "h-5 w-5",
                isGroupActive ? "text-primary" : "text-muted-foreground",
              )}
            />
            <span>{item.title}</span>
          </div>
          {isOpen ? (
            <ChevronDown className="text-muted-foreground h-4 w-4 transition-transform duration-200" />
          ) : (
            <ChevronRight className="text-muted-foreground/50 h-4 w-4 transition-transform duration-200" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
        <div className="border-border mt-1 ml-[1.15rem] flex flex-col gap-1 border-l pb-1 pl-4">
          {item.subItems?.map((sub) => {
            const isSubActive = pathname === sub.href;

            return (
              <Link
                key={sub.title}
                href={sub.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all",
                  isSubActive
                    ? "text-primary bg-primary/5 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                {sub.icon && (
                  <sub.icon
                    className={cn(
                      "h-4 w-4",
                      isSubActive ? "text-primary" : "text-muted-foreground/70",
                    )}
                  />
                )}

                {sub.title}
              </Link>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
