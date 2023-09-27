<script lang="ts">
  import { onMount, createEventDispatcher} from 'svelte'
  import type { BPMNService } from '../types/bpmn.service';
  import {state} from '../state.service'

  export let bpmnService: BPMNService; 

  export let DMNs = [];
  let DMNVersions = [];

  export let fields = {
    DMN: '',
    version: ''
  }

  export function reset() {
    fields = {
      DMN: '',
      version: ''
    }
  }

  export function setFields(newFields){
    fields = newFields
  }

  const dispatch = createEventDispatcher()

  $: dispatch('change', {fields})

  onMount(async () => {
    bpmnService = state.service
    DMNs = await bpmnService.getDMNs()
    DMNs.forEach(el => DMNVersions[el.id] = el.versions)
  })
</script>


<select id="dmn" bind:value={fields.DMN} on:change={() => fields = fields}>
  {#each DMNs as dmn}
    <option value={dmn.id}>{dmn.name}</option>
  {/each}
</select>
{#if fields.DMN}
  <select id="dmn-version" bind:value={fields.version} on:change={() => fields = fields}>
    {#each DMNVersions[fields.DMN] as version}
      <option value={version}>{version}</option>
    {/each}
</select>
{/if}