<script lang="ts">
  export let href: string | null = null;
  export let variant: 'filled' | 'outlined' = 'filled';
  export let loading = false;
  export let type: 'button' | 'submit' = 'button';
</script>

{#if href}
  <a class={variant} {href}>
    {#if loading}
      <span class="flex items-center gap-4">
        <div class="w-8 h-8 border-4 border-black/25 border-l-white animate-spin rounded-full" />
        Loading...
      </span>
    {:else}
      <slot />
    {/if}
  </a>
{:else}
  <button {type} class={variant} on:click>
    {#if loading}
      <span class="flex items-center gap-4">
        <div class="w-8 h-8 border-4 border-black/25 border-l-white animate-spin rounded-full" />
        Loading...
      </span>
    {:else}
      <slot />
    {/if}
  </button>
{/if}

<style lang="postcss">
  a,
  button {
    @apply inline-block h-10 rounded-lg px-6 font-bold cursor-pointer;
  }

  a {
    @apply leading-10 text-center;
  }

  .filled {
    background-color: var(--primary);
    color: var(--primary-contrast);
  }

  .outlined {
    @apply border-2;
  }
</style>
