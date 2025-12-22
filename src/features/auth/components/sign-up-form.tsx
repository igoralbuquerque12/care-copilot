"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { signUpSchema, type SignUpInput } from "~/schemas/auth"
import { signUpAction } from "~/features/auth/actions/auth.actions"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { PasswordStrengthIndicator } from "./password-strength-indicator"
import { validatePassword } from "~/features/auth/helpers/password-validator"
import { toast } from "sonner"

export function SignUpForm() {
    const [isLoading, setIsLoading] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<SignUpInput>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    })

    const password = watch("password")

    const onSubmit = async (data: SignUpInput) => {
        const validation = validatePassword(data.password)
        if (!validation.isValid) {
            toast.error("A senha não atende aos requisitos de segurança.")
            return
        }

        setIsLoading(true)
        try {
            const result = await signUpAction(data)
            if (result.success) {
                toast.success(result.message)
            }
        } catch (error) {
            console.log("SignUp Error:", error)
            toast.error("Ocorreu um erro ao criar a conta. Tente novamente.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" type="text" placeholder="João Silva" {...register("name")} disabled={isLoading} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" placeholder="seu@email.com" {...register("email")} disabled={isLoading} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                    disabled={isLoading}
                />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                <PasswordStrengthIndicator password={password} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                    disabled={isLoading}
                />
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar conta
            </Button>
        </form>
    )
}
