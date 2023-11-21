<svelte:options
  customElement={{
    tag: 'jp-bpmn-overview',
    shadow: 'none'
  }}
/>

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { clickOutside } from './click-outside';
  import type { BPMN } from './types/bpmn.interface';
  import type { BPMNService } from './types/bpmn.service';
  import '@jaspero/web-components/dist/confirm.wc';
  import { renderConfirm } from '@jaspero/web-components/dist/render-confirm';

  export let bpmnService: BPMNService;
  export let buttonColor: 'primary' | 'secondary' = 'primary';
  export let subscriptionLink: (row: BPMN) => string;

  const dispatch = createEventDispatcher();

  let menuStyle;

  let items: BPMN[] = [];
  let loading: boolean;
  let filters = false;
  let popup: number | null = null;
  let hasMore = false;
  let ref: any;

  let loadingVersions = false;
  let versionsDialog = false;
  let versionDelLoading = false;
  let versionDelConfirm = false;
  let versionsObj = { id: '', versions: [], currentVersion: 0, versionsData: {} };

  let newDialog = false;
  let newLoading = false;
  let form: { name: string; description: string };

  async function list() {
    if (loading) {
      return;
    }

    loading = true;

    const res = await bpmnService.list(ref);

    hasMore = !!res.length;

    ref = res[res.length - 1];
    items = [...items, ...res];
    loading = false;
  }

  function togglePopup(index: number) {
    const rect = document.getElementById('togglePopup' + index).getBoundingClientRect();
    const availableSpaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 160;

    menuStyle =
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
    popup = popup === index ? null : index;
  }

  function del(index: number, item: BPMN) {
    popup = null;
    renderConfirm(
      {
        title: 'Delete model',
        message: 'Are you sure you want to delete this model?',
        accept: 'Yes',
        reject: 'No',
        closable: true
      },
      async (e) => {
        if (e.confirmed) {
          document.body.style.cursor = 'wait'
          await bpmnService.delete(item.id);
          items.splice(index, 1);
          items = [...items];
          document.body.style.cursor = 'default'
        }
      }
    );
  }

  async function delVersion(id: string, version: number) {
    versionDelConfirm = true;
    renderConfirm(
      {
        title: 'Delete version',
        message: 'Are you sure you want to delete this version?',
        accept: 'Yes',
        reject: 'No',
        closable: true
      },
      async (e) => {
        versionDelConfirm = false;
        if (e.confirmed) {
          versionDelLoading = true;
          await bpmnService.deleteVersion(id, version);
          versionsObj.versions = versionsObj.versions.filter((el) => el != version);
          versionDelLoading = false;
        }
      }
    );
  }

  function openCreate() {
    form = {
      name: '',
      description: ''
    };
    newDialog = true;
  }

  async function newVersion(id) {
    await bpmnService.createVersion(id, { xml: '' });
    const { version } = await bpmnService.get(id);

    dispatch('versionCreated', { id, version });
  }

  async function create() {
    if (newLoading) {
      return;
    }

    newLoading = true;

    const { id } = await bpmnService.create(form);

    await newVersion(id);

    newDialog = false;
    newLoading = false;
  }

  function adjustFilters() {
    ref = null;
    items = [];
    filters = false;
    list().catch();
  }

  async function viewVersions(id, version) {
    loadingVersions = true;

    versionsObj.id = id;
    versionsObj.currentVersion = version;
    versionsObj.versions = await bpmnService.getVersions(id);

    await Promise.allSettled(
      versionsObj.versions.map(async (v) => {
        const vData = await bpmnService.getVersion(id, v);
        versionsObj.versionsData[v] = { createdOn: vData.createdOn, trigger: vData.trigger };
      })
    );

    loadingVersions = false;
    versionsDialog = true;

    popup = null;
  }

  onMount(async () => {
    await list();
  });
</script>

