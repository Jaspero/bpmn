import type { BPMNVersion } from '../../../dist/lib/types/BPMN-version.interface';
import type { BPMN } from '../../../dist/lib/types/BPMN.interface';
import type { BPMNService } from '../../../dist/lib/types/BPMN.service';
import type { BPMNTestData } from '../../../dist/lib/types/bpmn-test-data.interface';
import type { BPMNTrigger } from '../../../dist/lib/types/bpmn-trigger.interface';
import type { BPMNTestRunOutput } from '../../../dist/lib/types/bpmn-test-run-output.interface';
import {random} from '@jaspero/utils';

const mockItems = [
  {
    id: Date.now().toString(),
    name: 'foo',
    version: 1,
    createdOn: Date.now(),
    lastUpdatedOn: Date.now()
  },
  {
    id: Date.now().toString(),
    name: 'bar',
    version: 1,
    createdOn: Date.now(),
    lastUpdatedOn: Date.now()
  }
];

const mockVersion = [
  {
    version: 1,
    xml: `<?xml version="1.0" encoding="UTF-8"?>
		<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1364q8u" targetNamespace="http://bpmn.io/schema/bpmn" exporter="bpmn-js (https://demo.bpmn.io)" exporterVersion="14.0.0">
			<bpmn:process id="Process_09gn1ie" isExecutable="false">
				<bpmn:startEvent id="StartEvent_0fb8abs">
					<bpmn:outgoing>Flow_13bpc91</bpmn:outgoing>
				</bpmn:startEvent>
				<bpmn:exclusiveGateway id="Gateway_0js4015">
					<bpmn:incoming>Flow_13bpc91</bpmn:incoming>
					<bpmn:outgoing>Flow_0kdx9un</bpmn:outgoing>
				</bpmn:exclusiveGateway>
				<bpmn:sequenceFlow id="Flow_13bpc91" sourceRef="StartEvent_0fb8abs" targetRef="Gateway_0js4015" />
				<bpmn:task id="Activity_0rbkp5z">
					<bpmn:incoming>Flow_0kdx9un</bpmn:incoming>
					<bpmn:outgoing>Flow_117nzam</bpmn:outgoing>
				</bpmn:task>
				<bpmn:sequenceFlow id="Flow_0kdx9un" sourceRef="Gateway_0js4015" targetRef="Activity_0rbkp5z" />
				<bpmn:endEvent id="Event_1y4vya5">
					<bpmn:incoming>Flow_117nzam</bpmn:incoming>
				</bpmn:endEvent>
				<bpmn:sequenceFlow id="Flow_117nzam" sourceRef="Activity_0rbkp5z" targetRef="Event_1y4vya5" />
			</bpmn:process>
			<bpmndi:BPMNDiagram id="BPMNDiagram_1">
				<bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_09gn1ie">
					<bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_0fb8abs">
						<dc:Bounds x="156" y="82" width="36" height="36" />
					</bpmndi:BPMNShape>
					<bpmndi:BPMNShape id="Gateway_0js4015_di" bpmnElement="Gateway_0js4015" isMarkerVisible="true">
						<dc:Bounds x="245" y="75" width="50" height="50" />
					</bpmndi:BPMNShape>
					<bpmndi:BPMNShape id="Activity_0rbkp5z_di" bpmnElement="Activity_0rbkp5z">
						<dc:Bounds x="350" y="60" width="100" height="80" />
					</bpmndi:BPMNShape>
					<bpmndi:BPMNShape id="Event_1y4vya5_di" bpmnElement="Event_1y4vya5">
						<dc:Bounds x="512" y="82" width="36" height="36" />
					</bpmndi:BPMNShape>
					<bpmndi:BPMNEdge id="Flow_13bpc91_di" bpmnElement="Flow_13bpc91">
						<di:waypoint x="192" y="100" />
						<di:waypoint x="245" y="100" />
					</bpmndi:BPMNEdge>
					<bpmndi:BPMNEdge id="Flow_0kdx9un_di" bpmnElement="Flow_0kdx9un">
						<di:waypoint x="295" y="100" />
						<di:waypoint x="350" y="100" />
					</bpmndi:BPMNEdge>
					<bpmndi:BPMNEdge id="Flow_117nzam_di" bpmnElement="Flow_117nzam">
						<di:waypoint x="450" y="100" />
						<di:waypoint x="512" y="100" />
					</bpmndi:BPMNEdge>
				</bpmndi:BPMNPlane>
			</bpmndi:BPMNDiagram>
		</bpmn:definitions>`
  }
];

export class MockBPMNService implements BPMNService {
  async list(lastToken?: any): Promise<BPMN[]> {
    return mockItems;
  }
  async get(id: string): Promise<BPMN> {
    return mockItems[0];
  }
  async create(item: { name: string; description?: string | undefined }): Promise<{ id: string }> {
    return { id: Date.now().toString() };
  }
  async update(
    id: string,
    update: { name?: string | undefined; description?: string | undefined }
  ): Promise<void> {
    return;
  }
  async delete(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return;
  }
  async getVersions(id: string): Promise<number[]> {
    return [1, 2, 3];
  }
  async getVersion(id: string, version: number): Promise<BPMNVersion> {
    return mockVersion[0];
  }
  async createVersion(id: string, item: { xml: string }): Promise<void> {
    return;
  }
  async updateVersion(id: string, version: number, item: { xml: string }): Promise<void> {
    console.log(item.xml);
    return;
  }
  async deleteVersion(id: string, version: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return;
  }

