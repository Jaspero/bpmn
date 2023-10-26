export interface BPMN {
  id: string;
  name: string;
  version: number;
  createdOn: number;
  lastUpdatedOn: number;
  latestTrigger?: string;
  description?: string;
}
