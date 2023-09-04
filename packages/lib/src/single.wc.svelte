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

  const dispatch = createEventDispatcher();

  export let service: BPMNService;
  export let id: string;
  export let version: number;
  export let buttonColor: 'primary'|'secondary' = 'primary'

  let loading = true;
  let sidebar = false;

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

  $: if (versionInstance) {
    versionInstance.trigger = `${selectedTrigger}-v${selectedTriggerVersion}`;
  }

  async function save() {
    saveLoading = true;
    const { xml } = await modeler.saveXML({ format: true });

    const changes = Object.keys(instance).some((key) => instance[key] !== instanceBackup[key]);

    if (changes) {
      await service.update(id, {
        name: instance.name,
        description: instance.description
      });
    }

    if (
      (
        selectedTrigger &&
        selectedTriggerVersion &&
        versionInstance.trigger != versionInstanceBackup.trigger
      ) ||
      versionInstance.triggerCondition != versionInstanceBackup.triggerCondition
    ) {
      await service.updateVersion(id, version, {
        xml,
        trigger: versionInstance.trigger,
        triggerCondition: versionInstance.triggerCondition,
        active: versionInstance.active
      });
    } else if (versionInstance.xml != xml) {
      await service.updateVersion(id, version, {
        xml,
        active: versionInstance.active
      });
    } else if (versionInstance.active != versionInstanceBackup.active) {
      await service.updateVersion(id, version, {
        active: versionInstance.active
      });
    }

    saveLoading = false;

    dispatch('saved');
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
    <button class="button button-outlined {buttonColor}" on:click={() => dispatch('back')}>Back</button>
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
      <button class="sidebar-toggle"
              class:active={sidebar}
              on:click={() => (sidebar = !sidebar)}>
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
                  <option value="">Select Trigger</option>
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
    -o-text-overflow: ellipsis;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sidebar-header-subtitle {
    font-size: .75rem;
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
    padding: 0 .25rem;
    -webkit-border-top-left-radius: .25rem;
    -moz-border-radius-topleft: .25rem;
    border-top-left-radius: .25rem;
    -webkit-border-top-right-radius: .25rem;
    -moz-border-radius-topright: .25rem;
    border-top-right-radius: .25rem;
    background-color: var(--background-primary);
  }

  .sidebar-toggle.active {
    right: -webkit-calc(16rem - 46px);
    right: -moz-calc(16rem - 46px);
    right: calc(16rem - 46px)
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
    gap: .5rem;
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
    gap: .25rem;
  }

  label {
    font-size: .75rem;
    font-weight: bold;
  }

  input,
  textarea,
  select {
    border: 2px solid var(--border-primary);
    -webkit-border-radius: .25rem;
    -moz-border-radius: .25rem;
    border-radius: .25rem;
    padding: .25rem .5rem;
    font-size: .875rem;
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
    -webkit-border-radius: .25rem;
    -moz-border-radius: .25rem;
    border-radius: .25rem;
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
    opacity: .5;
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
    opacity: .75;
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
    opacity: .75;
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
