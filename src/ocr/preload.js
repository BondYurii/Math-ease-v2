const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	on: (channel, func) => {
		ipcRenderer.on(channel, (event, ...args) => func(...args));
	},
	send: (message, args) => {
		ipcRenderer.send(message, args);
	},
	sendStrokes: (strokesData) => ipcRenderer.invoke('send-strokes', strokesData),
});
