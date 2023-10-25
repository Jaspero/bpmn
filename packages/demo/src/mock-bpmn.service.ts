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
		<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC" xmlns:omgdi="http://www.omg.org/spec/DD/20100524/DI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" targetNamespace="" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL http://www.omg.org/spec/BPMN/2.0/20100501/BPMN20.xsd">
			<collaboration id="sid-c0e745ff-361e-4afb-8c8d-2a1fc32b1424">
				<participant id="sid-87F4C1D6-25E1-4A45-9DA7-AD945993D06F" name="Customer" processRef="sid-C3803939-0872-457F-8336-EAE484DC4A04" />
			</collaboration>
			<process id="sid-C3803939-0872-457F-8336-EAE484DC4A04" name="Customer" processType="None" isClosed="false" isExecutable="true">
				<extensionElements />
				<laneSet id="sid-b167d0d7-e761-4636-9200-76b7f0e8e83a">
					<lane id="sid-57E4FE0D-18E4-478D-BC5D-B15164E93254">
						<flowNodeRef>sid-52EB1772-F36E-433E-8F5B-D5DFD26E6F26</flowNodeRef>
						<flowNodeRef>sid-D7F237E8-56D0-4283-A3CE-4F0EFE446138</flowNodeRef>
						<flowNodeRef>sid-5134932A-1863-4FFA-BB3C-A4B4078B11A9</flowNodeRef>
						<flowNodeRef>Event_1vafvd8</flowNodeRef>
						<flowNodeRef>Event_1c4yc0d</flowNodeRef>
					</lane>
				</laneSet>
				<task id="sid-52EB1772-F36E-433E-8F5B-D5DFD26E6F26" name="Scan QR code">
					<incoming>sid-4DC479E5-5C20-4948-BCFC-9EC5E2F66D8D</incoming>
					<outgoing>Flow_1ucx5i0</outgoing>
				</task>
				<startEvent id="sid-D7F237E8-56D0-4283-A3CE-4F0EFE446138" name="Notices&#10;QR code">
					<outgoing>sid-7B791A11-2F2E-4D80-AFB3-91A02CF2B4FD</outgoing>
				</startEvent>
				<exclusiveGateway id="sid-5134932A-1863-4FFA-BB3C-A4B4078B11A9">
					<incoming>sid-7B791A11-2F2E-4D80-AFB3-91A02CF2B4FD</incoming>
					<outgoing>sid-4DC479E5-5C20-4948-BCFC-9EC5E2F66D8D</outgoing>
					<outgoing>Flow_0fsxl9p</outgoing>
				</exclusiveGateway>
				<sequenceFlow id="sid-4DC479E5-5C20-4948-BCFC-9EC5E2F66D8D" sourceRef="sid-5134932A-1863-4FFA-BB3C-A4B4078B11A9" targetRef="sid-52EB1772-F36E-433E-8F5B-D5DFD26E6F26" />
				<sequenceFlow id="sid-7B791A11-2F2E-4D80-AFB3-91A02CF2B4FD" sourceRef="sid-D7F237E8-56D0-4283-A3CE-4F0EFE446138" targetRef="sid-5134932A-1863-4FFA-BB3C-A4B4078B11A9" />
				<endEvent id="Event_1vafvd8">
					<incoming>Flow_0fsxl9p</incoming>
				</endEvent>
				<sequenceFlow id="Flow_0fsxl9p" sourceRef="sid-5134932A-1863-4FFA-BB3C-A4B4078B11A9" targetRef="Event_1vafvd8" />
				<endEvent id="Event_1c4yc0d">
					<incoming>Flow_1ucx5i0</incoming>
				</endEvent>
				<sequenceFlow id="Flow_1ucx5i0" sourceRef="sid-52EB1772-F36E-433E-8F5B-D5DFD26E6F26" targetRef="Event_1c4yc0d" />
			</process>
			<bpmndi:BPMNDiagram id="sid-74620812-92c4-44e5-949c-aa47393d3830">
				<bpmndi:BPMNPlane id="sid-cdcae759-2af7-4a6d-bd02-53f3352a731d" bpmnElement="sid-c0e745ff-361e-4afb-8c8d-2a1fc32b1424">
					<bpmndi:BPMNShape id="sid-87F4C1D6-25E1-4A45-9DA7-AD945993D06F_gui" bpmnElement="sid-87F4C1D6-25E1-4A45-9DA7-AD945993D06F" isHorizontal="true">
						<omgdc:Bounds x="83" y="105" width="933" height="250" />
						<bpmndi:BPMNLabel labelStyle="sid-84cb49fd-2f7c-44fb-8950-83c3fa153d3b">
							<omgdc:Bounds x="47.49999999999999" y="170.42857360839844" width="12.000000000000014" height="59.142852783203125" />
						</bpmndi:BPMNLabel>
					</bpmndi:BPMNShape>
					<bpmndi:BPMNShape id="sid-57E4FE0D-18E4-478D-BC5D-B15164E93254_gui" bpmnElement="sid-57E4FE0D-18E4-478D-BC5D-B15164E93254" isHorizontal="true">
						<omgdc:Bounds x="113" y="105" width="903" height="250" />
					</bpmndi:BPMNShape>
					<bpmndi:BPMNShape id="sid-52EB1772-F36E-433E-8F5B-D5DFD26E6F26_gui" bpmnElement="sid-52EB1772-F36E-433E-8F5B-D5DFD26E6F26">
						<omgdc:Bounds x="393" y="170" width="100" height="80" />
						<bpmndi:BPMNLabel labelStyle="sid-84cb49fd-2f7c-44fb-8950-83c3fa153d3b">
							<omgdc:Bounds x="360.5" y="172" width="84" height="12" />
						</bpmndi:BPMNLabel>
					</bpmndi:BPMNShape>
					<bpmndi:BPMNShape id="StartEvent_0l6sgn0_di" bpmnElement="sid-D7F237E8-56D0-4283-A3CE-4F0EFE446138">
						<omgdc:Bounds x="187" y="192" width="36" height="36" />
						<bpmndi:BPMNLabel>
							<omgdc:Bounds x="182" y="229" width="46" height="24" />
						</bpmndi:BPMNLabel>
					</bpmndi:BPMNShape>
					<bpmndi:BPMNShape id="ExclusiveGateway_1g0eih2_di" bpmnElement="sid-5134932A-1863-4FFA-BB3C-A4B4078B11A9" isMarkerVisible="true">
						<omgdc:Bounds x="275" y="185" width="50" height="50" />
						<bpmndi:BPMNLabel>
							<omgdc:Bounds x="210" y="160" width="90" height="12" />
						</bpmndi:BPMNLabel>
					</bpmndi:BPMNShape>
					<bpmndi:BPMNShape id="Event_1vafvd8_di" bpmnElement="Event_1vafvd8">
						<omgdc:Bounds x="402" y="302" width="36" height="36" />
					</bpmndi:BPMNShape>
					<bpmndi:BPMNShape id="Event_1c4yc0d_di" bpmnElement="Event_1c4yc0d">
						<omgdc:Bounds x="562" y="192" width="36" height="36" />
					</bpmndi:BPMNShape>
					<bpmndi:BPMNEdge id="sid-4DC479E5-5C20-4948-BCFC-9EC5E2F66D8D_gui" bpmnElement="sid-4DC479E5-5C20-4948-BCFC-9EC5E2F66D8D">
						<omgdi:waypoint x="325" y="210" />
						<omgdi:waypoint x="393" y="210" />
						<bpmndi:BPMNLabel>
							<omgdc:Bounds x="314" y="185" width="90" height="20" />
						</bpmndi:BPMNLabel>
					</bpmndi:BPMNEdge>
					<bpmndi:BPMNEdge id="sid-7B791A11-2F2E-4D80-AFB3-91A02CF2B4FD_gui" bpmnElement="sid-7B791A11-2F2E-4D80-AFB3-91A02CF2B4FD">
						<omgdi:waypoint x="223" y="210" />
						<omgdi:waypoint x="275" y="210" />
						<bpmndi:BPMNLabel>
							<omgdc:Bounds x="204" y="185" width="90" height="20" />
						</bpmndi:BPMNLabel>
					</bpmndi:BPMNEdge>
					<bpmndi:BPMNEdge id="Flow_0fsxl9p_di" bpmnElement="Flow_0fsxl9p">
						<omgdi:waypoint x="300" y="235" />
						<omgdi:waypoint x="300" y="320" />
						<omgdi:waypoint x="402" y="320" />
					</bpmndi:BPMNEdge>
					<bpmndi:BPMNEdge id="Flow_1ucx5i0_di" bpmnElement="Flow_1ucx5i0">
						<omgdi:waypoint x="493" y="210" />
						<omgdi:waypoint x="562" y="210" />
					</bpmndi:BPMNEdge>
				</bpmndi:BPMNPlane>
				<bpmndi:BPMNLabelStyle id="sid-e0502d32-f8d1-41cf-9c4a-cbb49fecf581">
					<omgdc:Font name="Arial" size="11" isBold="false" isItalic="false" isUnderline="false" isStrikeThrough="false" />
				</bpmndi:BPMNLabelStyle>
				<bpmndi:BPMNLabelStyle id="sid-84cb49fd-2f7c-44fb-8950-83c3fa153d3b">
					<omgdc:Font name="Arial" size="12" isBold="false" isItalic="false" isUnderline="false" isStrikeThrough="false" />
				</bpmndi:BPMNLabelStyle>
			</bpmndi:BPMNDiagram>
		</definitions>`
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
