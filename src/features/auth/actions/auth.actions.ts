"use server"

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
    type SignInInput,
    type SignUpInput,
    signInSchema,
    signUpSchema
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
            return { success: false, message: "Confirme seu email antes de fazer login." };
        }
        return { success: false, message: "Credenciais inválidas." };
    }

    return { success: true, message: "Login realizado com sucesso!" };
}

export async function signUpAction(input: SignUpInput) {
    const parsed = signUpSchema.safeParse(input);

    if (!parsed.success) {
        return { success: false, message: "Dados inválidos." };
    }

    const { auth } = await createSupabaseClient();

    try {
        const { error } = await auth.signUp({
            email: parsed.data.email,
            password: parsed.data.password,
            options: {
                data: {
                    name: parsed.data.name,
                },
            },
        });

        if (error) {
            console.error("Supabase Register Error:", error);
            return { success: false, message: "Erro ao criar conta. Tente novamente." };
        }

        return { success: true, message: "Conta criada com sucesso! Verifique seu email." };

    } catch (error) {
        console.error("[signUpAction]: ", error);
        return { success: false, message: "Ocorreu um erro inesperado. Tente novamente." };
    }
}

export async function signOutAction() {
    const { auth } = await createSupabaseClient();
    await auth.signOut();

    revalidatePath("/", "layout");
    redirect("/auth");
}
