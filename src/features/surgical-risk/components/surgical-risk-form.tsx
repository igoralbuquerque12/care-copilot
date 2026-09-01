"use client";

import { AlertCircle, FileCheck, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Switch } from "~/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { SurgicalRiskCalculator } from "~/features/surgical-risk/components/surgical-risk-calculator";
import { useSurgicalRiskForm } from "~/features/surgical-risk/hooks/use-surgical-risk-form";
import {
  createSurgicalRiskSchema,
  type CreateSurgicalRiskInput,
} from "~/schemas/surgical-risk";

type SurgicalRiskFormProps = {
  anamnesisId: string;
  onSuccess?: () => void;
};

export function SurgicalRiskForm({
  anamnesisId,
  onSuccess,
}: SurgicalRiskFormProps) {
  const {
    defaultValues,
    wasInferred,
    inferredFields,
    isLoadingInference,
    existingRisk,
    createMutation,
    updateMutation,
  } = useSurgicalRiskForm(anamnesisId);

  const form = useForm<CreateSurgicalRiskInput>({
    resolver: zodResolver(createSurgicalRiskSchema),
    values: defaultValues,
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (data: CreateSurgicalRiskInput) => {
    try {
      if (existingRisk) {
        await updateMutation.mutateAsync({ id: existingRisk.id, ...data });
        toast.success("Avaliação de risco atualizada com sucesso");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Avaliação de risco cirúrgico salva com sucesso");
      }
      onSuccess?.();
    } catch {
      toast.error("Erro ao salvar avaliação de risco cirúrgico");
    }
  };

  if (isLoadingInference) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-12">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Carregando dados do paciente...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {wasInferred && inferredFields.length > 0 && (
          <Alert className="border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
            <AlertCircle className="h-4 w-4 text-yellow-700 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-700 dark:text-yellow-400">
              <strong>Atenção:</strong> Alguns campos foram pré-preenchidos com
              base no histórico do paciente ({inferredFields.join(", ")}).
              Confirme os dados antes de salvar.
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="surgeryName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Cirurgia / Procedimento *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex.: colecistectomia laparoscópica"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <div>
          <h3 className="mb-1 text-sm font-semibold">
            Preditores do Índice de Lee (RCRI)
          </h3>
          <p className="text-muted-foreground mb-3 text-xs">
            Marque os fatores de risco presentes. O escore é calculado
            automaticamente.
          </p>
          <SurgicalRiskCalculator control={form.control} />
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="asaClass"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Classificação ASA</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="I">ASA I - Saudável</SelectItem>
                    <SelectItem value="II">
                      ASA II - Doença sistêmica leve
                    </SelectItem>
                    <SelectItem value="III">
                      ASA III - Doença sistêmica grave
                    </SelectItem>
                    <SelectItem value="IV">
                      ASA IV - Ameaça constante à vida
                    </SelectItem>
                    <SelectItem value="V">ASA V - Moribundo</SelectItem>
                    <SelectItem value="VI">
                      ASA VI - Morte encefálica (doador)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mets"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacidade Funcional (METs)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    placeholder="1-12"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value) : undefined,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="recommendation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parecer / Recomendação</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Paciente apresenta risco cirúrgico intermediário. Recomenda-se..."
                  className="min-h-[100px]"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isCleared"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
              <div>
                <FormLabel className="text-sm font-medium">
                  Liberado para cirurgia
                </FormLabel>
                <p className="text-muted-foreground text-xs">
                  Indica se o paciente está apto para o procedimento cirúrgico
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <FileCheck className="mr-2 h-4 w-4" />
              {existingRisk
                ? "Atualizar Avaliação"
                : "Salvar Avaliação de Risco"}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
