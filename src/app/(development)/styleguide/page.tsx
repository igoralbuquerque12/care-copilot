"use client";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Switch } from "~/components/ui/switch";
import { Checkbox } from "~/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Progress } from "~/components/ui/progress";
import { Slider } from "~/components/ui/slider";
import { Separator } from "~/components/ui/separator";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { useTheme } from "next-themes";
import {
  Moon,
  Sun,
  Activity,
  Heart,
  Users,
  FileText,
  Calendar,
  Settings,
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function StyleguidePage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="bg-background min-h-screen">
      <header className="border-border bg-background/80 sticky top-0 z-50 border-b backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-lg">
                <Activity className="text-primary-foreground h-6 w-6" />
              </div>
              <div>
                <h1 className="text-foreground text-xl font-bold">
                  Care Copilot
                </h1>
                <p className="text-muted-foreground text-xs">Design System</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="mb-2 text-4xl font-bold text-balance">
              Sistema de Design Care Copilot
            </h2>
            <p className="text-muted-foreground max-w-3xl text-lg text-pretty">
              Componentes e padrões visuais para construir interfaces de suporte
              clínico confiáveis e profissionais.
            </p>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold">Paleta de Cores</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Primária</CardTitle>
                <CardDescription>
                  Verde água - Confiança e precisão clínica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="bg-primary h-20 w-full rounded-lg" />
                  <p className="text-muted-foreground font-mono text-xs">
                    bg-primary
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="bg-primary/80 h-20 w-full rounded-lg" />
                  <p className="text-muted-foreground font-mono text-xs">
                    bg-primary/80
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="bg-primary/60 h-20 w-full rounded-lg" />
                  <p className="text-muted-foreground font-mono text-xs">
                    bg-primary/60
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Secundária</CardTitle>
                <CardDescription>
                  Cinza suave - Elementos de suporte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="bg-secondary h-20 w-full rounded-lg" />
                  <p className="text-muted-foreground font-mono text-xs">
                    bg-secondary
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="bg-muted h-20 w-full rounded-lg" />
                  <p className="text-muted-foreground font-mono text-xs">
                    bg-muted
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="bg-accent h-20 w-full rounded-lg" />
                  <p className="text-muted-foreground font-mono text-xs">
                    bg-accent
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estados</CardTitle>
                <CardDescription>Feedback visual e alertas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="bg-destructive h-20 w-full rounded-lg" />
                  <p className="text-muted-foreground font-mono text-xs">
                    bg-destructive
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="border-border bg-background flex h-20 w-full items-center justify-center rounded-lg border-2">
                    <p className="text-muted-foreground text-sm font-medium">
                      Background
                    </p>
                  </div>
                  <p className="text-muted-foreground font-mono text-xs">
                    bg-background
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="bg-card flex h-20 w-full items-center justify-center rounded-lg">
                    <p className="text-card-foreground text-sm font-medium">
                      Card
                    </p>
                  </div>
                  <p className="text-muted-foreground font-mono text-xs">
                    bg-card
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-12" />

        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold">Tipografia</h2>
          <Card>
            <CardContent className="space-y-8 pt-6">
              <div>
                <p className="text-muted-foreground mb-2 text-xs font-medium">
                  Display / 4xl
                </p>
                <h1 className="text-4xl font-bold text-balance">
                  Suporte clínico inteligente
                </h1>
              </div>
              <div>
                <p className="text-muted-foreground mb-2 text-xs font-medium">
                  Heading / 3xl
                </p>
                <h2 className="text-3xl font-bold text-balance">
                  Automatize seu fluxo de trabalho
                </h2>
              </div>
              <div>
                <p className="text-muted-foreground mb-2 text-xs font-medium">
                  Title / 2xl
                </p>
                <h3 className="text-2xl font-semibold">
                  Gestão de pacientes simplificada
                </h3>
              </div>
              <div>
                <p className="text-muted-foreground mb-2 text-xs font-medium">
                  Subtitle / xl
                </p>
                <h4 className="text-xl font-semibold">
                  Prontuários eletrônicos integrados
                </h4>
              </div>
              <div>
                <p className="text-muted-foreground mb-2 text-xs font-medium">
                  Body / base
                </p>
                <p className="text-base leading-relaxed text-pretty">
                  O Care Copilot oferece automações inteligentes para médicos,
                  otimizando processos clínicos e melhorando o atendimento ao
                  paciente através de tecnologia de ponta.
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-2 text-xs font-medium">
                  Small / sm
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Informações complementares e metadados aparecem neste tamanho
                  de fonte.
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-2 text-xs font-medium">
                  Code / mono
                </p>
                <code className="bg-muted rounded px-2 py-1 font-mono text-sm">
                  const copilot = new CareCopilot()
                </code>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-12" />

        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold">Botões</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Variantes</CardTitle>
                <CardDescription>
                  Diferentes estilos para diferentes contextos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button>Primário</Button>
                  <Button variant="secondary">Secundário</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destrutivo</Button>
                  <Button variant="link">Link</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tamanhos</CardTitle>
                <CardDescription>
                  Adaptados para diferentes hierarquias
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Pequeno</Button>
                  <Button>Padrão</Button>
                  <Button size="lg">Grande</Button>
                  <Button size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Com Ícones</CardTitle>
                <CardDescription>Comunicação visual clara</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button>
                    <Activity className="mr-2 h-4 w-4" />
                    Novo Atendimento
                  </Button>
                  <Button variant="secondary">
                    <Calendar className="mr-2 h-4 w-4" />
                    Agendar
                  </Button>
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Prontuário
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estados</CardTitle>
                <CardDescription>Loading e desabilitado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button disabled>Desabilitado</Button>
                  <Button variant="secondary" disabled>
                    Desabilitado
                  </Button>
                  <Button variant="outline" disabled>
                    Desabilitado
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-12" />

        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold">Componentes de Formulário</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inputs & Labels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Paciente</Label>
                  <Input id="name" placeholder="Digite o nome completo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="paciente@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disabled">Campo Desabilitado</Label>
                  <Input
                    id="disabled"
                    disabled
                    placeholder="Campo desabilitado"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select & Dropdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Especialidade</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a especialidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cardio">Cardiologia</SelectItem>
                      <SelectItem value="ortho">Ortopedia</SelectItem>
                      <SelectItem value="neuro">Neurologia</SelectItem>
                      <SelectItem value="pedia">Pediatria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">Urgente</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Checkboxes & Radio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Sintomas</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox id="fever" />
                      <Label htmlFor="fever" className="font-normal">
                        Febre
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="cough" />
                      <Label htmlFor="cough" className="font-normal">
                        Tosse
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="fatigue" />
                      <Label htmlFor="fatigue" className="font-normal">
                        Fadiga
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Tipo de Consulta</Label>
                  <RadioGroup defaultValue="presencial">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="presencial" id="presencial" />
                      <Label htmlFor="presencial" className="font-normal">
                        Presencial
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="tele" id="tele" />
                      <Label htmlFor="tele" className="font-normal">
                        Telemedicina
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Switch & Slider</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications">Notificações</Label>
                  <Switch id="notifications" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-save">Auto-salvar</Label>
                  <Switch id="auto-save" defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label>Nível de Urgência</Label>
                  <Slider defaultValue={[50]} max={100} step={1} />
                </div>
                <div className="space-y-2">
                  <Label>Progresso do Tratamento</Label>
                  <Progress value={65} />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-12" />

        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold">Badges & Avatars</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Badges</CardTitle>
                <CardDescription>Status e categorização visual</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>Padrão</Badge>
                  <Badge variant="secondary">Secundário</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Crítico</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-green-500 text-white">Ativo</Badge>
                  <Badge className="bg-yellow-500 text-white">Pendente</Badge>
                  <Badge className="bg-blue-500 text-white">Em progresso</Badge>
                  <Badge className="bg-purple-500 text-white">Concluído</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Avatares</CardTitle>
                <CardDescription>Representação de usuários</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>DR</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      MC
                    </AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      JS
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>DR</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Dr. Ricardo Santos</p>
                    <p className="text-muted-foreground text-xs">
                      Cardiologista
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-12" />

        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold">Alertas & Notificações</h2>
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Informação</AlertTitle>
              <AlertDescription>
                Esta é uma mensagem informativa para o usuário sobre o sistema.
              </AlertDescription>
            </Alert>

            <Alert className="border-green-500/50 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Sucesso</AlertTitle>
              <AlertDescription>
                Operação concluída com sucesso. Os dados foram salvos
                corretamente.
              </AlertDescription>
            </Alert>

            <Alert className="border-yellow-500/50 text-yellow-600 dark:text-yellow-400">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Atenção</AlertTitle>
              <AlertDescription>
                Existem campos obrigatórios que precisam ser preenchidos antes
                de continuar.
              </AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>
                Não foi possível processar a solicitação. Por favor, tente
                novamente.
              </AlertDescription>
            </Alert>
          </div>
        </section>

        <Separator className="my-12" />

        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold">Cards & Navegação</h2>
          <div className="space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="patients">Pacientes</TabsTrigger>
                <TabsTrigger value="schedule">Agenda</TabsTrigger>
                <TabsTrigger value="reports">Relatórios</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">
                        Pacientes Ativos
                      </CardTitle>
                      <Users className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">142</div>
                      <p className="text-muted-foreground text-xs">
                        +12% desde o mês passado
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">
                        Consultas Hoje
                      </CardTitle>
                      <Calendar className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">24</div>
                      <p className="text-muted-foreground text-xs">
                        8 pendentes
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">
                        Taxa de Satisfação
                      </CardTitle>
                      <Heart className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">98%</div>
                      <p className="text-muted-foreground text-xs">
                        +2% desde o mês passado
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="patients">
                <Card>
                  <CardHeader>
                    <CardTitle>Buscar paciente</CardTitle>
                    <CardDescription>
                      Gerencie seus pacientes ativos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      Conteúdo da Buscar paciente...
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="schedule">
                <Card>
                  <CardHeader>
                    <CardTitle>Agenda</CardTitle>
                    <CardDescription>
                      Visualize e gerencie seus compromissos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      Conteúdo da agenda...
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="reports">
                <Card>
                  <CardHeader>
                    <CardTitle>Relatórios</CardTitle>
                    <CardDescription>
                      Análises e métricas do seu consultório
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      Conteúdo dos relatórios...
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        <Separator className="my-12" />

        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold">Iconografia</h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ícones Lucide</CardTitle>
              <CardDescription>
                Biblioteca de ícones consistente e profissional
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-6 md:grid-cols-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                    <Activity className="text-primary h-6 w-6" />
                  </div>
                  <span className="text-muted-foreground text-xs">
                    Activity
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                    <Heart className="text-primary h-6 w-6" />
                  </div>
                  <span className="text-muted-foreground text-xs">Heart</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                    <Users className="text-primary h-6 w-6" />
                  </div>
                  <span className="text-muted-foreground text-xs">Users</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                    <Calendar className="text-primary h-6 w-6" />
                  </div>
                  <span className="text-muted-foreground text-xs">
                    Calendar
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                    <FileText className="text-primary h-6 w-6" />
                  </div>
                  <span className="text-muted-foreground text-xs">
                    FileText
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                    <Settings className="text-primary h-6 w-6" />
                  </div>
                  <span className="text-muted-foreground text-xs">
                    Settings
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                    <Bell className="text-primary h-6 w-6" />
                  </div>
                  <span className="text-muted-foreground text-xs">Bell</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                    <CheckCircle2 className="text-primary h-6 w-6" />
                  </div>
                  <span className="text-muted-foreground text-xs">Check</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <footer className="border-border mt-16 border-t pt-8">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Care Copilot Design System © 2025
            </p>
            <Badge variant="outline">v1.0.0</Badge>
          </div>
        </footer>
      </main>
    </div>
  );
}
