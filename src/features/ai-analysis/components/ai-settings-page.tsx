"use client";

import {
  Bot,
  CheckCircle2,
  KeyRound,
  Loader2,
  Save,
  Settings2,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import type { AiProvider } from "~/schemas/ai-analysis";
import { api } from "~/trpc/react";
import { AiPromptTemplatesCard } from "./ai-prompt-templates-card";

const providers: Array<{ id: AiProvider; label: string }> = [
  { id: "OPENAI", label: "OpenAI" },
  { id: "GROQ", label: "Groq" },
  { id: "GEMINI", label: "Gemini" },
  { id: "ANTHROPIC", label: "Anthropic" },
];

export function AiSettingsPage() {
  const utils = api.useUtils();
  const query = api.aiDiagnosis.getSettings.useQuery();
  const [keys, setKeys] = useState<Partial<Record<AiProvider, string>>>({});
  const [provider, setProvider] = useState<AiProvider>("OPENAI");
  const [model, setModel] = useState("");
  const [instructions, setInstructions] = useState("");
  useEffect(() => {
    if (query.data?.settings) {
      setProvider(query.data.settings.provider);
      setModel(query.data.settings.model);
      setInstructions(query.data.settings.customInstructions);
    } else if (query.data) {
      setModel(query.data.presets.OPENAI[1]);
    }
  }, [query.data]);
  const saveKey = api.aiDiagnosis.saveCredential.useMutation({
    onSuccess: async () => {
      toast.success("Chave armazenada com segurança");
      setKeys({});
      await utils.aiDiagnosis.getSettings.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const removeKey = api.aiDiagnosis.removeCredential.useMutation({
    onSuccess: async () => {
      toast.success("Chave removida");
      await utils.aiDiagnosis.getSettings.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const testKey = api.aiDiagnosis.testCredential.useMutation({
    onSuccess: async () => {
      toast.success("Credencial e modelo validados");
      await utils.aiDiagnosis.getSettings.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const saveSettings = api.aiDiagnosis.saveSettings.useMutation({
    onSuccess: async () => {
      toast.success("Configuração validada e ativada");
      await utils.aiDiagnosis.getSettings.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const presets = query.data?.presets[provider] ?? [];
  const credential = (id: AiProvider) =>
    query.data?.credentials.find((item) => item.provider === id);

  return (
    <main className="w-full space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10">
          <Settings2 className="h-5 w-5 text-violet-500" />
        </span>
        <div>
          <h1 className="text-2xl font-bold">Inteligência artificial</h1>
          <p className="text-muted-foreground text-sm">
            Configure credenciais e o modelo usado somente nas análises
            clínicas.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {providers.map((item) => {
          const saved = credential(item.id);
          return (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    {item.label}
                  </span>
                  {saved && (
                    <span className="flex items-center gap-1 text-xs font-normal text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      ••••{saved.lastFour}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  A chave nunca será exibida novamente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  type="password"
                  value={keys[item.id] ?? ""}
                  onChange={(event) =>
                    setKeys((current) => ({
                      ...current,
                      [item.id]: event.target.value,
                    }))
                  }
                  placeholder={
                    saved ? "Substituir chave existente" : "Cole a chave da API"
                  }
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      saveKey.mutate({
                        provider: item.id,
                        apiKey: keys[item.id] ?? "",
                      })
                    }
                    disabled={!keys[item.id] || saveKey.isPending}
                  >
                    Salvar chave
                  </Button>
                  {saved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeKey.mutate({ provider: item.id })}
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Remover
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modelo ativo para análise clínica</CardTitle>
          <CardDescription>
            Ao salvar, será feita uma validação mínima sem dados de pacientes.
            Não há fallback para outro provedor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Provedor</Label>
              <Select
                value={provider}
                onValueChange={(value) => {
                  const next = value as AiProvider;
                  setProvider(next);
                  const nextPresets = query.data?.presets[next];
                  setModel(nextPresets?.[0] ?? "");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-model">Modelo</Label>
              <Input
                id="ai-model"
                list="ai-model-presets"
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder="ID do modelo"
              />
              <datalist id="ai-model-presets">
                {presets.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
              <p className="text-muted-foreground text-xs">
                Escolha um preset ou informe outro identificador.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ai-instructions">Instruções adicionais</Label>
            <Textarea
              id="ai-instructions"
              rows={8}
              maxLength={8000}
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              placeholder="Ex.: dê atenção especial a interações medicamentosas e explique divergências de conduta."
            />
            <p className="text-muted-foreground text-right text-xs">
              {instructions.length}/8000
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => testKey.mutate({ provider, model })}
              disabled={!model || testKey.isPending}
            >
              {testKey.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              {testKey.isPending ? "Testando..." : "Testar credencial"}
            </Button>
            <Button
              onClick={() =>
                saveSettings.mutate({
                  provider,
                  model,
                  customInstructions: instructions,
                })
              }
              disabled={!model || saveSettings.isPending}
            >
              {saveSettings.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saveSettings.isPending ? "Validando..." : "Validar e ativar"}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-violet-500" />
            Chat clínico contextual
          </CardTitle>
          <CardDescription>
            Este modelo é fixo para o chat e não altera o modelo escolhido para
            a análise inicial.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="clinical-chat-model">Modelo do chat</Label>
          <Input
            id="clinical-chat-model"
            value={query.data?.chatModel ?? "gpt-5.6-terra"}
            readOnly
            aria-readonly="true"
          />
          <p className="text-muted-foreground text-xs">
            Disponível quando a OpenAI está ativa e a credencial foi validada.
          </p>
        </CardContent>
      </Card>
      <AiPromptTemplatesCard />
    </main>
  );
}
