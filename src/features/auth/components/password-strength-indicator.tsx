"use client"

import { Check, X } from "lucide-react"
import { passwordRules, validatePassword } from "~/features/auth/helpers/password-validator"

interface PasswordStrengthIndicatorProps {
  password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const validation = validatePassword(password)

  if (!password) return null

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs font-medium text-muted-foreground">Requisitos da senha:</p>
      <ul className="space-y-1.5">
        {passwordRules.map((rule) => {
          const isValid = validation[rule.key]
          return (
            <li
              key={rule.key}
              className={`flex items-center gap-2 text-xs transition-colors ${
                isValid ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {isValid ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
              <span>{rule.label}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
