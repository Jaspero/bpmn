<svelte:options
  customElement={{
    tag: 'jp-bpmn-single',
    shadow: 'none'
  }}
/>

<script lang="ts">
  import Button from './Button.svelte';
  import { onMount, createEventDispatcher } from 'svelte';
  import type { BPMNService } from './types/bpmn.service';
  import type { BPMNVersion } from './types/bpmn-version.interface';
  import type { BPMN } from './types/bpmn.interface';
  import { loadBpmn } from './load-bpmn';
  import type { BPMNTrigger } from './types/bpmn-trigger.interface';

  const dispatch = createEventDispatcher();

  export let service: BPMNService;
  export let id: string;
  export let version: number;

  let loading = true;
  let sidebar = false;

  let selectedTask: string | null = null;
  let selectedService;

  let modeler: any;
  let instance: BPMN;
  let instanceBackup: BPMN;
  let versionInstance: BPMNVersion;
  let versionInstanceBackup: BPMNVersion;
  let triggers: BPMNTrigger[];
  let triggerVersions: any = {};

  let selectedTrigger;
  let selectedTriggerVersion;

  let saveLoading = false;

  $: if (versionInstance) versionInstance.trigger = `${selectedTrigger}-v${selectedTriggerVersion}`;

  async function save() {
    saveLoading = true
    const { xml } = await modeler.saveXML({ format: true });

    const changes = Object.keys(instance).some((key) => instance[key] !== instanceBackup[key]);

    if(changes){
      await service.update(id, {
        name: instance.name,
        description: instance.description
      });
    }

    if(selectedTrigger && selectedTriggerVersion && (versionInstance.trigger != versionInstanceBackup.trigger) || (versionInstance.triggerCondition != versionInstanceBackup.triggerCondition)){
      await service.updateVersion(id, version, {
        xml: xml,
        trigger: versionInstance.trigger,
        triggerCondition: versionInstance.triggerCondition
      });
    } else if (versionInstance.xml != xml) {
      await service.updateVersion(id, version, {
        xml: xml
      });
    }

    saveLoading = false

    dispatch('saved');
  }
  
  function handleServiceSelection(){

  }

  onMount(async () => {
    await loadBpmn();

    [instance, versionInstance, triggers] = await Promise.all([
      service.get(id),
      service.getVersion(id, version),
      service.getTriggers()
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
      }
    });

    const eventBus = modeler.get('eventBus')

    eventBus.on('element.click', (e) => {
      console.log(e)
      if(e.element.type == 'bpmn:Task' && e.gfx.classList.contains('selected')){
        selectedTask = e.element.id
      } else {
        selectedTask = null
      }
      console.log(selectedTask)
    })

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
    <Button variant="outlined" on:click={() => dispatch('back')}>Back</Button>
    <Button on:click={save} loading={saveLoading}>Save</Button>
  </nav>

  <div class="canvas-container">
    <div id="canvas" class="canvas" />

    {#if instance && versionInstance}
      <div class="sidebar" class:open={sidebar}>
        <button class="sidebar-toggle" on:click={() => (sidebar = !sidebar)}>
          <span class="sidebar-toggle-label"> Details </span>
          <span class="sidebar-toggle-icon material-symbols-outlined"> menu </span>
        </button>

        <div class="sidebar-header">
          <span class="material-symbols-outlined sidebar-header-icon">
            check_box_outline_blank
          </span>

          <div>
            <h2 class="sidebar-header-title">DMN</h2>
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
          </div>
        </details>

        {#if selectedTask}
          <details>
            <summary>Services</summary>
            <div class="details-grid">
              <div class="field-container">
                <label for="service">Service</label>
                <select id="service" bind:value={selectedService} on:change={handleServiceSelection}  required>
                  {#each ['None', 'firestore', 'stripe'] as service}
                    <option value={service}>{service}</option>
                  {/each}
                </select>
              </div>
          </details>
        {/if}

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
                  <option value="">Select Trigger</option>
                  {#each triggerVersions[selectedTrigger] as version}
                    <option value={version}>{version}</option>
                  {/each}
                </select>
              {/if}
            </div>

            <div class="field-container">
              <label for="triggerCondition">Trigger Condition</label>
              <textarea id="triggerCondition" rows="4" bind:value={versionInstance.triggerCondition} />
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
    position: relative;
    border-left: 2px solid var(--border-primary);
    white-space: nowrap;
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
    right: 100%;
    -webkit-transform: translate(44px, -50%) rotate(-90deg);
    -moz-transform: translate(44px, -50%) rotate(-90deg);
    -ms-transform: translate(44px, -50%) rotate(-90deg);
    -o-transform: translate(44px, -50%) rotate(-90deg);
    transform: translate(44px, -50%) rotate(-90deg);
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
  select,
  textarea {
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
</style>
