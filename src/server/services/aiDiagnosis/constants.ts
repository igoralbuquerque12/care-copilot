export const BASE_PROMPT_VERSION = "clinical-analysis-v2";

export const ANALYSIS_JSON_SHAPE = `{
  "summary": "string",
  "longitudinalComparison": {
    "overview": "string",
    "changes": [{"field":"string","currentValue":"string","previousValue":"string|null","previousDate":"YYYY-MM-DD|null","interpretation":"string"}]
  },
  "physicianReview": [{"subject":"string","physicianEntry":"string","assessment":"AGREEMENT|REVIEW|INSUFFICIENT_DATA","rationale":"string"}],
  "aiDiagnosis": {"primary":"string","differentials":["string"]},
  "riskAlerts": [{"title":"string","severity":"LOW|MEDIUM|HIGH","rationale":"string"}],
  "suggestedNextSteps": [{"action":"string","rationale":"string"}],
  "missingQuestions": [{"question":"string","reason":"string","priority":"LOW|MEDIUM|HIGH"}],
  "evidence": [{"date":"YYYY-MM-DD","field":"string","note":"string"}],
  "confidence": {"score":0,"level":"LOW|MEDIUM|HIGH","rationale":"string","supportingFactors":["string"],"limitingFactors":["string"]},
  "historyCoverage": {"totalAnamneses":0,"representedAnamneses":0,"totalFields":0,"representedFields":0,"truncatedFields":0}
}`;
