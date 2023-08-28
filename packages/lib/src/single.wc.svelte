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

  const dispatch = createEventDispatcher()

  export let service: BPMNService;
  export let id: string;
  export let version: number;

  let loading = true;
  let sidebar = false;

  let modeler: any;
  let instance: BPMN;
  let instanceBackup: BPMN;
  let versionInstance: BPMNVersion;
  let triggers: BPMNTrigger[];
  let triggerVersions: any = {};

  let selectedTrigger;
  let selectedTriggerVersion;

  let saveLoading = false;

  $: if(instance) instance.trigger = `${selectedTrigger}-v${selectedTriggerVersion}`

  async function save() {
    const { xml } = await modeler.saveXML({ format: true });

    const changes = Object.keys(instance).some((key) => instance[key] !== instanceBackup[key]);

    if (changes) {
      await service.update(id, {
        name: instance.name,
        description: instance.description,
        trigger: instance.trigger,
        triggerCondition: instance.triggerCondition
      });
    }

    await service.createVersion(id, { xml });

    dispatch('saved')
  }

  onMount(async () => {
    await loadBpmn();

    [instance, versionInstance, triggers] = await Promise.all([
      service.get(id),
      service.getVersion(id, version),
      service.getTriggers()
    ]);

    triggers.forEach(el => triggerVersions[el.id] = el.versions)

    instanceBackup = { ...instance };

    if(instanceBackup.trigger) {
      selectedTrigger = instanceBackup.trigger.split('-v')[0]
      selectedTriggerVersion = instanceBackup.trigger.split('-v')[1]
    }

    // @ts-ignore
    modeler = new BpmnJS({
      container: '#canvas',
      keyboard: {
        bindTo: window
      }
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
    <a class="button button-outlined" href={baseLink}>Back</a>
    <button class="button button-filled" on:click={save} class:loading={saveLoading}>
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
      <div class="sidebar" class:open={sidebar}>
        <button class="sidebar-toggle"
                on:click={() => (sidebar = !sidebar)}
        >
          <span class="sidebar-toggle-label"> Details </span>
          <span class="sidebar-toggle-icon material-symbols-outlined"> menu </span>
        </button>

        <div class="sidebar-header">
          <span class="material-symbols-outlined sidebar-header-icon"> check_box_outline_blank </span>

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

        <details class="sidebar-details p-2 border-b-2 cursor-pointer">
          <summary>Version</summary>
          <div class="details-grid">
            <div class="field-container">
              <label for="version">Version Number</label>
              <input type="number" id="version" bind:value={versionInstance.version} readonly />
            </div>
          </div>

          <div class="details-grid">
            <div class="field-container">
              <label for="versionId">Version ID</label>
              <input id="versionId" bind:value={versionInstance.version} readonly />
            </div>
          </details>

          <details class="p-2 border-b-2 cursor-pointer">
            <summary class="text-sm">Trigger</summary>
            <div class="flex flex-col gap-2 mt-4">
              <div class="flex flex-col gap-1">
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

              <div class="flex flex-col gap-1">
                <label for="triggerCondition">Trigger Condition</label>
                <textarea id="triggerCondition" rows="4" bind:value={instance.triggerCondition} />
              </div>
            </div>
          </details>

          <details class="p-2 border-b-2 cursor-pointer">
            <summary class="text-sm">Version</summary>
            <div class="flex flex-col gap-2 mt-4">
              <div class="flex flex-col gap-1">
                <label for="version">Version Number</label>
                <input type="number" id="version" bind:value={versionInstance.version} readonly />
              </div>
            </div>
          </details>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .layout {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  .navigation {
    display: flex;
    justify-content: space-between;
    background-color: var(--background-primary);
    padding: 1rem;
    border-bottom: 2px solid var(--border-primary);
  }

  .canvas-container {
    display: flex;
  }

  .canvas {
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
    display: flex;
    align-items: center;
    width: 100%;
    height: 3.5rem;
    background-color: rgba(0,0,0,.02);
    padding: 0 .5rem;
    gap: .5rem;
    border-bottom: 2px solid var(--border-primary);
  }

  .sidebar-header-icon {
    font-size: 2rem;
  }

  .sidebar-header-title {
    text-transform: uppercase;
    font-size: .75rem;
    line-height: 1rem;
    font-weight: bold;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sidebar-header-subtitle {
    font-size: .75rem;
    line-height: 1rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sidebar-toggle {
    position: absolute;
    top: 50%;
    right: 100%;
    transform: translate(44px, -50%) rotate(-90deg);
    width: 128px;
    border-top: 2px solid var(--border-primary);
    border-left: 2px solid var(--border-primary);
    border-right: 2px solid var(--border-primary);
    display: flex;
    align-items: center;
    padding: 0 .25rem;
    border-top-left-radius: .25rem;
    border-top-right-radius: .25rem;
    background-color: var(--background-primary);
  }

  .sidebar-toggle:hover {
    background-color: var(--background-secondary);
  }

  .sidebar-toggle-label {
    padding: 0 1rem;
  }

  .sidebar-toggle-icon {
    transform: rotate(90deg);
    border-bottom: 2px solid var(--border-primary);
    padding: .25rem;
  }



  details {
    padding: .5rem;
    border-bottom: 2px solid var(--border-primary);
    cursor: pointer;
  }

  summary {
    margin: -.5rem;
    padding: .5rem;
    font-size: .875rem;
  }

  summary:hover {
    background-color: var(--background-secondary);
  }

  .details-grid {
    display: flex;
    flex-direction: column;
    gap: .5rem;
    margin-top: 1rem;
  }



  .field-container {
    display: flex;
    flex-direction: column;
    gap: .25rem;
  }

  label {
    font-size: .75rem;
    font-weight: bold;
  }

  input,
  select,
  textarea {
    border: 2px solid var(--border-primary);
    border-radius: .25rem;
    padding: .25rem .5rem;
    font-size: .875rem;
  }

  .button {
    display: flex;
    align-items: center;
    height: 2.5rem;
    border-radius: .25rem;
    border: 2px solid transparent;
    text-align: center;
    min-width: 4rem;
    padding: 0 1.5rem;
    font-weight: bold;
    cursor: pointer;
  }

  .button-outlined {
    border-color: var(--border-primary);
  }

  .button-filled {
    background-color: var(--primary-color);
    color: var(--text-on-primary);
  }

  .button.loading {
    border-color: var(--primary-color);
    background-color: transparent;
    color: var(--text-primary);
    gap: 1rem;
    font-weight: 400;
  }



  .loading-overlay {
    z-index: 100;
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: var(--background);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
  }

  .loading-spinner {
    width: 1.5rem;
    height: 1.5rem;
    border: 4px solid var(--border-primary);
    border-left-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>