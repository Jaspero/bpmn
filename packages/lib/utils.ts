import {
  getBusinessObject, is
} from 'bpmn-js/lib/util/ModelUtil';
import type {Element} from 'bpmn-js/lib/model/Types';
import {
  find
} from 'min-dash';

export function getTimerEventDefinition(element: Element) {
  return getEventDefinition(element, 'bpmn:TimerEventDefinition');
}

export function getEventDefinition(element: Element, eventType: string): any {
  const businessObject = getBusinessObject(element);

  const eventDefinitions = businessObject.get('eventDefinitions') || [];

  return find(eventDefinitions, def => is(def, eventType));
}