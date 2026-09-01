"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  RefreshCw,
  Send,
  Settings,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

const MAX_FILES = 5;
const MAX_FILE_BYTES = 20_000_000;
const MAX_TOTAL_BYTES = 50_000_000;

type StreamEvent = {
  event: string;
  data: Record<string, unknown>;
};

type Props = {
  patientId: string;
  patientName: string;
  contextAnamnesisId?: string | null;
  anamnesis?: { id: string; date: Date; chiefComplaint: string } | null;
  onBack: () => void;
};

const formatBytes = (bytes: number) => {
  if (bytes < 1_000_000) return `${Math.max(1, Math.round(bytes / 1_000))} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
};

const eventString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const consumeSse = async (
  response: Response,
  onEvent: (event: StreamEvent) => void | Promise<void>,
) => {
  const reader = response.body?.getReader();
  if (!reader)
    throw new Error("O navegador nao conseguiu abrir o stream da resposta.");
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const chunks = buffer.split(/\r?\n\r?\n/);
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const lines = chunk.split(/\r?\n/);
      const event = lines
        .find((line) => line.startsWith("event:"))
        ?.slice(6)
        .trim();
      const rawData = lines
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("\n");
      if (!event || !rawData) continue;
      await onEvent({
        event,
        data: JSON.parse(rawData) as Record<string, unknown>,
      });
    }
    if (done) break;
  }
};

const availabilityCopy = {
  NOT_CONFIGURED: {
    title: "Configure a OpenAI para usar o chat clinico",
    description:
      "Cadastre uma chave, selecione a OpenAI como provedor ativo e valide a configuracao.",
  },
  OPENAI_REQUIRED: {
    title: "Chat clinico disponivel inicialmente apenas com OpenAI",
    description:
      "Seu provedor ativo e outro. Ative a OpenAI nas configuracoes para liberar esta funcionalidade.",
  },
  OPENAI_CREDENTIAL_UNVERIFIED: {
    title: "Valide novamente sua credencial OpenAI",
    description:
      "A chave esta ausente, foi alterada ou ainda nao passou pela validacao.",
  },
} as const;

export function ClinicalChatPanel({
  patientId,
  patientName,
  contextAnamnesisId,
  anamnesis,
  onBack,
}: Props) {
  const utils = api.useUtils();
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<{
    id: string;
    content: string;
  } | null>(null);

  const query = api.clinicalChat.get.useInfiniteQuery(
    { patientId, limit: 50 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchInterval: (result) =>
        result.state.data?.pages[0]?.isGenerating ? 2_000 : false,
    },
  );
  const firstPage = query.data?.pages[0];
  const messages = useMemo(
    () =>
      query.data
        ? [...query.data.pages].reverse().flatMap((page) => page.messages)
        : [],
    [query.data],
  );
  const lastMessageId = messages.at(-1)?.id;
  const busy = sending || Boolean(firstPage?.isGenerating && !streamingMessage);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: streamingMessage ? "auto" : "smooth",
    });
  }, [messages.length, streamingMessage]);

  const addFiles = (incoming: File[]) => {
    const combined = [...files, ...incoming];
    if (combined.length > MAX_FILES) {
      toast.error(`Envie no maximo ${MAX_FILES} arquivos por mensagem.`);
      return;
    }
    const invalid = incoming.find(
      (file) => file.size <= 0 || file.size > MAX_FILE_BYTES,
    );
    if (invalid) {
      toast.error(`${invalid.name} deve ter no maximo 20 MB.`);
      return;
    }
    const selectedBytes = combined.reduce(
      (total, file) => total + file.size,
      0,
    );
    if ((firstPage?.attachmentBytes ?? 0) + selectedBytes > MAX_TOTAL_BYTES) {
      toast.error(
        "Os anexos deste chat atingiriam o limite acumulado de 50 MB.",
      );
      return;
    }
    setFiles(combined);
  };

  const send = async (retryAssistantMessageId?: string) => {
    if (!retryAssistantMessageId && !message.trim()) return;
    const form = new FormData();
    form.set("patientId", patientId);
    const selectedAnamnesisId = anamnesis?.id ?? contextAnamnesisId;
    if (selectedAnamnesisId) form.set("anamnesisId", selectedAnamnesisId);
    form.set("message", retryAssistantMessageId ? "" : message.trim());
    if (retryAssistantMessageId)
      form.set("retryAssistantMessageId", retryAssistantMessageId);
    if (!retryAssistantMessageId)
      files.forEach((file) => form.append("files", file));

    setSending(true);
    setStreamingMessage(null);
    try {
      const response = await fetch("/api/clinical-chat", {
        method: "POST",
        body: form,
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Nao foi possivel enviar a mensagem.");
      }
      if (!retryAssistantMessageId) {
        setMessage("");
        setFiles([]);
        if (inputRef.current) inputRef.current.value = "";
      }

      let streamedError: string | null = null;
      await consumeSse(response, async ({ event, data }) => {
        if (event === "meta") {
          const assistantMessageId = eventString(data.assistantMessageId);
          setStreamingMessage({ id: assistantMessageId, content: "" });
          await query.refetch();
        } else if (event === "delta") {
          const delta = eventString(data.delta);
          setStreamingMessage((current) =>
            current
              ? { ...current, content: current.content + delta }
              : current,
          );
        } else if (event === "error") {
          streamedError = eventString(
            data.message,
            "Nao foi possivel concluir a resposta.",
          );
        }
      });

      await query.refetch();
      setStreamingMessage(null);
      if (streamedError) throw new Error(streamedError);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao conversar com a IA.",
      );
      await query.refetch();
      setStreamingMessage(null);
    } finally {
      setSending(false);
    }
  };

  const openAttachment = async (attachmentId: string) => {
    try {
      const result = await utils.clinicalChat.getAttachmentUrl.fetch({
        patientId,
        attachmentId,
      });
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel abrir o anexo.",
      );
    }
  };

  const availability = firstPage?.availability;
  const unavailable =
    availability?.state && availability.state !== "AVAILABLE"
      ? availabilityCopy[availability.state]
      : null;

  return (
    <main className="p-4 md:p-8">
      <section className="bg-card mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl flex-col overflow-hidden rounded-2xl border shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              aria-label="Voltar ao prontuario"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
              <Bot className="h-5 w-5 text-violet-600" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold">
                Chat clinico · {patientName}
              </h1>
              <p className="text-muted-foreground truncate text-xs">
                {anamnesis
                  ? `${new Date(anamnesis.date).toLocaleDateString("pt-BR")} · ${anamnesis.chiefComplaint}`
                  : contextAnamnesisId
                    ? "Carregando anamnese selecionada..."
                    : "Sem anamnese selecionada; usando os dados clinicos disponiveis"}
              </p>
            </div>
          </div>
          <Badge variant="outline">
            {availability?.model ?? "GPT-5.6 Terra"}
          </Badge>
        </header>

        {query.isLoading ? (
          <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Carregando conversa...
          </div>
        ) : unavailable ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="max-w-lg rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
              <Settings className="mx-auto h-7 w-7 text-amber-600" />
              <h2 className="mt-3 font-semibold">{unavailable.title}</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {unavailable.description}
              </p>
              <Button asChild className="mt-5">
                <Link href="/configuracoes/ia">Abrir configuracoes de IA</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-muted/15 flex-1 overflow-y-auto px-4 py-5 md:px-8">
              <div className="mx-auto max-w-4xl space-y-5">
                {query.hasNextPage && (
                  <div className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => query.fetchNextPage()}
                      disabled={query.isFetchingNextPage}
                    >
                      {query.isFetchingNextPage && (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      )}
                      Carregar mensagens anteriores
                    </Button>
                  </div>
                )}

                {messages.length === 0 && !sending && (
                  <div className="py-16 text-center">
                    <Bot className="mx-auto h-9 w-9 text-violet-500" />
                    <h2 className="mt-3 text-lg font-semibold">
                      Converse sobre este caso
                    </h2>
                    <p className="text-muted-foreground mx-auto mt-1 max-w-xl text-sm">
                      Questione hipoteses, peca explicacoes ou apresente novas
                      informacoes. O chat nao altera o prontuario.
                    </p>
                  </div>
                )}

                {messages.map((item) => {
                  const visibleContent =
                    streamingMessage?.id === item.id
                      ? streamingMessage.content
                      : item.content;
                  const isUser = item.role === "USER";
                  return (
                    <article
                      key={item.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm md:max-w-[82%] ${
                          isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-foreground border"
                        }`}
                      >
                        {visibleContent ? (
                          isUser ? (
                            <p className="whitespace-pre-wrap">
                              {visibleContent}
                            </p>
                          ) : (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => (
                                  <p className="mb-3 whitespace-pre-wrap last:mb-0">
                                    {children}
                                  </p>
                                ),
                                ul: ({ children }) => (
                                  <ul className="mb-3 list-disc space-y-1 pl-5">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="mb-3 list-decimal space-y-1 pl-5">
                                    {children}
                                  </ol>
                                ),
                                h1: ({ children }) => (
                                  <h3 className="mb-2 text-base font-semibold">
                                    {children}
                                  </h3>
                                ),
                                h2: ({ children }) => (
                                  <h3 className="mb-2 text-base font-semibold">
                                    {children}
                                  </h3>
                                ),
                                h3: ({ children }) => (
                                  <h4 className="mb-2 font-semibold">
                                    {children}
                                  </h4>
                                ),
                                a: ({ children, href }) => (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline"
                                  >
                                    {children}
                                  </a>
                                ),
                                code: ({ children }) => (
                                  <code className="bg-muted rounded px-1 py-0.5 text-xs">
                                    {children}
                                  </code>
                                ),
                              }}
                            >
                              {visibleContent}
                            </ReactMarkdown>
                          )
                        ) : item.status === "STREAMING" ? (
                          <p className="text-muted-foreground flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analisando o caso...
                          </p>
                        ) : null}

                        {item.attachments.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.attachments.map((attachment) => (
                              <button
                                key={attachment.id}
                                type="button"
                                onClick={() => openAttachment(attachment.id)}
                                className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs ${
                                  isUser
                                    ? "border-primary-foreground/25 bg-primary-foreground/10"
                                    : "bg-muted/40 hover:bg-muted"
                                }`}
                              >
                                {attachment.mimeType === "application/pdf" ? (
                                  <FileText className="h-3.5 w-3.5" />
                                ) : (
                                  <ImageIcon className="h-3.5 w-3.5" />
                                )}
                                <span className="max-w-48 truncate">
                                  {attachment.originalName}
                                </span>
                                <span className="opacity-70">
                                  {formatBytes(attachment.sizeBytes)}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {item.status === "FAILED" && (
                          <div className="mt-3 border-t border-red-500/20 pt-2 text-xs text-red-600 dark:text-red-400">
                            <p className="flex items-center gap-1.5">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {item.errorMessage ??
                                "A resposta nao foi concluida."}
                            </p>
                            {item.id === lastMessageId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-1 h-7 px-2 text-red-600"
                                onClick={() => send(item.id)}
                                disabled={sending}
                              >
                                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                                Tentar novamente
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            </div>

            <footer className="bg-card border-t p-3 md:p-4">
              <div className="mx-auto max-w-4xl">
                {files.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {files.map((file, index) => (
                      <span
                        key={`${file.name}-${index}`}
                        className="bg-muted/30 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs"
                      >
                        {file.type === "application/pdf" ? (
                          <FileText className="h-3.5 w-3.5" />
                        ) : (
                          <ImageIcon className="h-3.5 w-3.5" />
                        )}
                        <span className="max-w-48 truncate">{file.name}</span>
                        <span className="text-muted-foreground">
                          {formatBytes(file.size)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setFiles((current) =>
                              current.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            )
                          }
                          aria-label={`Remover ${file.name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="bg-background focus-within:ring-ring/40 flex items-end gap-2 rounded-2xl border p-2 shadow-sm focus-within:ring-2">
                  <input
                    ref={inputRef}
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(event) =>
                      addFiles(Array.from(event.target.files ?? []))
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => inputRef.current?.click()}
                    disabled={busy}
                    aria-label="Anexar exames"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Textarea
                    value={message}
                    onChange={(event) =>
                      setMessage(event.target.value.slice(0, 8_000))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        if (!busy && message.trim()) void send();
                      }
                    }}
                    rows={1}
                    maxLength={8_000}
                    placeholder="Converse sobre os achados deste paciente..."
                    disabled={busy}
                    className="max-h-40 min-h-10 flex-1 resize-none border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
                  />
                  <Button
                    size="icon"
                    onClick={() => send()}
                    disabled={busy || !message.trim()}
                    aria-label="Enviar mensagem"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-muted-foreground mt-2 text-center text-[11px]">
                  Apoio clinico por IA; confirme as informacoes antes de tomar
                  decisoes. Anexos acumulados:{" "}
                  {formatBytes(firstPage?.attachmentBytes ?? 0)} de 50 MB.
                </p>
              </div>
            </footer>
          </>
        )}
      </section>
    </main>
  );
}
