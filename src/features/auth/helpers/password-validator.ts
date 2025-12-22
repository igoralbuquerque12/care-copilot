export interface PasswordValidation {
  hasMinLength: boolean
  hasNumber: boolean
  hasSpecialChar: boolean
  isValid: boolean
}

export function validatePassword(password: string): PasswordValidation {
  const hasMinLength = password.length >= 8
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  return {
    hasMinLength,
    hasNumber,
    hasSpecialChar,
    isValid: hasMinLength && hasNumber && hasSpecialChar,
  }
}

export const passwordRules = [
  { key: "hasMinLength", label: "Mínimo 8 caracteres" },
  { key: "hasNumber", label: "Pelo menos 1 número" },
  { key: "hasSpecialChar", label: "Pelo menos 1 caractere especial" },
] as const
