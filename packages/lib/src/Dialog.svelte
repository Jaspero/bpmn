<script lang="ts">
  import { clickOutside } from './click-outside';

  export let showing: boolean;
</script>

{#if showing}
  <div class="overlay">
    <form class="dialog" use:clickOutside={true} on:click_outside={() => (showing = false)} on:submit|preventDefault>
      {#if $$slots.header}
        <div class="dialog-header">
          <h2 class="dialog-header-title">
            <slot name="header" />
          </h2>

          <button
            class="dialog-header-close"
            on:click={() => (showing = false)}
          >
            <span class="material-symbols-outlined"> close </span>
          </button>
        </div>
      {/if}

      {#if $$slots.default}
        <div class:border-top={$$slots.header} class:border-bottom={$$slots.actions}>
          <slot />
        </div>
      {/if}

      {#if $$slots.actions}
        <div class="dialog-actions">
          <slot name="actions" />
        </div>
      {/if}
    </form>
  </div>
{/if}

<style>
  .overlay {
    z-index: 20;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,.25);
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
    -webkit-border-radius: .25rem;
    -moz-border-radius: .25rem;
    border-radius: .25rem;
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
  }

  .dialog-header-title {
    font-size: 1.5rem;
    font-weight: bold;
  }

  .dialog-header-close {
    width: 2rem;
    height: 2rem;
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
  }

  .border-top {
    border-top: 1px solid var(--border-primary);
  }

  .border-bottom {
    border-bottom: 1px solid var(--border-primary);
  }
</style>