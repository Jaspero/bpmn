<script lang="ts">
  export let href: string | null = null;
  export let variant: 'filled' | 'outlined' = 'filled';
  export let loading = false;
  export let type: 'button' | 'submit' = 'button';
</script>

{#if href}
  <a class={variant} class:loading {href}>
    {#if loading}
        <div class="loading-spinner" />
        Loading...
    {:else}
      <slot />
    {/if}
  </a>
{:else}
  <button {type} class={variant} class:loading on:click>
    {#if loading}
        <div class="loading-spinner" />
        Loading...
    {:else}
      <slot />
    {/if}
  </button>
{/if}

<style>
  a,
  button {
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
    border: 2px solid transparent;
    text-align: center;
    min-width: 4rem;
    padding: 0 1rem;
    font-weight: bold;
    cursor: pointer;
  }

  .outlined {
    border-color: var(--border-primary);
  }

  .filled {
    background-color: var(--primary-color);
    color: var(--text-on-primary);
  }

  .loading {
    border-color: var(--primary-color);
    background-color: transparent;
    color: var(--text-primary);
    gap: .75rem;
    font-weight: 400;
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
