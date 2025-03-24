const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	showInfo: () => ipcRenderer.send('show-info'),
	closeInfo: () => ipcRenderer.send('close-info'),
	showDesmos: () => ipcRenderer.send('show-desmos'),
	showWhiteboard: () => ipcRenderer.send('show-whiteboard'),
	showLatex: () => ipcRenderer.send('show-latex'),
	showGraph: () => ipcRenderer.send('show-graph'),
	showOcr: () => ipcRenderer.send('show-ocr'),
	copy: () => ipcRenderer.send('copy'),
	edit: () => ipcRenderer.send('edit'),
	on: (channel, func) => {
		ipcRenderer.on(channel, (event, ...args) => func(...args));
	},
	onTriggerCopy: (func) => {
		ipcRenderer.on('trigger-copy', () => func());
	},
	onTriggerEdit: (func) => {
		ipcRenderer.on('trigger-edit', () => func());
	}
});
