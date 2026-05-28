"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import {
  createDoctorBySuperAdminSchema,
  type CreateDoctorBySuperAdminInput,
} from "~/schemas/profile";
import { api } from "~/trpc/react";

export function SuperAdminCreateDoctorPage() {
  const utils = api.useUtils();
  const createDoctor = api.profile.createDoctorBySuperAdmin.useMutation({
    onSuccess: async (profile) => {
      toast.success(`Medico ${profile.name} cadastrado com sucesso`);
      await utils.profile.getAll.invalidate();
      form.reset({
        name: "",
        email: "",
        password: "",
        phone: "",
        emailConfirm: true,
      });
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar medico");
    },
  });

  const form = useForm<CreateDoctorBySuperAdminInput>({
    resolver: zodResolver(createDoctorBySuperAdminSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      emailConfirm: true,
    },
  });

  const errors = form.formState.errors;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold">Super Admin</h1>
            <p className="text-muted-foreground">
              Cadastre novos médicos com acesso à plataforma.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Novo médico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-5"
              onSubmit={form.handleSubmit((values) =>
                createDoctor.mutate(values),
              )}
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="doctor-name">Nome completo</Label>
                  <Input
                    id="doctor-name"
                    placeholder="Dra. Ana Silva"
                    {...form.register("name")}
                    disabled={createDoctor.isPending}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doctor-email">Email</Label>
                  <Input
                    id="doctor-email"
                    type="email"
                    placeholder="medico@clinica.com"
                    {...form.register("email")}
                    disabled={createDoctor.isPending}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doctor-phone">Telefone</Label>
                  <Input
                    id="doctor-phone"
                    placeholder="(11) 99999-9999"
                    {...form.register("phone")}
                    disabled={createDoctor.isPending}
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doctor-password">Senha temporária</Label>
                  <Input
                    id="doctor-password"
                    type="password"
                    placeholder="mínimo 8 caracteres"
                    {...form.register("password")}
                    disabled={createDoctor.isPending}
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              <label className="flex items-center justify-between gap-4 rounded-lg border p-4 text-sm">
                <span>
                  <span className="block font-medium">Confirmar email</span>
                  <span className="text-muted-foreground">
                    Cria o usuário no Supabase já liberado para login.
                  </span>
                </span>
                <Switch
                  checked={form.watch("emailConfirm")}
                  onCheckedChange={(checked) =>
                    form.setValue("emailConfirm", checked, {
                      shouldDirty: true,
                    })
                  }
                  disabled={createDoctor.isPending}
                />
              </label>

              <div className="flex justify-end">
                <Button type="submit" disabled={createDoctor.isPending}>
                  {createDoctor.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Cadastrar médico
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
