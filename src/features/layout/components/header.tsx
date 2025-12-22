import Link from "next/link";
import { Search, Mic, Plus, Bell } from "lucide-react";

import { getUser } from "~/server/auth/supabase.server";
import { UserDropdown } from "~/features/layout/components/userDropdown";
import { MobileSidebar } from "~/features/layout/components/mobileSidebar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";

export async function Header() {
  const user = await getUser();

  const userData = user ? {
    name: user.user_metadata.name as string | undefined,
    email: user.email,
    photoUrl: user.user_metadata.photoUrl as string | undefined 
  } : null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        
        <div className="flex items-center gap-4">
            <MobileSidebar />
            
            {/* Contexto/Breadcrumb Simples */}
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Clínica</span>
                <span className="text-muted-foreground/40">/</span>
                <span>Visão Geral</span>
            </div>
        </div>

        {/* Barra de Pesquisa Central - Estilo "Command Center" */}
        <div className="hidden md:flex flex-1 max-w-md mx-6 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
                placeholder="Buscar pacientes, exames ou medicamentos..." 
                className="pl-10 bg-muted/40 border-transparent focus-visible:bg-background focus-visible:border-primary/50 focus-visible:ring-0 transition-all rounded-full h-10"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </div>
        </div>

        <div className="flex items-center gap-3">
          
          {/* Botões de Ação Rápida */}
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <Button size="sm" variant="outline" className="h-9 gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary rounded-full hidden lg:flex">
                <Mic className="h-4 w-4" />
                <span>Gravar Sessão</span>
            </Button>
            
            <Button size="sm" className="h-9 gap-2 rounded-full shadow-sm">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nova Consulta</span>
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6 hidden sm:block" />

          {/* Notificações */}
          <Button variant="ghost" size="icon" className="relative rounded-full text-muted-foreground hover:text-foreground">
             <Bell className="h-5 w-5" />
             <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-destructive border border-background"></span>
          </Button>

          {userData ? (
            <UserDropdown user={userData} />
          ) : (
            <Link 
                href="/auth" 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
                Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}