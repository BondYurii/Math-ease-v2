const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	setScreenSize: (isMaximized) => ipcRenderer.send('set-screen-size', {isMaximized, type: 'info'}),
	close: () => ipcRenderer.send('close', 'info'),
	send: (message, ...args) => {
		ipcRenderer.send(message, ...args);
	},
});
