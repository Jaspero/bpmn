<svelte:options customElement={{
  tag: 'jp-bpmn-overview',
  shadow: 'none'
}} />

<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fly } from 'svelte/transition';
  import Button from './Button.svelte';
  import Dialog from './Dialog.svelte';
  import Search from './Search.svelte';
  import { clickOutside } from './click-outside';
  import type { BPMN } from './types/bpmn.interface';
  import type { BPMNService } from './types/bpmn.service';

  export let service: BPMNService;

  const dispatch = createEventDispatcher();

  let items: BPMN[] = [];
  let loading: boolean;
  let filters = false;
  let popup: number | null = null;
  let hasMore = false;
  let ref: any;

  let loadingVersions = false;
  let versionsDialog = false;
  let versionDelLoading = false;
  let versionsObj = {id:'', versions:[], version: 0};

  let newDialog = false;
  let newLoading = false;
  let form: { name: string; description: string };

  async function list() {
    if (loading) {
      return;
    }

    loading = true;

    const res = await service.list(ref);

    hasMore = !!res.length;

    ref = res[res.length - 1];
    items = [...items, ...res];
    loading = false;
  }

  function togglePopup(index: number) {
    popup = popup === index ? null : index;
  }

  async function del(index: number, item: BPMN) {
    await service.delete(item.id);
    items.splice(index, 1);
    items = [...items];
    popup = null;
  }
  
  async function delVersion(id: string, version: number){
    versionDelLoading = true
    await service.deleteVersion(id, version)
    versionsObj.versions = versionsObj.versions.filter(el => el != version)
    versionDelLoading = false
  }

  function openCreate() {
    form = {
      name: '',
      description: ''
    };
    newDialog = true;
  }

  async function newVersion(id) {
    await service.createVersion(id, {xml: ''});
    const {version} = await service.get(id);

    dispatch('versionCreated', {id, version});
  }

  async function create() {
    if (newLoading) {
      return;
    }

    newLoading = true;

    const {id} = await service.create(form);

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

  async function viewVersions(id, version){
    loadingVersions = true;

    versionsObj.id = id
    versionsObj.version = version
    versionsObj.versions = await service.getVersions(id)

    loadingVersions = false
    versionsDialog = true
  }

  onMount(async () => {
    await list();
  });
</script>

<div class="layout">
  <div class="header">
    <div class="search-bar">
      <Search />
      <Button variant="outlined" on:click={() => (filters = true)}>Filters</Button>
    </div>

    <Button on:click={openCreate}>Add BPMN</Button>
  </div>

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
            {item.version}
          {:else}
            -
          {/if}
        </td>
        <td class="actions-column">
          <button
            class="actions-button"
            on:click|stopPropagation={() => togglePopup(index)}
          >
            <span class="material-symbols-outlined">more_horiz</span>
          </button>
          {#if popup === index}
            <div
              class="actions"
              transition:fly={{ y: -15, duration: 250 }}
              use:clickOutside
              on:click_outside={() => (popup = null)}
            >
              <Button on:click={() => newVersion(item.id)}>New version</Button>
              <Button variant="outlined" on:click={() => dispatch('editVersion', {id: item.id, version: item.version})}>Edit</Button>
              <Button variant="outlined" on:click={() => {viewVersions(item.id, item.version)}} loading={loadingVersions}>View versions</Button>
              <Button variant="outlined" on:click={() => del(index, item)}>Delete</Button>
            </div>
          {/if}
        </td>
      </tr>
    {/each}
  </table>

  {#if hasMore}
    <div class="load-more">
      <Button variant="outlined" {loading}>Load more</Button>
    </div>
  {/if}
</div>

<Dialog bind:showing={filters} on:submit={adjustFilters}>
  <slot slot="header">Filters</slot>

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

  <slot slot="actions">
    <Button type="submit">Apply</Button>
  </slot>
</Dialog>

<Dialog bind:showing={newDialog} on:submit={create}>
  <slot slot="header">Create New BPMN</slot>

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

  <slot slot="actions">
    <Button type="submit" loading={newLoading}>Apply</Button>
  </slot>
</Dialog>

<Dialog bind:showing={versionsDialog}>
  <slot slot="header">List of versions</slot>

    <div class="dialog-grid">
      {#each versionsObj.versions as version}
        <div class="dialog-grid-item inline">
          <span>Version: {version}</span>
          <Button variant="outlined" on:click={() => dispatch('editVersion', {id: versionsObj.id, version: version})}>Edit</Button>
          {#if version != versionsObj.version}
            <Button loading={versionDelLoading} on:click={() => delVersion(versionsObj.id, version)}>Delete</Button>
          {/if}
        </div>
      {/each}
    </div>
</Dialog>

<style>
  * {
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
  }

  .layout {
    padding: 1rem;
  }

  .header {
    display: -webkit-box;
    display: -webkit-flex;
    display: -moz-box;
    display: -ms-flexbox;
    display: flex;
  }

  .search-bar {
    display: -webkit-box;
    display: -webkit-flex;
    display: -moz-box;
    display: -ms-flexbox;
    display: flex;
    gap: 1rem;
    -webkit-box-flex: 1;
    -webkit-flex: 1 1 0;
    -moz-box-flex: 1;
    -ms-flex: 1 1 0px;
    flex: 1 1 0;
  }



  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 .5rem;
  }

  table tr th,
  table tr td {
    border-top: 2px solid var(--border-primary);
    border-bottom: 2px solid var(--border-primary);
    text-align: center;
    padding: 1rem;
  }
  table tr th:first-child,
  table tr td:first-child {
    text-align: left;
    border-left: 2px solid var(--border-primary);
  }

  table tr th:last-child,
  table tr td:last-child {
    text-align: right;
    border-right: 2px solid var(--border-primary);
  }

  .actions-column {
    position: relative;
  }

  .actions-button {
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
    margin-left: auto;
    cursor: pointer;
  }

  .actions {
    z-index: 10;
    position: absolute;
    top: 100%;
    right: 0;
    -webkit-box-shadow: 0 0 12px rgba(0,0,0,.16);
    -moz-box-shadow: 0 0 12px rgba(0,0,0,.16);
    box-shadow: 0 0 12px rgba(0,0,0,.16);
    background-color: var(--background-primary);
    padding: 1rem;
    -webkit-border-radius: .25rem;
    -moz-border-radius: .25rem;
    border-radius: .25rem;
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
    gap: 1rem;
    min-width: 10rem;
  }

  label {
    font-size: .75rem;
    font-weight: bold;
  }

  input,
  select,
  textarea {
    border: 2px solid var(--border-primary);
    -webkit-border-radius: .25rem;
    -moz-border-radius: .25rem;
    border-radius: .25rem;
    padding: .25rem .5rem;
    font-size: .875rem;
  }

  .load-more {
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
    padding: .5rem 0;
  }

  .dialog-grid-item {
    display: -webkit-box;
    display: -webkit-flex;
    display: -moz-box;
    display: -ms-flexbox;
    display: flex;
    padding: .5rem 1rem;
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
    gap: .5rem;
  }

  .dialog-grid-item:not(.half) {
    width: 100%;
  }

  .dialog-grid-item.half {
    width: 50%;
  }
</style>