<div class="layout">
  <div class="card">
    <div class="card-header">
      <div class="card-header-main">
        <input type="search" placeholder="Search" class="search" />
        <button class="button-outlined {buttonColor}" on:click={() => (filters = true)}
          >Filters</button
        >
      </div>

      <button class="button-filled {buttonColor}" on:click={openCreate}> Add BPMN </button>
    </div>

    <div class="table-container">
      <table>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Version</th>
          <th>Actions</th>
        </tr>

        {#each items as item, index}
          <tr>
            <td>
              {#if item.name}
                {item.name}
              {:else}
                -
              {/if}
            </td>
            <td>
              {#if item.description}
                {item.description}
              {:else}
                -
              {/if}
            </td>
            <td>
              {#if item.version}
                {@html subscriptionLink ? subscriptionLink(item) : `v${item.version}`}
              {:else}
                -
              {/if}
            </td>
            <td class="actions-column">
              <button
                class="actions-button"
                id="togglePopup{index}"
                on:click|stopPropagation={() => togglePopup(index)}
              >
                <span class="material-symbols-outlined">more_horiz</span>
              </button>
              {#if popup === index}
                <div class="overlay">
                  <div
                    class="actions"
                    style={menuStyle}
                    transition:fly={{ y: -15, duration: 250 }}
                    use:clickOutside
                    on:click_outside={() => (popup = null)}
                  >
                    <button class="button-filled {buttonColor}" on:click={() => newVersion(item.id)}
                      >New version</button
                    >
                    <button
                      class="button-outlined {buttonColor}"
                      on:click={() =>
                        dispatch('editVersion', { id: item.id, version: item.version })}
                      >Edit</button
                    >
                    <button
                      class="button-outlined {buttonColor}"
                      class:loading={loadingVersions}
                      on:click={() => viewVersions(item.id, item.version)}>Versions</button
                    >
                    <button class="button-outlined {buttonColor}" on:click={() => del(index, item)}
                      >Delete</button
                    >
                  </div>
                </div>
              {/if}
            </td>
          </tr>
        {/each}
      </table>
    </div>

    <div class="table-footer">
      <button class="button-filled {buttonColor}" class:loading disabled={!hasMore}
        >Load more</button
      >
    </div>
  </div>
</div>

{#if filters}
  <div class="dialog-overlay">
    <form
      class="dialog"
      use:clickOutside={true}
      on:click_outside={() => (filters = false)}
      on:submit|preventDefault={adjustFilters}
    >
      <div class="dialog-header">
        <h2 class="dialog-header-title">Filters</h2>

        <button class="dialog-header-close" on:click={() => (filters = false)}>
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="dialog-grid">
        <div class="dialog-grid-item half">
          <label for="startDate">Start date</label>
          <input type="date" id="startDate" />
        </div>

        <div class="dialog-grid-item half">
          <label for="startDate">End date</label>
          <input type="date" id="endDate" />
        </div>

        <div class="dialog-grid-item">
          <label for="email">Email</label>
          <input type="email" id="email" />
        </div>

        <div class="dialog-grid-item">
          <label for="role">Role</label>
          <select name="role" id="role">
            <option value="" selected disabled>Select a role</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>

        <div class="dialog-grid-item">
          <label for="active">Active</label>
          <select name="active" id="active">
            <option value="" selected disabled>Select active/inactive</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div class="dialog-actions">
        <button class="button-filled {buttonColor}" type="submit">Apply</button>
      </div>
    </form>
  </div>
{/if}

{#if newDialog}
  <div class="dialog-overlay">
    <form
      class="dialog"
      use:clickOutside={true}
      on:click_outside={() => (newDialog = false)}
      on:submit|preventDefault={create}
    >
      <div class="dialog-header">
        <h2 class="dialog-header-title">Create New BPMN</h2>

        <button class="dialog-header-close" on:click={() => (newDialog = false)}>
          <span class="material-symbols-outlined"> close </span>
        </button>
      </div>

      <div class="dialog-grid">
        <div class="dialog-grid-item">
          <label for="name">Name</label>
          <input id="name" bind:value={form.name} required />
        </div>

        <div class="dialog-grid-item">
          <label for="description">Description</label>
          <textarea id="description" rows="4" bind:value={form.description} />
        </div>
      </div>

      <div class="dialog-actions">
        <button class="button-filled {buttonColor}" class:loading={newLoading} type="submit"
          >Apply</button
        >
      </div>
    </form>
  </div>
{/if}

{#if versionsDialog}
  <div class="dialog-overlay">
    <form
      class="dialog"
      use:clickOutside={true}
      on:click_outside={() => {if(!versionDelConfirm) versionsDialog = false}}
      on:submit|preventDefault={create}
    >
      <div class="dialog-header">
        <h2 class="dialog-header-title">List of versions</h2>

        <button class="dialog-header-close" on:click={() => (versionsDialog = false)}>
          <span class="material-symbols-outlined"> close </span>
        </button>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Version</th>
              <th>Created on</th>
              <th>Trigger</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each versionsObj.versions as version}
              <tr>
                <th>
                  {version}
                </th>
                <th>
                  {#if versionsObj.versionsData[version].createdOn}
                    {new Date(versionsObj.versionsData[version].createdOn).toDateString()}
                  {/if}
                </th>
                <th>
                  {#if versionsObj.versionsData[version].trigger}
                    {versionsObj.versionsData[version].trigger}
                  {/if}
                </th>
                <th>
                  <div class="flex gap-2">
                    <button
                      class="button button-filled {buttonColor}"
                      class:loading={versionDelLoading}
                      on:click={() => delVersion(versionsObj.id, version)}
                      disabled={version == versionsObj.currentVersion}
                    >
                      Delete
                    </button>

                    <button
                      class="button button-outlined {buttonColor}"
                      on:click={() =>
                        dispatch('editVersion', { id: versionsObj.id, version: version })}
                    >
                      Edit
                    </button>
                  </div>
                </th>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </form>
  </div>
{/if}

<style>
  *,
  *::before,
  *::after {
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
  }

  .layout {
    padding: 1.5rem;
  }

  /*Card */
  .card {
    background-color: var(--background-primary);
    border: 1px solid var(--border-primary);
    -webkit-border-radius: 0.5rem;
    -moz-border-radius: 0.5rem;
    border-radius: 0.5rem;
    overflow: hidden;
    max-width: 72rem;
    margin: 0 auto;
  }

  .card-header {
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
    -webkit-flex-wrap: wrap;
    -ms-flex-wrap: wrap;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-primary);
    background-color: var(--background-quaternary);
  }

  .card-header-main {
    display: -webkit-box;
    display: -webkit-flex;
    display: -moz-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-flex-wrap: wrap;
    -ms-flex-wrap: wrap;
    flex-wrap: wrap;
    gap: 1rem;
  }

  input,
  textarea,
  select {
    border: 2px solid var(--border-primary);
    padding: 0 0.75rem;
    -webkit-border-radius: 0.25rem;
    -moz-border-radius: 0.25rem;
    border-radius: 0.25rem;
    -webkit-box-flex: 1;
    -webkit-flex: 1 1 0;
    -moz-box-flex: 1;
    -ms-flex: 1 1 0px;
    flex: 1 1 0;
    min-height: 2.5rem;
  }

  .card-header-main .search:not(:focus):hover {
    border-color: var(--secondary-color);
  }

  /* Table */
  .table-container {
    overflow-x: auto;
    width: 100%;
  }

  table {
    width: 100%;
  }

  th,
  td {
    white-space: nowrap;
    font-size: 0.75rem;
    font-weight: normal;
    padding: 0.5rem;
    height: 48px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.16);
  }

  th {
    opacity: 0.75;
  }

  th:first-child,
  td:first-child {
    text-align: left;
  }

  th:not(:first-child):not(:last-child),
  td:not(:first-child):not(:last-child) {
    text-align: center;
  }

  th:last-child,
  td:last-child {
    text-align: right;
  }

  .actions-column {
    position: relative;
    display: -webkit-box;
    display: -webkit-flex;
    display: -moz-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-pack: end;
    -webkit-justify-content: flex-end;
    -moz-box-pack: end;
    -ms-flex-pack: end;
    justify-content: flex-end;
  }

  .actions-button {
    min-width: 32px;
    max-width: 32px;
    min-height: 32px;
    max-height: 32px;
    padding: 0;
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

  .table-footer {
    display: -webkit-box;
    display: -webkit-flex;
    display: -moz-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-flex-wrap: wrap;
    -ms-flex-wrap: wrap;
    flex-wrap: wrap;
    padding: 1.5rem;
    gap: 1.5rem;
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
  }

  /* Buttons */
  button {
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

  button:disabled {
    pointer-events: none;
    opacity: 0.5;
  }

  button.button-outlined {
    border-width: 2px;
    border-style: solid;
  }

  button.button-outlined:hover {
    background-color: var(--background-tertiary);
  }

  button.button-outlined.primary {
    border-color: var(--primary-color);
  }

  button.button-outlined.secondary {
    border-color: var(--secondary-color);
  }

  button.button-filled:hover {
    opacity: 0.75;
  }

  button.button-filled.primary {
    background-color: var(--primary-color);
    color: var(--text-on-primary);
  }

  button.button-filled.secondary {
    background-color: var(--secondary-color);
    color: var(--text-on-secondary);
  }

  button.loading {
    opacity: 0.75;
    pointer-events: none;
  }

  button.loading::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--primary-color);
  }

  button.loading::after {
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

  @-webkit-keyframes spin {
    0% {
      -webkit-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }

  @-moz-keyframes spin {
    0% {
      -moz-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    100% {
      -moz-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }

  @-o-keyframes spin {
    0% {
      -o-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    100% {
      -o-transform: rotate(360deg);
      transform: rotate(360deg);
    }
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
    z-index: 9;
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
    background-color: var(--background-primary);
    -webkit-border-radius: 0.25rem;
    -moz-border-radius: 0.25rem;
    border-radius: 0.25rem;
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
    -webkit-flex-wrap: wrap;
    -ms-flex-wrap: wrap;
    flex-wrap: wrap;
    padding: 0.5rem 0;
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
</style>
