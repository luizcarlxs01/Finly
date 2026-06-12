export type ApiRuleProcessingResult = {
  financialProfileId: string;
  referenceDate: string;
  createdTransactionCount: number;
  skippedTransactionCount: number;
  processedRuleCount: number;
};
