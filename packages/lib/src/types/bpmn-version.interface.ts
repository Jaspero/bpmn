export interface BPMNVersion {
  version: number;
  xml: string;
  createdOn?: number;
  lastUpdatedOn?: number;
  trigger?: string;
  triggerCondition?: string;
  active?: boolean;
}
