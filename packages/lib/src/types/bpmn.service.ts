import type {BPMNVersion} from './bpmn-version.interface';
import type {BPMN} from './bpmn.interface';

export interface BPMNService {
  list(lastToken?: any): Promise<BPMN[]>;

  get(id: string): Promise<BPMN>;

  create(
    item: {
      name: string;
      description?: string;   
    }
  ): Promise<{id: string}>;

  update(
    id: string,
    update: {
      name?: string;
      description?: string;
    }
  ): Promise<void>;

  delete(id: string): Promise<void>;

  getVersion(id: string, version: number): Promise<BPMNVersion>;

  createVersion(id: string, item: {xml: string}): Promise<void>;

  updateVersion(id: string, version: number, item: {xml: string}): Promise<void>;

  deleteVersion(id: string, version: number): Promise<void>;
}