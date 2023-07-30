export interface BPMN {
	id: string;
	name: string;
	version: number;
	createdOn: number;
	lastUpdatedOn: number;
	description?: string;
	trigger?: string;
	triggerCondition?: string;
}