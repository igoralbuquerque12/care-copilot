"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { getVisibleSidebarItems } from "~/features/layout/constants/sidebarItems";
import { api } from "~/trpc/react";
import { SidebarItem } from "./sidebar";

// Nova Logo
import logo from "../../../public/logo.jpg"; 

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const profile = api.profile.get.useQuery();
  const sidebarItems = getVisibleSidebarItems(Boolean(profile.data?.superAdmin));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden shrink-0 -ml-2">
          <Menu className="h-6 w-6 text-muted-foreground" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-[280px] p-0 bg-background border-r border-border">
        <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>

        <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 h-16 px-6 border-b border-border bg-card/50">
                <Image 
                    src={logo} 
                    alt="Logo" 
                    width={32} 
                    height={32} 
                    className="object-cover rounded-md" 
                />
                <div className="flex flex-col">
                    <span className="font-bold text-lg text-foreground leading-none">
                    Care Copilot
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase">
                    Assistente Médico
                    </span>
                </div>
            </div>

            <ScrollArea className="min-h-0 flex-1 px-3 py-4">
                <nav className="flex flex-col gap-2">
                {sidebarItems.map((item) => (
                    <SidebarItem
                        key={item.title}
                        item={item}
                        isCollapsed={false}
                        pathname={pathname}
                    />
                ))}
                </nav>
            </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
