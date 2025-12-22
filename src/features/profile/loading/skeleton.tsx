import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Separator } from "~/components/ui/separator";

export function ProfileFormSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
      <Card className="overflow-hidden border-border/50 shadow-md">
        
        <div className="h-32 w-full bg-muted" />

        <CardContent className="relative px-6 pb-8">
           
           <div className="flex flex-col md:flex-row items-end -mt-12 mb-8 gap-6">
              <div className="relative">
                 <Skeleton className="h-32 w-32 rounded-2xl border-4 border-card shadow-xl" />
              </div>
              
              <div className="flex-1 space-y-2 pb-2 w-full md:w-auto">
                 <Skeleton className="h-8 w-64" />
                 <Skeleton className="h-4 w-48" />
              </div>
           </div>

           <Separator className="mb-8" />

           <div className="grid gap-6 md:grid-cols-2">
              <div className="col-span-2 space-y-2 mb-2">
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
      <Card className="shadow-md border-border/50">
        <div className="p-6 space-y-2 pb-2">
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
              
              <div className="md:col-span-3 space-y-2">
                 <Skeleton className="h-4 w-10" />
                 <Skeleton className="h-10 w-full" />
              </div>
              <div className="md:col-span-9 space-y-2">
                 <Skeleton className="h-4 w-20" />
                 <Skeleton className="h-10 w-full" />
              </div>

              <div className="md:col-span-3 space-y-2">
                 <Skeleton className="h-4 w-16" />
                 <Skeleton className="h-10 w-full" />
              </div>
              <div className="md:col-span-9 space-y-2">
                 <Skeleton className="h-4 w-24" />
                 <Skeleton className="h-10 w-full" />
              </div>

              <div className="md:col-span-5 space-y-2">
                 <Skeleton className="h-4 w-16" />
                 <Skeleton className="h-10 w-full" />
              </div>
              <div className="md:col-span-5 space-y-2">
                 <Skeleton className="h-4 w-16" />
                 <Skeleton className="h-10 w-full" />
              </div>
              <div className="md:col-span-2 space-y-2">
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