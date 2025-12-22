"use client";

import {
  Mail,
  Save,
  Loader2,
  MapPin,
  Camera,
  User,
  Phone,
} from "lucide-react";
import { useProfileForm } from "~/features/profile/hooks/useProfile";
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

  const watchedPhotoUrl = form.watch("photoUrl");
  const displayPhoto = watchedPhotoUrl ?? profile?.photoUrl;

  if (isLoading) {
    return <ProfileFormSkeleton />;
  }

  return (
    <div className="min-h-screen pb-10">
      <div className="max-w-7xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <Card className="overflow-hidden border-border/50 shadow-md">
              
              <div className="h-32 w-full bg-linear-to-r from-primary/20 via-primary/10 to-background border-b" />

              <CardContent className="relative px-6 pb-8">
                <div className="flex flex-col md:flex-row items-end -mt-12 mb-8 gap-6">
                  <div className="relative group">
                    <Avatar className="h-32 w-32 border-4 border-card shadow-xl rounded-2xl">
                      <AvatarImage src={displayPhoto ?? ""} className="object-cover" />
                      <AvatarFallback className="text-3xl bg-primary text-primary-foreground rounded-2xl">
                        {getInitials(profile?.name ?? "")}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="absolute -bottom-2 -right-2">
                        <Button size="icon" variant="secondary" className="rounded-full shadow-md h-9 w-9 border border-border" type="button">
                            <Camera className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-1 pb-2 text-center md:text-left">
                    <h2 className="text-2xl font-bold tracking-tight">{profile?.name}</h2>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground text-sm">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{profile?.email}</span>
                    </div>
                  </div>
                </div>

                <Separator className="mb-8" />

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="col-span-2">
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-primary" />
                            Dados Pessoais
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
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
                            <Input placeholder="Seu nome completo" {...field} className="bg-background" />
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
                                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="(00) 00000-0000" 
                                    {...field} 
                                    onChange={(e) => field.onChange(maskPhone(e.target.value))}
                                    maxLength={15}
                                    className="pl-9 bg-background"
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
                            <Input value={profile?.email ?? ""} disabled className="bg-muted/50" />
                        </FormControl>
                        <FormDescription>
                            Para alterar seu email, entre em contato com o suporte.
                        </FormDescription>
                    </FormItem>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">Endereço</CardTitle>
                        <CardDescription>Localização para correspondências.</CardDescription>
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
                                onChange={(e) => field.onChange(maskCep(e.target.value))}
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
                            <FormLabel>Complemento <span className="text-muted-foreground text-xs font-normal">(Opcional)</span></FormLabel>
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
                              <Input placeholder="UF" maxLength={2} className="uppercase" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>

                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-4">
                <Button variant="outline" type="button" onClick={() => window.history.back()}>
                    Cancelar
                </Button>
                <Button disabled={isSaving} type="submit" className="min-w-[150px]">
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