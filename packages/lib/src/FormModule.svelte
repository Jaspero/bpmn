<script lang="ts">
  import '@jaspero/web-components/dist/input.wc';
  import '@jaspero/web-components/dist/select.wc';
  import '@jaspero/web-components/dist/multiselect.wc';
  import '@jaspero/web-components/dist/datepicker.wc';
  import '@jaspero/web-components/dist/image-upload.wc';
  import '@jaspero/web-components/dist/quill.wc';
  import '@jaspero/web-components/dist/textarea.wc';
  import '@jaspero/web-components/dist/checkbox.wc';
  import '@jaspero/web-components/dist/image-upload.wc';

  import { ModularSchema, ModularView } from '@jaspero/modular';
  import { createEventDispatcher } from 'svelte';

  export let items: any[];
  export let value: any;

  export let render: any = null;
  
  const dispatch = createEventDispatcher();

  let containerElement: HTMLDivElement;
  let itemsCache: any[];

  $: if (items && containerElement && items !== itemsCache) {
    itemsCache = items;
    reRender();
  }

  function reRender() {
    const schema = new ModularSchema({});
    const instance = schema.createInstance(value || {});

    const view = new ModularView({
      componentPrefix: '',
      schema,
      views: [
        {
          items
        }
      ]
    });

    render = view.render({
      parentElement: containerElement,
      instance
    });

    render.addEventListener('change', (change) => {
      value = change;
      dispatch('value', value);
    });
  }
</script>

<div bind:this={containerElement} />
