<script lang="ts">
  import { clickOutside } from './click-outside';

  export let showing: boolean;
</script>

{#if showing}
  <div class="z-20 fixed top-0 left-0 w-full h-full bg-black/25 flex justify-center items-center">
    <form class="bg-white rounded-lg" use:clickOutside={true} on:click_outside={() => (showing = false)} on:submit|preventDefault>
      {#if $$slots.header}
        <div class="flex justify-between items-center gap-4 p-4">
          <h2 class="text-xl font-bold">
            <slot name="header" />
          </h2>

          <button
            class="w-8 h-8 flex justify-center items-center"
            on:click={() => (showing = false)}
          >
            <span class="material-symbols-outlined"> close </span>
          </button>
        </div>
      {/if}

      {#if $$slots.default}
        <div class:border-t={$$slots.header} class:border-b={$$slots.actions}>
          <slot />
        </div>
      {/if}

      {#if $$slots.actions}
        <div class="flex items-center gap-4 p-4">
          <slot name="actions" />
        </div>
      {/if}
    </form>
  </div>
{/if}
