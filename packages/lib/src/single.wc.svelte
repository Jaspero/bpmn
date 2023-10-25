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

  let instance: BPMN;
  let instanceBackup: BPMN;
  let versionInstance: BPMNVersion;
  let versionInstanceBackup: BPMNVersion;
  let triggers: BPMNTrigger[];
  let triggerVersions: { [key: string]: number[] } = {};

  let selectedTrigger: string;
  let selectedTriggerVersion: string;

  let saveLoading = false;

  $: if (versionInstance) {
    versionInstance.trigger = `${selectedTrigger}-v${selectedTriggerVersion}`;
  }

  async function save() {
    saveLoading = true;

    const { xml } = await modeler.saveXML({ format: true });
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
        ...config && {config}
      },
      ...service && {configFields: service.configFields}
    };
  }

  function handleConfigChange() {

    const el = elementRegistry.get(selection.id);

    switch (selection.type) {
      case 'service': {
        const service = services.find((it) => it.id === selection.value.service);
        const newId = random.string(24) + 'jpservice' + base32.encode(JSON.stringify({ service: selection.value.service, url: service.url, config: selection.value.config }));
        
        modeling.updateProperties(el, {
          id: newId
        });
        break;
      }
      case 'condition': {
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
      additionalModules: [customRendererModule]
    });

    elementFactory = modeler.get('elementFactory');
    elementRegistry = modeler.get('elementRegistry');
    modeling = modeler.get('modeling');
    moddle = modeler.get('moddle');

    const eventBus = modeler.get('eventBus');

    eventBus.on('element.click', (e) => {
      console.log('e', e);
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

            selectElement('condition', id);

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
    <button class="button button-filled {buttonColor}" class:loading={saveLoading} on:click={save}>
      {#if !saveLoading}
        Save
      {:else}
        <span class="loading-spinner"></span>
        Loading...
      {/if}
    </button>
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
                  <FormModule items={selection.configFields} bind:value={selection.value.config} on:value={handleConfigChange} />
                {/if}
              </div>
            </div>
          </details>
        {/if}
      </div>
    {/if}
  </div>
</div>

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
    height: 100vh;
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
    overflow: hidden;
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
</style>
