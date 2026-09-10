"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  type SignInInput,
  type SignUpInput,
  signInSchema,
} from "~/schemas/auth";

import { createSupabaseClient } from "~/server/auth/supabase.server";

export async function signInAction(data: SignInInput) {
  const parsed = signInSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: "Dados inválidos." };
  }

  const { auth } = await createSupabaseClient(!parsed.data.rememberMe);

  const { error } = await auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        success: false,
        message: "Confirme seu email antes de fazer login.",
      };
    }
    return { success: false, message: "Credenciais inválidas." };
  }

  return { success: true, message: "Login realizado com sucesso!" };
}

export async function signUpAction(_input: SignUpInput) {
  return { success: false, message: "Ação indisponível no momento." };
}

export async function signOutAction() {
  const { auth } = await createSupabaseClient();
  await auth.signOut();

  revalidatePath("/", "layout");
  redirect("/auth");
}
