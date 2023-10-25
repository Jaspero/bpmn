import type { BPMNVersion } from '../../../dist/lib/types/BPMN-version.interface';
import type { BPMN } from '../../../dist/lib/types/BPMN.interface';
import type { BPMNService } from '../../../dist/lib/types/BPMN.service';
import type { BPMNTrigger } from '../../../dist/lib/types/bpmn-trigger.interface';

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
				configFields: [
					{
						component: 'jp-select',
						field: '/method',
						options: {
							label: 'Method',
							options: [
								{label: 'GET', value: 'GET'},
								{label: 'POST', value: 'POST'},
								{label: 'PUT', value: 'PUT'},
								{label: 'PATCH', value: 'PATCH'},
								{label: 'DELETE', value: 'DELETE'},
							]
						}
					},
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
}
