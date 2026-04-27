"use client";

import { Coins } from "lucide-react";
import { api } from "~/trpc/react";

export function CreditsBadge() {
  const { data: balance, isLoading } = api.credits.getBalance.useQuery();

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm">
      <Coins className="h-4 w-4 text-primary" />
      <span className="font-medium text-foreground">
        {isLoading ? "..." : (balance ?? 0).toLocaleString("pt-BR")}
      </span>
      <span className="text-xs text-muted-foreground">creditos</span>
    </div>
  );
}
