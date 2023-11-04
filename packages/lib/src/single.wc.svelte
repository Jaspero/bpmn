<svelte:options
  customElement={{
    tag: 'jp-bpmn-single',
    shadow: 'none'
  }}
/>

<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import type { BPMNService } from './types/bpmn.service';
  import type { BPMNVersion } from './types/bpmn-version.interface';
  import type { BPMN } from './types/bpmn.interface';
  import { loadBpmn } from './load-bpmn';
  import type { BPMNTrigger } from './types/bpmn-trigger.interface';
  import { random } from '@jaspero/utils';
  import base32 from 'base32';
  import customRendererModule from '../custom';
  import { state } from './state.service';
  import type { BPMNModelService } from './types/bpmn-model-service.interface';
  import FormModule from './FormModule.svelte';
  import { clickOutside } from './click-outside';
  import type { BPMNTestData } from './types/bpmn-test-data.interface';
  import { fly } from 'svelte/transition';

  export let bpmnService: BPMNService;
  export let id: string;
  export let version: number;
  export let buttonColor: 'primary' | 'secondary' = 'primary';

  const dispatch = createEventDispatcher();

  let loading = true;
  let sidebar = false;

  let selection: {
    id: string;
    type: 'service' | 'condition';
    value?: { config?: any } & any;
    configFields?: any[];
  } | null = null;
  let services: BPMNModelService[];

  let modeler: any;
  let elementFactory: any;
  let elementRegistry: any;
  let modeling: any;
  let moddle: any;
  let overlays: any;

  let instance: BPMN;
  let instanceBackup: BPMN;
  let versionInstance: BPMNVersion;
  let versionInstanceBackup: BPMNVersion;
  let triggers: BPMNTrigger[];
  let triggerVersions: { [key: string]: number[] } = {};

  let selectedTrigger: string;
  let selectedTriggerVersion: string;

  let saveLoading = false;

  let testDataFields = [
    {
      component: 'jp-input',
      field: '/id',
      options: {
        label: 'ID',
        disabled: true
      }
    },
    {
      component: 'jp-input',
      field: '/name',
      options: {
        label: 'Name'
      }
    },
    {
      component: 'jp-json-editor',
      field: '/data',
      options: {
        label: 'Data'
      }
    }
  ];
  let testRunOpen = false;
  let selectedTestData: Partial<BPMNTestData>;
  let testDataLoading = false;
  let testData: BPMNTestData[];
  let testDeleteIndex: number | null;
  let testDataOutput: {
    error?: string;
    duration?: number;
    output?: any;
  } | null;
  let testRunning = false;

  let popup = false;
  let popupMenuStyle: string;
  let fileEl: HTMLInputElement;

  $: if (versionInstance) {
    versionInstance.trigger = `${selectedTrigger}-v${selectedTriggerVersion}`;
  }

  async function save() {
    saveLoading = true;

    const xml = await getXml();
    const changes = Object.keys(instance).some((key) => instance[key] !== instanceBackup[key]);

    if (changes) {
      await bpmnService.update(id, {
        name: instance.name,
        description: instance.description
      });
    }

    const version_changes: any = Object.keys(versionInstance)
      .filter((el) => versionInstance[el] != versionInstanceBackup[el])
      .reduce((a, c) => {
        return { ...a, [c]: versionInstance[c] };
      }, {});

    if (versionInstance.xml != xml) {
      version_changes['xml'] = xml;
    }

    version_changes['active'] = versionInstance.active; // makes sure active is sent

    await bpmnService.updateVersion(id, version, { ...version_changes });

    saveLoading = false;

    dispatch('saved');
  }

  function handleServiceChange() {
    let el = elementRegistry.get(selection.id);
    let newId = random.string(24);

    const replace = modeler.get('replace');
    const { service: serviceId } = selection.value;

    let service: BPMNModelService;
    let config: any;

    if (selection.value.service) {
      service = services.find((it) => it.id === serviceId);

      if (!config) {
        config = service.defaultConfig;
      }

      if (el.type !== 'bpmn:ServiceTask') {
        el = replace.replaceElement(el, { type: 'bpmn:ServiceTask' });
        modeling.updateProperties(el, {
          implementation: '${environment.services.defaultServiceRun()}'
        });
      }

      overlays.clear({element: el});

      if (service.image) {
        overlays.add(el, {
          position: {
            top: 4,
            right: 24
          },
          html: `<div class="service-svg-wrapper">${service.image}</div>`
        });

      }

      newId =
        newId +
        'jpservice' +
        base32.encode(JSON.stringify({ service: serviceId, url: service.url, config }));
    } else if (el.type !== 'bpmn:Task') {
      el = replace.replaceElement(el, { type: 'bpmn:Task' });
    }

    modeling.updateProperties(el, {
      id: newId
    });

    selection = {
      id: newId,
      type: 'service',
      value: {
        service: serviceId,
        ...(config && { config })
      },
      ...(service && { configFields: service.configFields })
    };
  }

  function handleConfigChange() {
    const el = elementRegistry.get(selection.id);

    switch (selection.type) {
      case 'service': {
        const service = services.find((it) => it.id === selection.value.service);
        const id =
          random.string(24) +
          'jpservice' +
          base32.encode(
            JSON.stringify({
              service: selection.value.service,
              url: service.url,
              config: selection.value.config
            })
          );

        modeling.updateProperties(el, { id });
        selection.id = id;
        break;
      }
      case 'condition': {
        const condition = moddle.create('bpmn:FormalExpression', {
          body: '<![CDATA[next(null, ' + selection.value.config.condition + ');]]>'
        });

        modeling.updateProperties(el, {
          conditionExpression: condition
        });

        break;
      }
    }
  }

  function selectElement(
    type: 'service' | 'condition',
    id: string,
    config?: { value?: any; configFields?: any[] }
  ) {
    selection = {
      id,
      type,
      ...(config || {})
    };
    sidebar = true;
  }

  function openTestRunDialog() {
    testDataOutput = null;
    selectedTestData = {
      name: '',
      data: {}
    };
    testRunOpen = true;

    if (!testData) {
      testDataLoading = true;

      bpmnService.getTestData(id).then((data) => {
        testData = data;
        testDataLoading = false;
      });
    }
  }

  async function deleteTestItem(testDataId: string, index: number) {
    testDeleteIndex = index;
    await bpmnService.deleteTestData(id, testDataId);
    testData.splice(index, 1);
    testData = [...testData];
    testDeleteIndex = null;
  }

  function selectTestData(test: BPMNTestData) {
    selectedTestData = test;
    testDataFields = [...testDataFields];
  }

  async function testRun() {
    testRunning = true;

    if (selectedTestData.id) {
      await bpmnService.updateTestData(id, selectedTestData.id, {
        name: selectedTestData.name,
        data: selectedTestData.data
      });
    } else {
      const dt = await bpmnService.createTestData(id, {
        name: selectedTestData.name,
        data: selectedTestData.data
      });
      testData.push(dt);
    }

    const xml = await getXml();

    testDataOutput = await bpmnService.testRun(xml, selectedTestData.data);

    testRunning = false;
  }

  function togglePopup(event: PointerEvent) {
    const rect = (event.target as HTMLButtonElement).getBoundingClientRect();
    const availableSpaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 160;

    popupMenuStyle =
      availableSpaceBelow < dropdownHeight
        ? `
        min-width: ${rect.width}px;
        bottom: ${window.innerHeight - rect.top}px;
        left: ${rect.right}px;
      `
        : `
        min-width: ${rect.width}px;
        top: ${rect.bottom}px;
        left: ${rect.right}px;
      `;
    popup = true;
  }

  async function exportXml() {
    const xml = await getXml();

    console.log('XML File');
    console.log(xml);

    const blob = new Blob([xml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  function importXml() {
    fileEl.click();
  }

  function xmlSelected() {
    const file = fileEl.files[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = (evt) => {
      modeler.importXML(evt.target.result);
    };
  }

  async function getXml() {
    const { xml } = await modeler.saveXML({ format: true });
    return xml.replace(/isExecutable="false"/g, 'isExecutable="true"');
  }

  onMount(async () => {
    state.service = bpmnService;

    await loadBpmn();

    [instance, versionInstance, triggers, services] = await Promise.all([
      bpmnService.get(id),
      bpmnService.getVersion(id, version),
      bpmnService.getTriggers(),
      bpmnService.getServices()
    ]);

    triggers.forEach((el) => (triggerVersions[el.id] = el.versions));

    instanceBackup = { ...instance };
    versionInstanceBackup = { ...versionInstance };

    if (versionInstance.trigger) {
      selectedTrigger = versionInstance.trigger.split('-v')[0];
      selectedTriggerVersion = versionInstance.trigger.split('-v')[1];
    }

    // @ts-ignore
    modeler = new BpmnJS({
      container: '#canvas',
      keyboard: {
        bindTo: window
      },
      additionalModules: [
        customRendererModule
      ]
    });

    elementFactory = modeler.get('elementFactory');
    elementRegistry = modeler.get('elementRegistry');
    modeling = modeler.get('modeling');
    moddle = modeler.get('moddle');
    overlays = modeler.get('overlays');

    const eventBus = modeler.get('eventBus');

    eventBus.on('element.click', (e) => {
      if (e.gfx.classList.contains('selected')) {
        const { type, id, source } = e.element;

        switch (type) {
          case 'bpmn:Task': {
            selectElement('service', id, { value: { service: null } });
            return;
          }
          case 'bpmn:ServiceTask': {
            const { service, config } = JSON.parse(base32.decode(id.split('jpservice')[1]));
            const serviceType = services.find((it) => it.id === service);
            selectElement('service', id, {
              configFields: serviceType.configFields,
              value: { service, config }
            });
            return;
          }
          case 'bpmn:SequenceFlow': {
            if (source.type !== 'bpmn:ExclusiveGateway') {
              break;
            }

            selectElement('condition', id, {
              configFields: [
                {
                  component: 'jp-code-editor',
                  field: '/condition',
                  options: {
                    label: 'Condition',
                    options: {
                      lineNumbers: true,
                      mode: 'javascript',
                      styleActiveLine: true,
                      matchBrackets: true
                    }
                  }
                }
              ],
              value: {
                config: {
                  condition: e.element?.businessObject?.conditionExpression?.body.replace(
                    /<!\[CDATA\[next\(null, (.*)\)\;]]>/,
                    '$1'
                  )
                }
              }
            });

            return;
          }
        }
      }

      selection = null;
    });

    // TODO: Handle warnings and errors
    const { warnings } = await modeler.importXML(versionInstance.xml);

    loading = false;
  });
</script>

{#if loading}
  <div class="loading-overlay">
    <div class="loading-spinner"></div>
    Loading...
  </div>
{/if}

<div id="layout" class="layout">
  <nav class="navigation">
    <button class="button button-outlined {buttonColor}" on:click={() => dispatch('back')}
      >Back</button
    >
    <div class="flex gap-4">
      <button class="button button-outlined {buttonColor}" on:click={() => openTestRunDialog()}
        >Test Run</button
      >
      <button
        class="button button-filled {buttonColor}"
        class:loading={saveLoading}
        on:click={save}
      >
        Save
      </button>
      <button title="More Options" class="actions-button" on:click|stopPropagation={togglePopup}>
        <span class="material-symbols-outlined">more_vert</span>
      </button>
      {#if popup}
        <div class="overlay">
          <div
            class="actions"
            style={popupMenuStyle}
            transition:fly={{ y: -15, duration: 250 }}
            use:clickOutside
            on:click_outside={() => (popup = null)}
          >
            <button class="button button-filled {buttonColor}" on:click={exportXml}>Export XML</button>
            <button class="button button-outlined {buttonColor}" on:click={importXml}>Import XML</button>
          </div>
        </div>
      {/if}
    </div>
  </nav>

  <div class="canvas-container">
    <div id="canvas" class="canvas" />

    {#if instance && versionInstance}
      <button class="sidebar-toggle" class:active={sidebar} on:click={() => (sidebar = !sidebar)}>
        <span class="sidebar-toggle-label"> Details </span>
        <span class="sidebar-toggle-icon material-symbols-outlined"> menu </span>
      </button>

      <div class="sidebar" class:open={sidebar}>
        <div class="sidebar-header">
          <span class="material-symbols-outlined sidebar-header-icon">
            check_box_outline_blank
          </span>

          <div>
            <h2 class="sidebar-header-title">BPMN</h2>
            <p class="sidebar-header-subtitle">Settings</p>
          </div>
        </div>

        <details>
          <summary>General</summary>
          <div class="details-grid">
            <div class="field-container">
              <label for="name">Name</label>
              <input id="name" bind:value={instance.name} required />
            </div>

            <div class="field-container">
              <label for="description">Description</label>
              <textarea id="description" rows="4" bind:value={instance.description} />
            </div>

            <label>
              <input type="checkbox" bind:checked={versionInstance.active} /> Active
            </label>
          </div>
        </details>

        <details>
          <summary>Trigger</summary>
          <div class="details-grid">
            <div class="field-container">
              <label for="trigger">Trigger</label>
              <select id="trigger" bind:value={selectedTrigger}>
                <option value="">Select Trigger</option>
                {#each triggers as trigger}
                  <option value={trigger.id}>{trigger.name}</option>
                {/each}
              </select>
              {#if selectedTrigger}
                <select id="trigger-version" bind:value={selectedTriggerVersion}>
                  <option value="">Select Version</option>
                  {#each triggerVersions[selectedTrigger] as version}
                    <option value={version}>{version}</option>
                  {/each}
                </select>
              {/if}
            </div>

            <div class="field-container">
              <label for="triggerCondition">Trigger Condition</label>
              <textarea
                id="triggerCondition"
                rows="4"
                bind:value={versionInstance.triggerCondition}
              />
            </div>
          </div>
        </details>

        <details>
          <summary>Version</summary>
          <div class="details-grid">
            <div class="field-container">
              <label for="version">Version Number</label>
              <input type="number" id="version" bind:value={versionInstance.version} readonly />
            </div>
          </div>
        </details>

        {#if selection}
          <details>
            <summary>{selection.type}</summary>
            <div class="details-grid">
              <div class="field-container">
                {#if selection.type === 'service'}
                  <label for="service">Service</label>
                  <select
                    id="service"
                    bind:value={selection.value.service}
                    required
                    on:change={() => handleServiceChange()}
                  >
                    <option value={null}>None</option>
                    {#each services as service}
                      <option value={service.id}>{service.name}</option>
                    {/each}
                  </select>
                {/if}
                {#if selection.configFields}
                  <FormModule
                    items={selection.configFields}
                    bind:value={selection.value.config}
                    on:value={handleConfigChange}
                  />
                {/if}
              </div>
            </div>
          </details>
        {/if}
      </div>
    {/if}
  </div>
</div>

{#if testRunOpen}
  <div class="dialog-overlay">
    <div class="dialog" use:clickOutside={true} on:click_outside={() => (testRunOpen = false)}>
      <div class="dialog-header">
        <h2 class="dialog-header-title">Test Run</h2>
        <button class="dialog-header-close" on:click={() => (testRunOpen = false)}>
          <span class="material-symbols-outlined"> close </span>
        </button>
      </div>

      <div class="dialog-grid">
        {#if testDataOutput}
          <p><b>Test Run</b>: {testDataOutput.error ? 'Failed' : 'Successful'}</p>
          {#if testDataOutput.error}
            <p><b>Error</b>: {testDataOutput.error}</p>
          {:else}
            <p><b>Duration</b>: {testDataOutput.duration}ms</p>
            <p><b>Output</b>. {JSON.stringify(testDataOutput.output, null, 2)}</p>
          {/if}
        {:else if testDataLoading}
          <div class="loader-container">
            <div class="loading-spinner"></div>
          </div>
        {:else}
          {#if testData.length}
            <table>
              <tr>
                <th>Name</th>
                <th>Last Updated On</th>
                <th></th>
              </tr>
              {#each testData as test, index}
                <tr>
                  <td>{test.name}</td>
                  <td>{new Date(test.lastUpdatedOn).toLocaleString()}</td>
                  <td>
                    <div class="flex justify-end gap-2">
                      <button
                        class="button button-outlined icon {buttonColor}"
                        class:loading={index === testDeleteIndex}
                        on:click={() => deleteTestItem(test.id, index)}
                      >
                        <span class="material-symbols-outlined"> delete </span>
                      </button>

                      <button
                        class="button button-filled icon {buttonColor}"
                        on:click={() => selectTestData(test)}
                      >
                        <span class="material-symbols-outlined"> {selectedTestData.id === test.id ? 'select_check_box' : 'check_box_outline_blank'} </span>
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </table>
          {/if}

          <FormModule items={testDataFields} bind:value={selectedTestData} />

          <div class="flex justify-end mt-4">
            <button
              class="button button-filled {buttonColor}"
              class:loading={testRunning}
              on:click={testRun}
            >
              Run
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<input type="file" hidden bind:this={fileEl} on:change={xmlSelected} />

<style>
  .layout {
    display: -webkit-box;
    display: -webkit-flex;
    display: -moz-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -webkit-flex-direction: column;
    -moz-box-orient: vertical;
    -moz-box-direction: normal;
    -ms-flex-direction: column;
    flex-direction: column;
    width: 100%;
    height: calc(100vh - 64px);
  }

  .navigation {
    display: -webkit-box;
    display: -webkit-flex;
    display: -moz-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-pack: justify;
    -webkit-justify-content: space-between;
    -moz-box-pack: justify;
    -ms-flex-pack: justify;
    justify-content: space-between;
    background-color: var(--background-primary);
    padding: 1rem;
    border-bottom: 2px solid var(--border-primary);
  }

  .navigation > div {
    display: flex;
    align-items: center;
  }

  .canvas-container {
    display: -webkit-box;
    display: -webkit-flex;
    display: -moz-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-flex: 1;
    -webkit-flex: 1 1 0;
    -moz-box-flex: 1;
    -ms-flex: 1 1 0px;
    flex: 1 1 0;
  }

  .canvas {
    -webkit-box-flex: 1;
    -webkit-flex: 1 1 0;
    -moz-box-flex: 1;
    -ms-flex: 1 1 0px;
    flex: 1 1 0;
  }

  .sidebar {
    border-left: 2px solid var(--border-primary);
    white-space: nowrap;
    overflow-y: auto;
    height: calc(100vh - 138px);
  }

  .sidebar:not(.open) {
    width: 0;
  }

  .sidebar.open {
    width: 16rem;
  }

  .sidebar-header {
    display: -webkit-box;
    display: -webkit-flex;
    display: -moz-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -webkit-align-items: center;
    -moz-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    width: 100%;
    height: 3.5rem;
    background-color: rgba(0, 0, 0, 0.02);
    padding: 0 0.5rem;
    gap: 0.5rem;
    border-bottom: 2px solid var(--border-primary);
  }

  .sidebar-header-icon {
    font-size: 2rem;
  }

  .sidebar-header-title {
    text-transform: uppercase;
    font-size: 0.75rem;
    line-height: 1rem;
    font-weight: bold;
    overflow: hidden;
    -o-text-overflow: ellipsis;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sidebar-header-subtitle {
    font-size: 0.75rem;
    line-height: 1rem;
    overflow: hidden;
    -o-text-overflow: ellipsis;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sidebar-toggle {
    position: absolute;
    top: 50%;
    right: -44px;
    -webkit-transform: translateY(-50%) rotate(-90deg);
    -moz-transform: translateY(-50%) rotate(-90deg);
    -ms-transform: translateY(-50%) rotate(-90deg);
    -o-transform: translateY(-50%) rotate(-90deg);
    transform: translateY(-50%) rotate(-90deg);
    width: 128px;
    border-top: 2px solid var(--border-primary);
    border-left: 2px solid var(--border-primary);
    border-right: 2px solid var(--border-primary);
    display: -webkit-box;
    display: -webkit-flex;
    display: -moz-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -webkit-align-items: center;
    -moz-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    padding: 0 0.25rem;
    -webkit-border-top-left-radius: 0.25rem;
    -moz-border-radius-topleft: 0.25rem;
    border-top-left-radius: 0.25rem;
    -webkit-border-top-right-radius: 0.25rem;
    -moz-border-radius-topright: 0.25rem;
    border-top-right-radius: 0.25rem;
    background-color: var(--background-primary);
  }

  .sidebar-toggle.active {
    right: -webkit-calc(16rem - 46px);
    right: -moz-calc(16rem - 46px);
    right: calc(16rem - 46px);
  }

  .sidebar-toggle:hover {
    background-color: var(--background-secondary);
  }

  .sidebar-toggle-label {
    padding: 0 1rem;
  }

  .sidebar-toggle-icon {
    -webkit-transform: rotate(90deg);
    -moz-transform: rotate(90deg);
    -ms-transform: rotate(90deg);
    -o-transform: rotate(90deg);
    transform: rotate(90deg);
    border-bottom: 2px solid var(--border-primary);
    padding: 0.25rem;
  }

  details {
    padding: 0.5rem;
    border-bottom: 2px solid var(--border-primary);
    cursor: pointer;
  }

  summary {
    margin: -0.5rem;
    padding: 0.5rem;
    font-size: 0.875rem;
    text-transform: capitalize;
  }

  summary:hover {
    background-color: var(--background-secondary);
  }

  .details-grid {
    display: -webkit-box;
    display: -webkit-flex;
    display: -moz-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -webkit-flex-direction: column;
    -moz-box-orient: vertical;
    -moz-box-direction: normal;
    -ms-flex-direction: column;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .field-container {
    display: -webkit-box;
    display: -webkit-flex;
    display: -moz-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -webkit-flex-direction: column;
    -moz-box-orient: vertical;
    -moz-box-direction: normal;
    -ms-flex-direction: column;
    flex-direction: column;
    gap: 0.25rem;
  }

  label {
    font-size: 0.75rem;
    font-weight: bold;
  }

  input,
  textarea,
  select {
    border: 2px solid var(--border-primary);
    -webkit-border-radius: 0.25rem;
    -moz-border-radius: 0.25rem;
    border-radius: 0.25rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
  }

  .loading-overlay {
    z-index: 100;
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: var(--background);
    display: -webkit-box;
    display: -webkit-flex;
    display: -moz-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-pack: center;
    -webkit-justify-content: center;
    -moz-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    -webkit-box-align: center;
    -webkit-align-items: center;
    -moz-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    gap: 1rem;
  }

  .loading-spinner {
    width: 1.5rem;
    height: 1.5rem;
    border: 4px solid var(--border-primary);
    border-left-color: var(--primary-color);
    -webkit-border-radius: 50%;
    -moz-border-radius: 50%;
    border-radius: 50%;
    -webkit-animation: spin 1s linear infinite;
    -moz-animation: spin 1s linear infinite;
    -o-animation: spin 1s linear infinite;
    animation: spin 1s linear infinite;
  }

  @-webkit-keyframes spin {
    to {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }

  @-moz-keyframes spin {
    to {
      -moz-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }

  @-o-keyframes spin {
    to {
      -o-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }

  @keyframes spin {
    to {
      -webkit-transform: rotate(360deg);
      -moz-transform: rotate(360deg);
      -o-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }

  /* Buttons */
  .button {
    position: relative;
    display: -webkit-box;
    display: -webkit-flex;
    display: -moz-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -webkit-align-items: center;
    -moz-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: center;
    -webkit-justify-content: center;
    -moz-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    height: 2.5rem;
    -webkit-border-radius: 0.25rem;
    -moz-border-radius: 0.25rem;
    border-radius: 0.25rem;
    text-align: center;
    min-width: 4rem;
    padding: 0 1rem;
    font-weight: bold;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    cursor: pointer;
  }

  .button:disabled {
    pointer-events: none;
    opacity: 0.5;
  }

  .button.icon {
    min-width: 2rem;
    min-height: 2rem;
    width: 2rem;
    height: 2rem;
    padding: 0;
  }

  .button.button-outlined {
    border-width: 2px;
    border-style: solid;
  }

  .button.button-outlined:hover {
    background-color: var(--background-tertiary);
  }

  .button.button-outlined.primary {
    border-color: var(--primary-color);
  }

  .button.button-outlined.secondary {
    border-color: var(--secondary-color);
  }

  .button.button-filled:hover {
    opacity: 0.75;
  }

  .button.button-filled.primary {
    background-color: var(--primary-color);
    color: var(--text-on-primary);
  }

  .button.button-filled.secondary {
    background-color: var(--secondary-color);
    color: var(--text-on-secondary);
  }

  .button.loading {
    opacity: 0.75;
    pointer-events: none;
  }

  .button.loading::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--primary-color);
  }

  .button.loading::after {
    content: '';
    position: absolute;
    -webkit-transform: translate(-50%, -50%);
    -moz-transform: translate(-50%, -50%);
    -ms-transform: translate(-50%, -50%);
    -o-transform: translate(-50%, -50%);
    transform: translate(-50%, -50%);
    width: 1.5rem;
    height: 1.5rem;
    border-top: 2px solid var(--text-on-primary);
    border-bottom: 2px solid var(--text-on-primary);
    border-left: 1px solid transparent;
    border-right: 1px solid transparent;
    -webkit-border-radius: 50%;
    -moz-border-radius: 50%;
    border-radius: 50%;
    -webkit-animation: spin 1.2s linear infinite;
    -moz-animation: spin 1.2s linear infinite;
    -o-animation: spin 1.2s linear infinite;
    animation: spin 1.2s linear infinite;
  }

  @keyframes spin {
    0% {
      -webkit-transform: rotate(0deg);
      -moz-transform: rotate(0deg);
      -o-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
      -moz-transform: rotate(360deg);
      -o-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }

  /* Dialog */
  .dialog-overlay {
    z-index: 200;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.25);
    display: -webkit-box;
    display: -webkit-flex;
    display: -moz-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-pack: center;
    -webkit-justify-content: center;
    -moz-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    -webkit-box-align: center;
    -webkit-align-items: center;
    -moz-box-align: center;
    -ms-flex-align: center;
    align-items: center;
  }

  .dialog {
    display: flex;
    flex-direction: column;
    background-color: var(--background-primary);
    -webkit-border-radius: 0.25rem;
    -moz-border-radius: 0.25rem;
    border-radius: 0.25rem;
  }

  @media (min-width: 601px) {
    .dialog {
      min-width: 600px;
      min-height: 200px;
    }
  }

  .dialog-header {
    display: -webkit-box;
    display: -webkit-flex;
    display: -moz-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-pack: justify;
    -webkit-justify-content: space-between;
    -moz-box-pack: justify;
    -ms-flex-pack: justify;
    justify-content: space-between;
    -webkit-box-align: center;
    -webkit-align-items: center;
    -moz-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-bottom: 1px solid var(--border-primary);
  }

  .dialog-header-title {
    font-size: 1.5rem;
    font-weight: bold;
  }

  .dialog-header-close {
    min-width: 2rem;
    max-width: 2rem;
    min-height: 2rem;
    max-height: 2rem;
    padding: 0;
    display: -webkit-box;
    display: -webkit-flex;
    display: -moz-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-pack: center;
    -webkit-justify-content: center;
    -moz-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    -webkit-box-align: center;
    -webkit-align-items: center;
    -moz-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-border-radius: 50%;
    -moz-border-radius: 50%;
    border-radius: 50%;
    -webkit-transition: background-color 0.3s;
    -o-transition: background-color 0.3s;
    -moz-transition: background-color 0.3s;
    transition: background-color 0.3s;
  }

  .dialog-header-close:hover {
    background-color: var(--background-tertiary);
  }

  .dialog-actions {
    display: -webkit-box;
    display: -webkit-flex;
    display: -moz-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -webkit-align-items: center;
    -moz-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-top: 1px solid var(--border-primary);
  }

  .dialog-grid {
    display: -webkit-box;
    display: -webkit-flex;
    display: -moz-box;
    display: -ms-flexbox;
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
    padding: 1rem;
  }

  .dialog-grid table {
    width: 100%;
    border: 1px solid #c4c4c4;
  }

  .dialog-grid table tr:not(:first-child) {
    border-top: 1px solid #c4c4c4;
  }

  .dialog-grid table tr th {
    text-align: left;
  }

  .dialog-grid table tr th,
  .dialog-grid table tr td {
    padding: 0.5rem;
  }

  .dialog-grid table tr td:not(:last-child) {
    padding-right: 1rem;
  }

  .dialog-grid table tr td:last-child {
    text-align: right;
  }

  .dialog-grid-item {
    display: -webkit-box;
    display: -webkit-flex;
    display: -moz-box;
    display: -ms-flexbox;
    display: flex;
    padding: 0.5rem 1rem;
  }

  .dialog-grid-item:not(.inline) {
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -webkit-flex-direction: column;
    -moz-box-orient: vertical;
    -moz-box-direction: normal;
    -ms-flex-direction: column;
    flex-direction: column;
  }

  .dialog-grid-item.inline {
    -webkit-box-align: center;
    -webkit-align-items: center;
    -moz-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: justify;
    -webkit-justify-content: space-between;
    -moz-box-pack: justify;
    -ms-flex-pack: justify;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .dialog-grid-item:not(.half) {
    width: 100%;
  }

  .dialog-grid-item.half {
    width: 50%;
  }

  .actions-button {
    min-width: 32px;
    max-width: 32px;
    min-height: 32px;
    max-height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-border-radius: 50%;
    -moz-border-radius: 50%;
    border-radius: 50%;
    -webkit-transition: 0.3s;
    -o-transition: 0.3s;
    -moz-transition: 0.3s;
    transition: 0.3s;
  }

  .actions-button:hover {
    background-color: var(--primary-color);
    color: var(--text-on-primary);
  }

  .actions-button .material-symbols-outlined {
    pointer-events: none;
  }

  .overlay {
    z-index: 100;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .actions {
    position: fixed;
    -webkit-transform: translateX(-100%);
    -moz-transform: translateX(-100%);
    -ms-transform: translateX(-100%);
    -o-transform: translateX(-100%);
    transform: translateX(-100%);
    display: -webkit-box;
    display: -webkit-flex;
    display: -moz-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -webkit-flex-direction: column;
    -moz-box-orient: vertical;
    -moz-box-direction: normal;
    -ms-flex-direction: column;
    flex-direction: column;
    gap: 0.5rem;
    background-color: var(--background-primary);
    border: 1px solid var(--border-primary);
    padding: 0.75rem;
    -webkit-border-radius: 0.25rem;
    -moz-border-radius: 0.25rem;
    border-radius: 0.25rem;
    width: 160px;
  }

  .loader-container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /**
   * Overlays
   */
  :global(.service-svg-wrapper) {
    width: 20px;
    height: 20px;
  }

  :global(.service-svg-wrapper svg) {
    width: 100%;
    height: auto;
  }
</style>
