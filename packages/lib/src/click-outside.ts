export function clickOutside(node: any, options?: boolean | AddEventListenerOptions): any {
  function dispatch() {
    node.dispatchEvent(new CustomEvent('click_outside', node));
  }

  function handleClick(event: MouseEvent) {
    if (node && !node.contains(event.target) && !event.defaultPrevented) {
      dispatch();
    }
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      dispatch();
    }
  }

  window.addEventListener('keydown', handleEscape, true);
  document.addEventListener('click', handleClick, options);

  return {
    destroy() {
      document.removeEventListener('click', handleClick, options);
      window.removeEventListener('keydown', handleEscape, true);
    }
  };
}
