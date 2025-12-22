"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { type UpdateProfileInput, updateProfileSchema } from "~/schemas/profile";
import { api } from "~/trpc/react";
import { useMemo } from "react";

export function useProfileForm() {
  const { data: profile, isLoading, refetch } = api.profile.get.useQuery(undefined, {
    refetchOnWindowFocus: false, 
  });
  
  const updateMutation = api.profile.update.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      void refetch();
    },
    onError: () => {
      toast.error("Houve um erro ao atualizar o perfil");
    },
  });

  const formValues = useMemo(() => {
    if (!profile) return undefined;
    
    return {
       name: profile.name,
       phone: profile.phone ?? "",
       photoUrl: profile.photoUrl ?? "",
       address: {
         zipCode: profile.address?.zipCode ?? "",
         street: profile.address?.street ?? "",
         number: profile.address?.number ?? "",
         complement: profile.address?.complement ?? "",
         neighborhood: profile.address?.neighborhood ?? "",
         city: profile.address?.city ?? "",
         state: profile.address?.state ?? "",
         country: profile.address?.country ?? "",
       },
    };
  }, [profile]);

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    values: formValues, 

    defaultValues: {
      name: "",
      phone: "",
      photoUrl: "",
      address: { zipCode: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "", country: "" },
    },
  });

  const onSubmit = (values: UpdateProfileInput) => {
    updateMutation.mutate(values);
  };

  return {
    form,
    profile,
    isLoading,
    isSaving: updateMutation.isPending,
    onSubmit,
  };
}