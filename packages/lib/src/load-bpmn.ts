let loaded = false;

function loadScript(url: string) {
	return new Promise(resolve => {
		const scriptEl = document.createElement('script');
		
		scriptEl.src = url;
		scriptEl.onload = resolve;

		document.getElementsByTagName('head')[0].appendChild(scriptEl);
	})
}

function loadCss(url: string) {
	return new Promise(resolve => {
		const link = document.createElement('link');

		link.href = url;
		link.type = 'text/css';
		link.rel = 'stylesheet';
		link.onload = resolve;

		document.getElementsByTagName('head')[0].appendChild(link);
	})
}

export async function loadBpmn() {
	if (loaded) {
		return;
	}

	await loadCss(`https://unpkg.com/bpmn-js@13.2.2/dist/assets/bpmn-js.css`);
	console.log(123);
	await loadCss(`https://unpkg.com/bpmn-js@13.2.2/dist/assets/diagram-js.css`);
	await loadCss(`https://unpkg.com/bpmn-js@13.2.2/dist/assets/bpmn-font/css/bpmn.css`);

	await loadScript(`https://unpkg.com/bpmn-js@13.2.2/dist/bpmn-modeler.development.js`);
	console.log(45);

	loaded = true;
}