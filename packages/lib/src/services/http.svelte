<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { BPMNService } from '../types/bpmn.service';
  import { state } from '../state.service';

  let bpmnService: BPMNService;

  export let fields = {
    method: 'GET',
    url: '',
    headers: [{ name: '', value: '' }]
  };

  export function reset() {
    fields = {
      method: 'GET',
      url: '',
      headers: [{ name: '', value: '' }]
    };
  }

  export function setFields(newFields) {
    fields = newFields;
  }

  const dispatch = createEventDispatcher();

  $: dispatch('change', { fields });

  onMount(() => {
    bpmnService = state.service;
  });
</script>

<label for="url">method</label>
<select id="method" bind:value={fields.method} on:change={() => (fields = fields)}>
  {#each ['GET', 'POST', 'PUT', 'DELETE'] as method}
    <option>{method}</option>
  {/each}
</select>
<label for="url">url</label>
<input
  id="url"
  type="text"
  placeholder="http://url.com"
  bind:value={fields.url}
  on:change={() => (fields = fields)}
/>

<label>headers</label>
{#each fields?.headers as header}
  <input
    type="text"
    placeholder="name"
    bind:value={header.name}
    on:change={() => (fields = fields)}
  />
  <input
    type="text"
    placeholder="value"
    bind:value={header.value}
    on:change={() => (fields = fields)}
  />
{/each}
<button
  on:click|preventDefault={() => {
    fields.headers.push({ name: '', value: '' });
    fields = fields;
  }}>
  add header
</button>
{#if fields?.headers.length > 1}
  <button
    on:click|preventDefault={() => {
      fields.headers.pop();
      fields = fields;
    }}>
    remove header
  </button>
{/if}
