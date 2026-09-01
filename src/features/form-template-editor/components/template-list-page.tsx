"use client";

import { Copy, FileText, Pencil, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { api } from "~/trpc/react";

export function TemplateListPage() {
  const router = useRouter();
  const utils = api.useUtils();
  const templates = api.formTemplate.list.useQuery();

  const duplicate = api.formTemplate.duplicate.useMutation({
    onSuccess: async (template) => {
      await utils.formTemplate.list.invalidate();
      toast.success("Template duplicado");
      router.push(`/configuracoes/formularios/${template.id}`);
    },
    onError: (error) => toast.error(error.message),
  });

  const setDefault = api.formTemplate.setDefault.useMutation({
    onSuccess: async () => {
      await utils.formTemplate.list.invalidate();
      toast.success("Template padrão atualizado");
    },
    onError: (error) => toast.error(error.message),
  });

  const archive = api.formTemplate.archive.useMutation({
    onSuccess: async () => {
      await utils.formTemplate.list.invalidate();
      toast.success("Template arquivado");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <main className="bg-background w-full p-4 md:p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Formulários de anamnese</h1>
            <p className="text-muted-foreground">
              Personalize as seções e os campos usados nas suas consultas.
            </p>
          </div>
          {templates.data?.[0] && (
            <Button
              onClick={() => duplicate.mutate({ id: templates.data[0]!.id })}
              disabled={duplicate.isPending}
            >
              <Copy className="h-4 w-4" />
              Novo a partir do padrão
            </Button>
          )}
        </div>

        {templates.isLoading && (
          <Card>
            <CardContent className="text-muted-foreground py-10 text-center text-sm">
              Carregando templates...
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 xl:grid-cols-2">
          {templates.data?.map((template) => (
            <Card key={template.id}>
              <CardHeader className="gap-3 sm:grid-cols-[1fr_auto]">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    <FileText className="text-primary h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="truncate">{template.name}</CardTitle>
                    <p className="text-muted-foreground text-sm">
                      {template.sections.length} seções
                    </p>
                  </div>
                  {template.isDefault && <Badge>Padrão</Badge>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!template.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefault.mutate({ id: template.id })}
                    >
                      <Star className="h-4 w-4" />
                      Padrão
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => duplicate.mutate({ id: template.id })}
                  >
                    <Copy className="h-4 w-4" />
                    Duplicar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/configuracoes/formularios/${template.id}`)
                    }
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                  {!template.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => archive.mutate({ id: template.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                      Arquivar
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
