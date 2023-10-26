export default () => {
  import('./src/overview.wc.svelte');
  import('./src/single.wc.svelte');

  /**
   * Types
   */
  import('./src/types/bpmn-version.interface');
  import('./src/types/bpmn.interface');
  import('./src/types/bpmn-test-data.interface');
  import('./src/types/bpmn-trigger.interface');
  import('./src/types/bpmn-test-run-output.interface');
  import('./src/types/bpmn.service');
};
