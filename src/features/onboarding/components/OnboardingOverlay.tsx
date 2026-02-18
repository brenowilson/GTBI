import { useState, useCallback } from "react";
import {
  Rocket,
  Store,
  LayoutGrid,
  HelpCircle,
  ChevronRight,
  SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/cn";

interface OnboardingOverlayProps {
  onComplete: () => void;
}

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  details?: string[];
  buttonLabel: string;
}

const STEPS: OnboardingStep[] = [
  {
    icon: <Rocket className="h-16 w-16 text-primary" />,
    title: "Bem-vindo ao GTBI!",
    description:
      "Plataforma de inteligência de negócios da GT Consultoria para restaurantes iFood.",
    details: [
      "Acompanhe a performance dos restaurantes gerenciados",
      "Visualize relatórios completos em tempo real",
      "Gerencie avaliações, chamados e financeiro",
    ],
    buttonLabel: "Próximo",
  },
  {
    icon: <Store className="h-16 w-16 text-primary" />,
    title: "Selecione um restaurante",
    description:
      "O GTBI é organizado por restaurante. Use o seletor no topo da página para alternar entre os estabelecimentos gerenciados.",
    details: [
      "Cada restaurante tem dados independentes",
      "Alterne rapidamente entre restaurantes",
      "Dados sempre atualizados via iFood",
    ],
    buttonLabel: "Próximo",
  },
  {
    icon: <LayoutGrid className="h-16 w-16 text-primary" />,
    title: "Explore os módulos",
    description:
      "O GTBI oferece módulos completos para gerenciar os restaurantes:",
    details: [
      "Performance — Métricas e KPIs em tempo real",
      "Relatórios — Análises detalhadas e exportáveis",
      "Avaliações — Acompanhe o feedback dos clientes",
      "Chamados — Gerencie solicitações e problemas",
      "Financeiro — Controle receitas e despesas",
      "Cardápio — Gerencie produtos e imagens",
    ],
    buttonLabel: "Próximo",
  },
  {
    icon: <HelpCircle className="h-16 w-16 text-primary" />,
    title: "Precisa de ajuda?",
    description:
      "Se tiver dúvidas, acesse a Central de Ajuda pelo menu lateral. Lá você encontra guias, tutoriais e suporte.",
    details: [
      "Guias passo a passo para cada módulo",
      "Perguntas frequentes respondidas",
      "Suporte técnico quando precisar",
    ],
    buttonLabel: "Começar",
  },
];

const TOTAL_STEPS = STEPS.length;

export function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isAnimating, setIsAnimating] = useState(false);

  const goToStep = useCallback(
    (nextStep: number) => {
      if (isAnimating) return;

      setDirection(nextStep > currentStep ? "forward" : "backward");
      setIsAnimating(true);

      // Brief delay for exit animation before changing step
      setTimeout(() => {
        setCurrentStep(nextStep);
        // Allow enter animation to play
        setTimeout(() => {
          setIsAnimating(false);
        }, 50);
      }, 200);
    },
    [currentStep, isAnimating]
  );

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      goToStep(currentStep + 1);
    } else {
      onComplete();
    }
  }, [currentStep, goToStep, onComplete]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const step = STEPS[currentStep] as OnboardingStep;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="mx-4 flex w-full max-w-lg flex-col items-center">
        {/* Skip button */}
        <div className="mb-4 flex w-full justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground"
          >
            <SkipForward className="mr-1 h-4 w-4" />
            Pular
          </Button>
        </div>

        {/* Card */}
        <div
          className={cn(
            "w-full rounded-xl border border-border bg-card p-8 shadow-elevated transition-all duration-200",
            isAnimating && direction === "forward" &&
              "translate-x-4 opacity-0",
            isAnimating && direction === "backward" &&
              "-translate-x-4 opacity-0",
            !isAnimating && "translate-x-0 opacity-100"
          )}
        >
          {/* Icon */}
          <div className="mb-6 flex justify-center">{step.icon}</div>

          {/* Title */}
          <h2 className="mb-3 text-center text-2xl font-bold tracking-tight">
            {step.title}
          </h2>

          {/* Description */}
          <p className="mb-4 text-center text-sm leading-relaxed text-muted-foreground">
            {step.description}
          </p>

          {/* Details list */}
          {step.details && (
            <ul className="mb-6 space-y-2">
              {step.details.map((detail, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-1 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  {detail}
                </li>
              ))}
            </ul>
          )}

          {/* Action button */}
          <Button onClick={handleNext} className="w-full" size="lg">
            {step.buttonLabel}
            {currentStep < TOTAL_STEPS - 1 && (
              <ChevronRight className="ml-1 h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Progress dots */}
        <div className="mt-6 flex items-center gap-2">
          {STEPS.map((_, index) => (
            <button
              key={index}
              onClick={() => goToStep(index)}
              aria-label={`Ir para passo ${index + 1}`}
              className={cn(
                "h-2.5 rounded-full transition-all duration-300",
                index === currentStep
                  ? "w-8 bg-primary"
                  : "w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>

        {/* Step counter */}
        <p className="mt-3 text-xs text-muted-foreground">
          {currentStep + 1} de {TOTAL_STEPS}
        </p>
      </div>
    </div>
  );
}