  async getDMNs(): Promise<Array<{ id: string; name: string; versions: number[] }>> {
    return [
      { name: '123', id: '11', versions: [1, 3] },
      { name: '44423', id: '11323', versions: [1] }
    ];
  }

  getServices(): Promise<BPMNModelService[]> {
    return [
      {
        name: 'HTTP',
        id: 'http',
        url: 'testurl.com',
        image: `<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="800" height="800" viewBox="0 0 512 512"><circle cx="256" cy="256" r="256" style="fill:#32bea6"/><path d="M58.016 202.296h18.168v42.48h.296c2.192-3.368 5.128-6.152 8.936-8.2 3.512-2.056 7.76-3.224 12.304-3.224 12.16 0 24.896 8.064 24.896 30.912v42.04H104.6v-39.992c0-10.4-3.808-18.168-13.776-18.168-7.032 0-12.008 4.688-13.912 10.112-.584 1.472-.728 3.368-.728 5.424v42.624H58.016V202.296zM161.76 214.6v20.368h17.144v13.48H161.76v31.496c0 8.64 2.344 13.176 9.224 13.176 3.08 0 5.424-.44 7.032-.872l.296 13.768c-2.64 1.032-7.328 1.768-13.04 1.768-6.584 0-12.16-2.2-15.52-5.856-3.816-4.112-5.568-10.544-5.568-19.92v-33.544h-10.248V234.96h10.248v-16.12l17.576-4.24zm51.432 0v20.368h17.144v13.48h-17.144v31.496c0 8.64 2.344 13.176 9.224 13.176 3.08 0 5.424-.44 7.032-.872l.296 13.768c-2.64 1.032-7.328 1.768-13.04 1.768-6.584 0-12.16-2.2-15.52-5.856-3.816-4.112-5.568-10.544-5.568-19.92v-33.544h-10.248V234.96h10.248v-16.12l17.576-4.24zm30.792 44.088c0-9.376-.296-16.992-.592-23.728h15.832l.872 10.984h.296c5.264-8.056 13.616-12.6 24.464-12.6 16.408 0 30.024 14.064 30.024 36.328 0 25.784-16.256 38.232-32.512 38.232-8.936 0-16.408-3.808-20.072-9.512H262v36.904h-18.016v-76.608zM262 276.416c0 1.76.144 3.368.584 4.976 1.76 7.328 8.2 12.6 15.824 12.6 11.424 0 18.168-9.52 18.168-23.584 0-12.592-6.16-22.848-17.728-22.848-7.472 0-14.36 5.424-16.112 13.336-.448 1.464-.736 3.072-.736 4.536v10.984zm65.504-29.296c0-6.744 4.688-11.568 11.136-11.568 6.592 0 10.984 4.832 11.136 11.568 0 6.592-4.392 11.432-11.136 11.432-6.592 0-11.136-4.84-11.136-11.432zm0 49.368c0-6.744 4.688-11.576 11.136-11.576 6.592 0 10.984 4.688 11.136 11.576 0 6.448-4.392 11.424-11.136 11.424-6.592 0-11.136-4.976-11.136-11.424zM355.8 312.16l35.744-106.2h12.6l-35.752 106.2H355.8zm49.376 0 35.744-106.2h12.592l-35.728 106.2h-12.608z" style="fill:#fff"/></svg>`,
        configFields: [
          {
            component: 'jp-input',
            field: '/url',
            options: {
              label: 'URL',
              type: 'url'
            }
          },
          {
            component: 'jp-select',
            field: '/method',
            options: {
              label: 'Method',
              options: [
                { label: 'GET', value: 'GET' },
                { label: 'POST', value: 'POST' },
                { label: 'PUT', value: 'PUT' },
                { label: 'PATCH', value: 'PATCH' },
                { label: 'DELETE', value: 'DELETE' }
              ]
            }
          },
          {
            component: 'jp-json-editor',
            field: '/headers',
            options: {
              label: 'Headers'
            }
          },
          {
            component: 'jp-json-editor',
            field: '/body',
            options: {
              label: 'Body'
            }
          }
        ]
      },
      {
        name: 'DMN',
        id: 'dmn',
        url: 'testurl2.com'
      }
    ];
  }

  async getTriggers(): Promise<BPMNTrigger[]> {
    return [
      {
        id: 'document-created',
        name: 'Document Created',
        description: `Triggered when a new document is created.`,
        versions: [1, 2]
      },
      {
        id: 'document-deleted',
        name: 'Document Deleted',
        description: `Triggered when a document is deleted.`,
        versions: [2, 3]
      }
    ];
  }

  async getTestData(bpmnId: string): Promise<BPMNTestData[]> {
    return [
      {
        id: '1',
        name: 'First Set',
        lastUpdatedOn: Date.now(),
        data: {
          name: 'John',
          age: 10
        }
      },
      {
        id: '2',
        name: 'Set Two',
        lastUpdatedOn: Date.now(),
        data: {
          name: 'Steven',
          age: 20
        }
      }
    ];
  }

  async createTestData(bpmnId: string, data: {name: string; data: any;}): Promise<BPMNTestData> {
    return {
      ...data,
      lastUpdatedOn: Date.now(),
      id: random.string(24)
    }
  }

  async updateTestData(bpmnId: string, dataId: string, data: any): Promise<void> {
    return;
  }

  async deleteTestData(bpmnId: string, dataId: string): Promise<void> {
    return;
  }

  async testRun(model: string, data: any): Promise<BPMNTestRunOutput> {
    return {
      duration: 2000,
      output: {
        name: 'Stuffy Stuffers'
      }
    };
  }
}
