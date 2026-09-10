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
import { getVisibleSidebarItems } from "~/features/layout/constants/sidebar-items";
import { api } from "~/trpc/react";
import { SidebarItem } from "./sidebar";

import logo from "../../../public/logo.jpg";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const profile = api.profile.get.useQuery();
  const sidebarItems = getVisibleSidebarItems(
    Boolean(profile.data?.superAdmin),
  );

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="-ml-2 shrink-0 md:hidden"
        >
          <Menu className="text-muted-foreground h-6 w-6" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="bg-background border-border w-[280px] border-r p-0"
      >
        <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>

        <div className="flex h-full flex-col">
          <div className="border-border bg-card/50 flex h-16 items-center gap-3 border-b px-6">
            <Image
              src={logo}
              alt="Logo"
              width={32}
              height={32}
              className="rounded-md object-cover"
            />
            <div className="flex flex-col">
              <span className="text-foreground text-lg leading-none font-bold">
                Care Copilot
              </span>
              <span className="text-muted-foreground text-[10px] font-medium uppercase">
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
