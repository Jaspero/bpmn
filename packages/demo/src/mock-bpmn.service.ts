import type {BPMNVersion} from '../../../dist/lib/types/BPMN-version.interface';
import type {BPMN} from '../../../dist/lib/types/BPMN.interface';
import type {BPMNService} from '../../../dist/lib/types/BPMN.service';

const mockItems = [
	{id: Date.now().toString(), name: 'foo', version: 1, createdOn: Date.now(), lastUpdatedOn: Date.now()},
	{id: Date.now().toString(), name: 'bar', version: 1, createdOn: Date.now(), lastUpdatedOn: Date.now()},
];

const mockVersion = [
	{
		id: Date.now().toString(),
		version: 1,
		xml: `<?xml version="1.0" encoding="UTF-8"?>
		<definitions xmlns="https://www.omg.org/spec/BPMN/20191111/MODEL/" xmlns:BPMNdi="https://www.omg.org/spec/BPMN/20191111/BPMNDI/" xmlns:dc="http://www.omg.org/spec/BPMN/20180521/DC/" xmlns:di="http://www.omg.org/spec/BPMN/20180521/DI/" id="dish" name="Dish" namespace="http://camunda.org/schema/1.0/BPMN">
			<inputData id="dayType_id" name="Type of day">
				<variable id="dayType_ii" name="Type of day" typeRef="string" />
			</inputData>
			<inputData id="temperature_id" name="Weather in Celsius">
				<variable id="temperature_ii" name="Weather in Celsius" typeRef="integer" />
			</inputData>
			<knowledgeSource id="host_ks" name="Host" />
			<knowledgeSource id="guest_ks" name="Guest Type">
				<authorityRequirement id="AuthorityRequirement_0hyfuzo">
					<requiredDecision href="#guestCount" />
				</authorityRequirement>
			</knowledgeSource>
			<businessKnowledgeModel id="elMenu" name="El menú" />
			<decision id="dish-decision" name="Dish Decision">
				<informationRequirement id="InformationRequirement_05tgz9d">
					<requiredDecision href="#guestCount" />
				</informationRequirement>
				<informationRequirement id="InformationRequirement_1r8doop">
					<requiredDecision href="#season" />
				</informationRequirement>
				<authorityRequirement id="AuthorityRequirement_1sk6rin">
					<requiredAuthority href="#host_ks" />
				</authorityRequirement>
				<decisionTable id="dishDecisionTable">
					<input id="seasonInput" label="Season">
						<inputExpression id="seasonInputExpression" typeRef="string">
							<text>season</text>
						</inputExpression>
					</input>
					<input id="guestCountInput" label="How many guests">
						<inputExpression id="guestCountInputExpression" typeRef="integer">
							<text>guestCount</text>
						</inputExpression>
					</input>
					<output id="output1" label="Dish" name="desiredDish" typeRef="string" />
					<rule id="row-495762709-1">
						<inputEntry id="UnaryTests_1nxcsjr">
							<text>"Winter"</text>
						</inputEntry>
						<inputEntry id="UnaryTests_1r9yorj">
							<text>&lt;= 8</text>
						</inputEntry>
						<outputEntry id="LiteralExpression_1mtwzqz">
							<text>"Spareribs"</text>
						</outputEntry>
					</rule>
					<rule id="row-495762709-2">
						<inputEntry id="UnaryTests_1lxjbif">
							<text>"Winter"</text>
						</inputEntry>
						<inputEntry id="UnaryTests_0nhiedb">
							<text>&gt; 8</text>
						</inputEntry>
						<outputEntry id="LiteralExpression_1h30r12">
							<text>"Pasta"</text>
						</outputEntry>
					</rule>
					<rule id="row-495762709-3">
						<inputEntry id="UnaryTests_0ifgmfm">
							<text>"Summer"</text>
						</inputEntry>
						<inputEntry id="UnaryTests_12cib9m">
							<text>&gt; 10</text>
						</inputEntry>
						<outputEntry id="LiteralExpression_0wgaegy">
							<text>"Light salad"</text>
						</outputEntry>
					</rule>
					<rule id="row-495762709-7">
						<inputEntry id="UnaryTests_0ozm9s7">
							<text>"Summer"</text>
						</inputEntry>
						<inputEntry id="UnaryTests_0sesgov">
							<text>&lt;= 10</text>
						</inputEntry>
						<outputEntry id="LiteralExpression_1dvc5x3">
							<text>"Beans salad"</text>
						</outputEntry>
					</rule>
					<rule id="row-445981423-3">
						<inputEntry id="UnaryTests_1er0je1">
							<text>"Spring"</text>
						</inputEntry>
						<inputEntry id="UnaryTests_1uzqner">
							<text>&lt; 10</text>
						</inputEntry>
						<outputEntry id="LiteralExpression_1pxy4g1">
							<text>"Stew"</text>
						</outputEntry>
					</rule>
					<rule id="row-445981423-4">
						<inputEntry id="UnaryTests_06or48g">
							<text>"Spring"</text>
						</inputEntry>
						<inputEntry id="UnaryTests_0wa71sy">
							<text>&gt;= 10</text>
						</inputEntry>
						<outputEntry id="LiteralExpression_09ggol9">
							<text>"Steak"</text>
						</outputEntry>
					</rule>
				</decisionTable>
			</decision>
			<decision id="season" name="Season decision">
				<informationRequirement id="InformationRequirement_1vzoh7s">
					<requiredInput href="#temperature_id" />
				</informationRequirement>
				<decisionTable id="seasonDecisionTable">
					<input id="temperatureInput" label="Weather in Celsius">
						<inputExpression id="temperatureInputExpression" typeRef="integer">
							<text>temperature</text>
						</inputExpression>
					</input>
					<output id="seasonOutput" label="season" name="season" typeRef="string" />
					<rule id="row-495762709-5">
						<inputEntry id="UnaryTests_1fd0eqo">
							<text>&gt;30</text>
						</inputEntry>
						<outputEntry id="LiteralExpression_0l98klb">
							<text>"Summer"</text>
						</outputEntry>
					</rule>
					<rule id="row-495762709-6">
						<inputEntry id="UnaryTests_1nz6at2">
							<text>&lt;10</text>
						</inputEntry>
						<outputEntry id="LiteralExpression_08moy1k">
							<text>"Winter"</text>
						</outputEntry>
					</rule>
					<rule id="row-445981423-2">
						<inputEntry id="UnaryTests_1a0imxy">
							<text>[10..30]</text>
						</inputEntry>
						<outputEntry id="LiteralExpression_1poftw4">
							<text>"Spring"</text>
						</outputEntry>
					</rule>
				</decisionTable>
			</decision>
			<decision id="guestCount" name="Guest Count">
				<informationRequirement id="InformationRequirement_038230q">
					<requiredInput href="#dayType_id" />
				</informationRequirement>
				<knowledgeRequirement id="KnowledgeRequirement_0cql475">
					<requiredKnowledge href="#elMenu" />
				</knowledgeRequirement>
				<decisionTable id="guestCountDecisionTable">
					<input id="typeOfDayInput" label="Type of day">
						<inputExpression id="typeOfDayInputExpression" typeRef="string">
							<text>dayType</text>
						</inputExpression>
					</input>
					<output id="guestCountOutput" label="Guest count" name="guestCount" typeRef="integer" />
					<rule id="row-495762709-8">
						<inputEntry id="UnaryTests_0l72u8n">
							<text>"Weekday"</text>
						</inputEntry>
						<outputEntry id="LiteralExpression_0wuwqaz">
							<text>4</text>
						</outputEntry>
					</rule>
					<rule id="row-495762709-9">
						<inputEntry id="UnaryTests_03a73o9">
							<text>"Holiday"</text>
						</inputEntry>
						<outputEntry id="LiteralExpression_1whn119">
							<text>10</text>
						</outputEntry>
					</rule>
					<rule id="row-495762709-10">
						<inputEntry id="UnaryTests_12tygwt">
							<text>"Weekend"</text>
						</inputEntry>
						<outputEntry id="LiteralExpression_1b5k9t8">
							<text>15</text>
						</outputEntry>
					</rule>
				</decisionTable>
			</decision>
			<textAnnotation id="TextAnnotation_1">
				<text>Week day or week end</text>
			</textAnnotation>
			<association id="Association_18hoj4i">
				<sourceRef href="#dayType_id" />
				<targetRef href="#TextAnnotation_1" />
			</association>
			<BPMNdi:BPMNDI>
				<BPMNdi:BPMNDiagram id="BPMNDiagram_1ejukud">
					<BPMNdi:BPMNShape id="BPMNShape_1pny77l" BPMNElementRef="dayType_id">
						<dc:Bounds height="45" width="125" x="303" y="363" />
					</BPMNdi:BPMNShape>
					<BPMNdi:BPMNShape id="BPMNShape_1b88mi9" BPMNElementRef="temperature_id">
						<dc:Bounds height="45" width="125" x="105" y="316" />
					</BPMNdi:BPMNShape>
					<BPMNdi:BPMNShape id="BPMNShape_0w9hu9e" BPMNElementRef="host_ks">
						<dc:Bounds height="63" width="100" x="595" y="56" />
					</BPMNdi:BPMNShape>
					<BPMNdi:BPMNShape id="BPMNShape_0159egh" BPMNElementRef="guest_ks">
						<dc:Bounds height="63" width="100" x="587" y="194" />
					</BPMNdi:BPMNShape>
					<BPMNdi:BPMNEdge id="BPMNEdge_1gafs9m" BPMNElementRef="AuthorityRequirement_0hyfuzo">
						<di:waypoint x="510" y="226" />
						<di:waypoint x="587" y="226" />
					</BPMNdi:BPMNEdge>
					<BPMNdi:BPMNShape id="BPMNShape_0j9biml" BPMNElementRef="elMenu">
						<dc:Bounds height="46" width="135" x="542" y="364" />
					</BPMNdi:BPMNShape>
					<BPMNdi:BPMNShape id="BPMNShape_1f9xq97" BPMNElementRef="dish-decision">
						<dc:Bounds height="80" width="180" x="250" y="56" />
					</BPMNdi:BPMNShape>
					<BPMNdi:BPMNEdge id="BPMNEdge_0wk9owu" BPMNElementRef="InformationRequirement_05tgz9d">
						<di:waypoint x="395" y="186" />
						<di:waypoint x="365" y="136" />
					</BPMNdi:BPMNEdge>
					<BPMNdi:BPMNEdge id="BPMNEdge_0glygnk" BPMNElementRef="InformationRequirement_1r8doop">
						<di:waypoint x="243" y="186" />
						<di:waypoint x="297" y="136" />
					</BPMNdi:BPMNEdge>
					<BPMNdi:BPMNEdge id="BPMNEdge_1jf14ck" BPMNElementRef="AuthorityRequirement_1sk6rin">
						<di:waypoint x="595" y="89" />
						<di:waypoint x="430" y="94" />
					</BPMNdi:BPMNEdge>
					<BPMNdi:BPMNShape id="BPMNShape_1dlhv62" BPMNElementRef="season">
						<dc:Bounds height="80" width="180" x="110" y="186" />
					</BPMNdi:BPMNShape>
					<BPMNdi:BPMNEdge id="BPMNEdge_01c572k" BPMNElementRef="InformationRequirement_1vzoh7s">
						<di:waypoint x="180" y="316" />
						<di:waypoint x="191" y="266" />
					</BPMNdi:BPMNEdge>
					<BPMNdi:BPMNShape id="BPMNShape_0tndkvg" BPMNElementRef="guestCount">
						<dc:Bounds height="80" width="180" x="330" y="186" />
					</BPMNdi:BPMNShape>
					<BPMNdi:BPMNEdge id="BPMNEdge_0wrc9rz" BPMNElementRef="KnowledgeRequirement_0cql475">
						<di:waypoint x="591" y="364" />
						<di:waypoint x="510" y="265" />
					</BPMNdi:BPMNEdge>
					<BPMNdi:BPMNEdge id="BPMNEdge_0m045nr" BPMNElementRef="InformationRequirement_038230q">
						<di:waypoint x="369" y="363" />
						<di:waypoint x="405" y="266" />
					</BPMNdi:BPMNEdge>
					<BPMNdi:BPMNShape id="BPMNShape_1izzhzd" BPMNElementRef="TextAnnotation_1">
						<dc:Bounds height="45" width="125" x="273" y="466" />
					</BPMNdi:BPMNShape>
					<BPMNdi:BPMNEdge id="BPMNEdge_1mkr3rl" BPMNElementRef="Association_18hoj4i">
						<di:waypoint x="366" y="408" />
						<di:waypoint x="336" y="466" />
					</BPMNdi:BPMNEdge>
				</BPMNdi:BPMNDiagram>
			</BPMNdi:BPMNDI>
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
	async create(item: {name: string; description?: string | undefined;}): Promise<{id: string;}> {
		return {id: Date.now().toString()};
	}
	async update(id: string, update: {name?: string | undefined; description?: string | undefined;}): Promise<void> {
		return;
	}
	async delete(id: string): Promise<void> {
		return;
	}
	async getVersion(id: string, version: number): Promise<BPMNVersion> {
		return mockVersion[0];
	}
	async createVersion(id: string, item: {xml: string;}): Promise<void> {
		return;
	}
	async updateVersion(id: string, version: number, item: {xml: string;}): Promise<void> {
		return;
	}
	async deleteVersion(id: string, version: number): Promise<void> {
		return;
	}
}