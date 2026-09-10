"use client";

import { Braces, Loader2, RotateCcw, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

type PromptVariable = {
  key: string;
  label: string;
  description: string;
};

function PromptEditor({
  id,
  value,
  onChange,
  defaultValue,
  variables,
  helper,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  defaultValue: string;
  variables: readonly PromptVariable[];
  helper: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertVariable = (key: string) => {
    const token = "${" + key + "}";
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    onChange(value.slice(0, start) + token + value.slice(end));
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Label htmlFor={id}>Template do prompt</Label>
          <p className="text-muted-foreground mt-1 text-xs">{helper}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(defaultValue)}
          disabled={value === defaultValue}
        >
          <RotateCcw className="mr-2 h-3.5 w-3.5" />
          Restaurar padrão
        </Button>
      </div>

      <Textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={50_000}
        spellCheck={false}
        className="min-h-[480px] resize-y font-mono text-xs leading-relaxed"
      />
      <p className="text-muted-foreground text-right text-xs">
        {value.length.toLocaleString("pt-BR")}/50.000 caracteres
      </p>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Braces className="h-4 w-4 text-violet-500" />
          Variáveis disponíveis
        </div>
        <p className="text-muted-foreground text-xs">
          Clique para inserir na posição do cursor. O backend substitui somente
          as variáveis presentes no template.
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          {variables.map((variable) => (
            <button
              key={variable.key}
              type="button"
              onClick={() => insertVariable(variable.key)}
              className="hover:bg-muted/60 rounded-xl border p-3 text-left transition-colors"
            >
              <code className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                {"${" + variable.key + "}"}
              </code>
              <p className="mt-1 text-xs font-medium">{variable.label}</p>
              <p className="text-muted-foreground mt-0.5 text-[11px] leading-relaxed">
                {variable.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AiPromptTemplatesCard() {
  const utils = api.useUtils();
  const query = api.aiDiagnosis.getSettings.useQuery();
  const [analysisPrompt, setAnalysisPrompt] = useState("");
  const [clinicalChatPrompt, setClinicalChatPrompt] = useState("");

  useEffect(() => {
    if (!query.data?.promptConfiguration) return;
    setAnalysisPrompt(query.data.promptConfiguration.templates.analysis);
    setClinicalChatPrompt(
      query.data.promptConfiguration.templates.clinicalChat,
    );
  }, [query.data]);

  const save = api.aiDiagnosis.savePromptTemplates.useMutation({
    onSuccess: async () => {
      toast.success("Prompts personalizados salvos");
      await utils.aiDiagnosis.getSettings.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const configuration = query.data?.promptConfiguration;
  if (!configuration) {
    return (
      <Card>
        <CardContent className="text-muted-foreground flex min-h-40 items-center justify-center text-sm">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Carregando prompts...
        </CardContent>
      </Card>
    );
  }

  const hasSettings = Boolean(query.data?.settings);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Braces className="h-5 w-5 text-violet-500" />
          Prompts e variáveis dinâmicas
        </CardTitle>
        <CardDescription>
          Personalize integralmente as instruções enviadas à IA. Valores
          clínicos entram somente onde houver uma variável no formato
          {" ${campo}"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Tabs defaultValue="analysis">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analysis">Análise inicial</TabsTrigger>
            <TabsTrigger value="clinical-chat">Chat clínico</TabsTrigger>
          </TabsList>
          <TabsContent value="analysis" className="mt-5">
            <PromptEditor
              id="analysis-prompt-template"
              value={analysisPrompt}
              onChange={setAnalysisPrompt}
              defaultValue={configuration.defaults.analysis}
              variables={configuration.variables.analysis}
              helper="Este template define as instruções, os dados clínicos e o formato JSON da análise inicial."
            />
          </TabsContent>
          <TabsContent value="clinical-chat" className="mt-5">
            <PromptEditor
              id="clinical-chat-prompt-template"
              value={clinicalChatPrompt}
              onChange={setClinicalChatPrompt}
              defaultValue={configuration.defaults.clinicalChat}
              variables={configuration.variables.clinicalChat}
              helper="As mensagens e os arquivos continuam seguindo como entradas multimodais; o template controla as instruções e os blocos clínicos adicionais."
            />
          </TabsContent>
        </Tabs>

        {!hasSettings && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">
            Valide e ative primeiro um provedor e modelo para poder salvar os
            prompts.
          </p>
        )}
        <div className="flex justify-end">
          <Button
            onClick={() =>
              save.mutate({
                analysisPromptTemplate: analysisPrompt,
                clinicalChatPromptTemplate: clinicalChatPrompt,
              })
            }
            disabled={!hasSettings || save.isPending}
          >
            {save.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {save.isPending ? "Salvando..." : "Salvar prompts"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
