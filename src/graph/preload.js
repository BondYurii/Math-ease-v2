const {contextBridge, ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
	close: () => ipcRenderer.send('close', 'graph'),
	onRequestSVG: (callback) =>
		ipcRenderer.on('request-svg', (event) => {
			callback(event);
		}),
	sendSVG: (svgData) => ipcRenderer.send('send-svg-to-main', svgData),
	onContentData: (callback) => {
		ipcRenderer.on('content-data', (event, data) => callback(data));
	},
	onActivateGeometrie: (callback) => {
		ipcRenderer.on('activate-geometrie', () => callback());
	},
	onActivateThreed: (callback) => {
		ipcRenderer.on('activate-threed', () => callback());
	},
	setScreenSize: (isMaximized) => ipcRenderer.send('set-screen-size', {isMaximized, type: 'graph'}),
	send: (message, args) => {
		ipcRenderer.send(message, args);
	}
});
