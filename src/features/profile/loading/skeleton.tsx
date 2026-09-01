import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Separator } from "~/components/ui/separator";

export function ProfileFormSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-8">
      <Card className="border-border/50 overflow-hidden shadow-md">
        <div className="bg-muted h-32 w-full" />

        <CardContent className="relative px-6 pb-8">
          <div className="-mt-12 mb-8 flex flex-col items-end gap-6 md:flex-row">
            <div className="relative">
              <Skeleton className="border-card h-32 w-32 rounded-2xl border-4 shadow-xl" />
            </div>

            <div className="w-full flex-1 space-y-2 pb-2 md:w-auto">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>

          <Separator className="mb-8" />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="col-span-2 mb-2 space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-full max-w-[300px]" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CARD 2: Endereço */}
      <Card className="border-border/50 shadow-md">
        <div className="space-y-2 p-6 pb-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>

        <CardContent>
          <div className="grid gap-6 md:grid-cols-12">
            <div className="space-y-2 md:col-span-3">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2 md:col-span-9">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2 md:col-span-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2 md:col-span-9">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2 md:col-span-5">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2 md:col-span-5">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4 pt-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-40" />
      </div>
    </div>
  );
}
