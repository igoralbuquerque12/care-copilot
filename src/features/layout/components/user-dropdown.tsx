"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Switch } from "~/components/ui/switch";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { getInitials } from "~/features/layout/utils/get-initials";
import { signOutAction } from "~/features/auth/actions/auth.actions";

interface UserDropdownProps {
  user: {
    name?: string | null;
    email?: string | null;
    photoUrl?: string | null;
  };
}

export function UserDropdown({ user }: UserDropdownProps) {
  const { theme, setTheme } = useTheme();
  const userName = user.name ?? "Usuário";
  const userEmail = user.email ?? "";
  const userInitials = getInitials(userName);

  const handleSignOut = async () => {
    await signOutAction();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const avatarFallbackBg = "bg-[#E65100] text-white font-medium";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full p-0 hover:bg-transparent focus-visible:ring-1 focus-visible:ring-offset-1"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={user.photoUrl ?? undefined}
              alt={userName}
              className="object-cover"
            />
            <AvatarFallback className={avatarFallbackBg}>
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80 p-2" align="end" forceMount>
        <div className="mb-1 flex items-center gap-4 p-2">
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={user.photoUrl ?? undefined}
              alt={userName}
              className="object-cover"
            />
            <AvatarFallback className={`${avatarFallbackBg} text-lg`}>
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none font-bold">{userName}</p>
            <p className="text-muted-foreground max-w-[180px] truncate text-xs leading-none">
              {userEmail}
            </p>
          </div>
        </div>

        <Separator className="bg-border/60 my-2" />

        <DropdownMenuGroup>
          <DropdownMenuItem
            asChild
            className="focus:bg-accent/50 cursor-pointer p-3"
          >
            <Link href="/" className="flex w-full items-center text-sm">
              <LayoutDashboard className="text-muted-foreground/80 mr-4 h-5 w-5" />
              Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="focus:bg-accent/50 cursor-pointer p-3"
          >
            <Link href="/profile" className="flex w-full items-center text-sm">
              <User className="text-muted-foreground/80 mr-4 h-5 w-5" />
              Perfil
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <div className="hover:bg-accent/50 flex items-center justify-between rounded-sm p-3 pl-3 transition-colors select-none">
          <div className="flex items-center text-sm">
            <Sun className="text-muted-foreground/80 mr-4 h-5 w-5" />
            <span>Modo Escuro</span>
          </div>
          <Switch checked={isDarkMode} onCheckedChange={toggleTheme} />
        </div>

        <Separator className="bg-border/60 my-2" />

        <div className="p-2">
          <Button
            variant="outline"
            className="text-muted-foreground hover:text-foreground border-border/60 hover:bg-accent/50 h-10 w-full justify-center gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
