"use client";

import {
  Mail,
  Save,
  Loader2,
  MapPin,
  Camera,
  User,
  Phone,
  Coins,
} from "lucide-react";
import { useProfileForm } from "~/features/profile/hooks/useProfile";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Separator } from "~/components/ui/separator";
import { getInitials } from "~/features/layout/utils/getInitials";
import { maskCep, maskPhone } from "~/utils/masks";
import { ProfileFormSkeleton } from "~/features/profile/loading/skeleton";

export function ProfileForm() {
  const { form, profile, isLoading, isSaving, onSubmit } = useProfileForm();
  const { data: creditsBalance, isLoading: isCreditsLoading } =
    api.credits.getBalance.useQuery();

  const watchedPhotoUrl = form.watch("photoUrl");
  const displayPhoto = watchedPhotoUrl ?? profile?.photoUrl;
  const formattedCredits = isCreditsLoading
    ? "..."
    : (creditsBalance ?? 0).toLocaleString("pt-BR");

  if (isLoading) {
    return <ProfileFormSkeleton />;
  }

  return (
    <div className="w-full pb-6">
      <div className="w-full">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="border-border/50 overflow-hidden shadow-md">
              <div className="from-primary/20 via-primary/10 to-background h-32 w-full border-b bg-linear-to-r" />

              <CardContent className="relative px-6 pb-8">
                <div className="-mt-12 mb-8 flex flex-col items-end gap-6 md:flex-row">
                  <div className="group relative">
                    <Avatar className="border-card h-32 w-32 rounded-2xl border-4 shadow-xl">
                      <AvatarImage
                        src={displayPhoto ?? ""}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground rounded-2xl text-3xl">
                        {getInitials(profile?.name ?? "")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="absolute -right-2 -bottom-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="border-border h-9 w-9 rounded-full border shadow-md"
                        type="button"
                        onClick={() => form.setFocus("photoUrl")}
                        title="Alterar foto do perfil"
                        aria-label="Alterar foto do perfil"
                      >
                        <Camera className="text-muted-foreground h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-1 pb-2 text-center md:text-left">
                    <h2 className="text-2xl font-bold tracking-tight">
                      {profile?.name}
                    </h2>
                    <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm md:justify-start">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{profile?.email}</span>
                    </div>
                  </div>
                </div>

                <Separator className="mb-8" />

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="col-span-2">
                    <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold">
                      <User className="text-primary h-4 w-4" />
                      Dados Pessoais
                    </h3>
                    <p className="text-muted-foreground mb-4 text-sm">
                      Informações básicas de identificação.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Seu nome completo"
                            {...field}
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone / WhatsApp</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
                            <Input
                              placeholder="(00) 00000-0000"
                              {...field}
                              onChange={(e) =>
                                field.onChange(maskPhone(e.target.value))
                              }
                              maxLength={15}
                              className="bg-background pl-9"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        value={profile?.email ?? ""}
                        disabled
                        className="bg-muted/50"
                      />
                    </FormControl>
                    <FormDescription>
                      Para alterar seu email, entre em contato com o suporte.
                    </FormDescription>
                  </FormItem>

                  <FormField
                    control={form.control}
                    name="photoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Foto do perfil</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Camera className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
                            <Input
                              placeholder="https://exemplo.com/minha-foto.jpg"
                              {...field}
                              className="bg-background pl-9"
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Informe o endereço público de uma imagem.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid items-start gap-6 xl:grid-cols-[minmax(280px,0.7fr)_minmax(0,2fr)]">
              <Card className="border-border/50 shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                      <Coins className="text-primary h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Créditos</CardTitle>
                      <CardDescription>
                        Total de créditos disponíveis na sua conta.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold tracking-tight">
                      {formattedCredits}
                    </p>
                    <p className="text-muted-foreground pb-1 text-sm">
                      créditos
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                      <MapPin className="text-primary h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Endereço</CardTitle>
                      <CardDescription>
                        Localização para correspondências.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-12">
                    <div className="md:col-span-3">
                      <FormField
                        control={form.control}
                        name="address.zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="00000-000"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(maskCep(e.target.value))
                                }
                                maxLength={9}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="md:col-span-9">
                      <FormField
                        control={form.control}
                        name="address.street"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Logradouro</FormLabel>
                            <FormControl>
                              <Input placeholder="Rua, Avenida..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-3">
                      <FormField
                        control={form.control}
                        name="address.number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número</FormLabel>
                            <FormControl>
                              <Input placeholder="123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="md:col-span-9">
                      <FormField
                        control={form.control}
                        name="address.complement"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Complemento{" "}
                              <span className="text-muted-foreground text-xs font-normal">
                                (Opcional)
                              </span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Apto, Bloco..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-5">
                      <FormField
                        control={form.control}
                        name="address.neighborhood"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bairro</FormLabel>
                            <FormControl>
                              <Input placeholder="Bairro" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="md:col-span-5">
                      <FormField
                        control={form.control}
                        name="address.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade</FormLabel>
                            <FormControl>
                              <Input placeholder="Cidade" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="address.state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UF</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="UF"
                                maxLength={2}
                                className="uppercase"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-end gap-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => window.history.back()}
              >
                Cancelar
              </Button>
              <Button
                disabled={isSaving}
                type="submit"
                className="min-w-[150px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
