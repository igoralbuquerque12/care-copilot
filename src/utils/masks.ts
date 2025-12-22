export const maskPhone = (value: string) => {
  if (!value) return ""
  
  return value
    .replace(/[\D]/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2') 
    .replace(/(-\d{4})(\d+?)$/, '$1')
}

export const maskCep = (value: string) => {
  if (!value) return ""
  
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{5})(\d)/, "$1-$2")
    .slice(0, 9)
}