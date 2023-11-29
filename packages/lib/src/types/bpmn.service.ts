import type { BPMNModelService } from './bpmn-model-service.interface';
import type { BPMNTag } from './bpmn-tag.interface';
import type { BPMNTestData } from './bpmn-test-data.interface';
import type { BPMNTestRunOutput } from './bpmn-test-run-output.interface';
import type { BPMNTrigger } from './bpmn-trigger.interface';
import type { BPMNVersion } from './bpmn-version.interface';
import type { BPMN } from './bpmn.interface';

export interface BPMNService {
  list(lastToken?: any): Promise<BPMN[]>;

  get(id: string): Promise<BPMN>;

  create(item: { name: string; description?: string }): Promise<{ id: string }>;

  update(
    id: string,
    update: {
      name?: string;
      description?: string;
    }
  ): Promise<void>;

  delete(id: string): Promise<void>;

  getDMNs(): Promise<Array<{ id: string; name: string; versions: number[] }>>;

  getServices(): Promise<BPMNModelService[]>;

  getTriggers(): Promise<BPMNTrigger[]>;

  getVersions(id: string): Promise<number[]>;

  getVersion(id: string, version: number): Promise<BPMNVersion>;

  createVersion(
    id: string,
    item: {
      xml: string;
      trigger?: string;
      triggerCondition?: string;
    }
  ): Promise<void>;

  updateVersion(
    id: string,
    version: number,
    item: {
      xml?: string;
      trigger?: string;
      triggerCondition?: string;
      active: boolean;
    }
  ): Promise<void>;

  deleteVersion(id: string, version: number): Promise<void>;

  getTestData(bpmnId: string): Promise<BPMNTestData[]>;

  createTestData(bpmnId: string, data: {name: string; data: any}): Promise<BPMNTestData>;

  updateTestData(bpmnId: string, dataId: string, data: {name: string; data: any}): Promise<void>;

  deleteTestData(bpmnId: string, dataId: string): Promise<void>;

  testRun(model: string, data: any): Promise<BPMNTestRunOutput>;

  getTags(): Promise<BPMNTag[]>;
}
