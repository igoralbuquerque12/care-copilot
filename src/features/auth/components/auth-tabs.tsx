"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"

import { SignInForm } from "~/features/auth/components/sign-in-form"
import { SignUpForm } from "~/features/auth/components/sign-up-form"

export function AuthTabs() {
  return (
    <Tabs defaultValue="signin" className="w-full">
      <TabsList className="grid w-full grid-cols-2 h-auto">
        <TabsTrigger value="signin">Entrar</TabsTrigger>
        <TabsTrigger value="signup">Cadastrar</TabsTrigger>
      </TabsList>
      <TabsContent value="signin" className="mt-6">
        <SignInForm />
      </TabsContent>
      <TabsContent value="signup" className="mt-6">
        <SignUpForm />
      </TabsContent>
    </Tabs>
  )
}
