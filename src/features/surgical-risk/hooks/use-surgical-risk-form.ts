import { api } from "~/trpc/react";
import type { CreateSurgicalRiskInput } from "~/schemas/surgical-risk";

const INFERRED_LABEL: Record<string, string> = {
  hasIschemicHeartDisease: "Doença Isquêmica Cardíaca",
  hasCongestiveHeartFailure: "ICC",
  isInsulinDependent: "Diabetes Insulino-dependente",
};

/**
 * Hook que orquestra o carregamento de dados, pré-preenchimento por inferência
 * e as mutations de criação/atualização do risco cirúrgico.
 */
export function useSurgicalRiskForm(anamnesisId: string) {
  const utils = api.useUtils();

  const { data: existingRisk, isLoading: isLoadingExisting } =
    api.surgicalRisk.getByAnamnesisId.useQuery({ anamnesisId });

  const { data: inferred, isLoading: isLoadingInference } =
    api.surgicalRisk.inferFromAnamnesis.useQuery(
      { anamnesisId },
      {
        enabled: !existingRisk && !isLoadingExisting,
      },
    );

  const wasInferred = inferred?.wasInferred ?? false;
  const inferredFields = (inferred?.inferredFields ?? [])
    .map((f) => INFERRED_LABEL[f] ?? f)
    .filter(Boolean);

  const defaultValues: CreateSurgicalRiskInput = existingRisk
    ? {
        anamnesisId,
        surgeryName: existingRisk.surgeryName,
        isHighRiskSurgery: existingRisk.isHighRiskSurgery,
        hasIschemicHeartDisease: existingRisk.hasIschemicHeartDisease,
        hasCongestiveHeartFailure: existingRisk.hasCongestiveHeartFailure,
        hasCerebrovascularDisease: existingRisk.hasCerebrovascularDisease,
        isInsulinDependent: existingRisk.isInsulinDependent,
        hasElevatedCreatinine: existingRisk.hasElevatedCreatinine,
        asaClass: existingRisk.asaClass as CreateSurgicalRiskInput["asaClass"] ?? undefined,
        mets: existingRisk.mets ?? undefined,
        recommendation: existingRisk.recommendation ?? undefined,
        isCleared: existingRisk.isCleared,
      }
    : {
        anamnesisId,
        surgeryName: "",
        isHighRiskSurgery: inferred?.isHighRiskSurgery ?? false,
        hasIschemicHeartDisease: inferred?.hasIschemicHeartDisease ?? false,
        hasCongestiveHeartFailure: inferred?.hasCongestiveHeartFailure ?? false,
        hasCerebrovascularDisease: inferred?.hasCerebrovascularDisease ?? false,
        isInsulinDependent: inferred?.isInsulinDependent ?? false,
        hasElevatedCreatinine: inferred?.hasElevatedCreatinine ?? false,
        isCleared: true,
      };

  const createMutation = api.surgicalRisk.create.useMutation({
    onSuccess: async () => {
      await utils.surgicalRisk.getByAnamnesisId.invalidate({ anamnesisId });
    },
  });

  const updateMutation = api.surgicalRisk.update.useMutation({
    onSuccess: async () => {
      await utils.surgicalRisk.getByAnamnesisId.invalidate({ anamnesisId });
    },
  });

  return {
    existingRisk,
    defaultValues,
    wasInferred,
    inferredFields,
    isLoadingInference: isLoadingInference || isLoadingExisting,
    createMutation,
    updateMutation,
  };
}
