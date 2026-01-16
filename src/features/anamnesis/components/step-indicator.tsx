import { Check } from "lucide-react"

type Step = {
  number: number
  title: string
}

type StepIndicatorProps = {
  steps: Step[]
  currentStep: number
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                  currentStep >= step.number ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep > step.number ? <Check className="h-5 w-5" /> : step.number}
              </div>
              <span className="text-xs mt-2 text-center hidden md:block text-muted-foreground">{step.title}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 transition-colors ${currentStep > step.number ? "bg-primary" : "bg-muted"}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
