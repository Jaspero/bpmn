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

<div class="p-4">
  <div class="flex">
    <div class="flex gap-4 flex-1">
      <Search />
      <Button variant="outlined" on:click={() => (filters = true)}>Filters</Button>
    </div>

    <Button on:click={openCreate}>Add BPMN</Button>
  </div>

  <table class="w-full border-separate border-spacing-y-4">
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
        <td class="relative">
          <button
            class="flex items-center justify-center ml-auto cursor-pointer"
            on:click|stopPropagation={() => togglePopup(index)}
          >
            <span class="material-symbols-outlined">more_horiz</span>
          </button>
          {#if popup === index}
            <div
              class="absolute z-10 top-full right-0 shadow-xl bg-white p-4 rounded-lg flex flex-col gap-4 min-w-[10rem]"
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
    <div class="w-max mx-auto">
      <Button variant="outlined" {loading}>Load more</Button>
    </div>
  {/if}
</div>

<Dialog bind:showing={filters} on:submit={adjustFilters}>
  <slot slot="header">Filters</slot>

  <div class="flex flex-col gap-4 p-4">
    <div class="flex gap-4">
      <div class="flex flex-col gap-1 w-1/2">
        <label for="startDate">Start date</label>
        <input type="date" id="startDate" />
      </div>

      <div class="flex flex-col gap-1 w-1/2">
        <label for="startDate">End date</label>
        <input type="date" id="endDate" />
      </div>
    </div>

    <div class="flex flex-col gap-1">
      <label for="email">Email</label>
      <input type="email" id="email" />
    </div>

    <div class="flex flex-col gap-1">
      <label for="role">Role</label>
      <select name="role" id="role">
        <option value="" selected disabled>Select a role</option>
        <option value="admin">Admin</option>
        <option value="user">User</option>
      </select>
    </div>

    <div class="flex flex-col gap-1">
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

  <div class="flex flex-col gap-4 p-4">
    <div class="flex flex-col gap-1">
      <label for="name">Name</label>
      <input id="name" bind:value={form.name} required />
    </div>

    <div class="flex flex-col gap-1">
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

    <div class="flex flex-col">
      {#each versionsObj.versions as version}
        <div class="px-5 my-1">
          <span class="mr-2">Version: {version}</span>
          <Button variant="outlined" on:click={dispatch('editVersion', {id: versionsObj.id, version: version})}>Edit</Button>
          {#if version != versionsObj.version}
            <Button loading={versionDelLoading} on:click={() => delVersion(versionsObj.id, version)}>Delete</Button>
          {:else}
            <div></div>
          {/if}
        </div>
      {/each}
    </div>
</Dialog>

<style lang="postcss">
  table tr th,
  table tr td {
    @apply border-t-2 border-b-2 first:border-l-2 first:rounded-l-lg last:border-r-2 last:rounded-r-lg first:text-left text-center last:text-right p-4;
  }
</style>