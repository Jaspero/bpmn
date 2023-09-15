import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';

import { restIcon } from './icons.js'

import {
  append as svgAppend,
  attr as svgAttr,
  create as svgCreate
} from 'tiny-svg';

import {
  getRoundRectPath
} from 'bpmn-js/lib/draw/BpmnRenderUtil';

import { is } from 'bpmn-js/lib/util/ModelUtil';
import { isAny } from 'bpmn-js/lib/features/modeling/util/ModelingUtil';

const HIGH_PRIORITY = 1500,
      TASK_BORDER_RADIUS = 2;


export default class CustomRenderer extends BaseRenderer {
  constructor(eventBus, bpmnRenderer) {
    super(eventBus, HIGH_PRIORITY);

    this.bpmnRenderer = bpmnRenderer;
  }

  canRender(element) {
    // only render service tasks (ignore labels)
    return isAny(element, [ 'bpmn:ServiceTask' ]) && !element.labelTarget;
  }

  drawShape(parentNode, element) {
    const shape = this.bpmnRenderer.drawShape(parentNode, element);

    if (is(element, 'bpmn:ServiceTask')) {
      let href = ''

      if(element.id.includes('jphttp')){
        href = restIcon
      }

      const img = svgCreate('image')
      svgAttr(img, {
        href: restIcon,
        width: 18,
        height: 18,
        x: element.width - 25,
        y: 5
      })

      svgAppend(parentNode, img)

      return shape;
    }

    return shape;
  }

  getShapePath(shape) {
    if (is(shape, 'bpmn:ServiceTask')) {
      return getRoundRectPath(shape, TASK_BORDER_RADIUS);
    }

    return this.bpmnRenderer.getShapePath(shape);
  }
}

CustomRenderer.$inject = [ 'eventBus', 'bpmnRenderer' ];