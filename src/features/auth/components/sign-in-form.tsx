"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { signInSchema, type SignInInput } from "~/schemas/auth"
import { signInAction } from "~/features/auth/actions/auth.actions"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Checkbox } from "~/components/ui/checkbox"
import { toast } from "sonner"

export function SignInForm() {
    const [isLoading, setIsLoading] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<SignInInput>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "",
            password: "",
            rememberMe: false,
        },
    })

    const rememberMe = watch("rememberMe")

    const onSubmit = async (data: SignInInput) => {
        setIsLoading(true)
        try {
            const result = await signInAction(data)
            if (result.success) {
                toast.success(result.message)
            }
        } catch (error) {
            console.log("SignIn Error:", error)
            toast.error("Ocorreu um erro ao fazer login. Tente novamente.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" {...register("email")} disabled={isLoading} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="••••••••" {...register("password")} disabled={isLoading} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="rememberMe"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setValue("rememberMe", checked as boolean)}
                        disabled={isLoading}
                    />
                    <Label htmlFor="rememberMe" className="cursor-pointer text-sm font-normal">
                        Lembrar de mim
                    </Label>
                </div>
                <Button variant="link" type="button" className="h-auto p-0 text-xs" disabled={isLoading}>
                    Esqueceu a senha?
                </Button>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar
            </Button>
        </form>
    )
}
