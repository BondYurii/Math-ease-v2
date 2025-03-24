import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Excalidraw, exportToSvg } from '@excalidraw/excalidraw';
// Fix for CSS path
const electron = require('electron');
const { ipcRenderer } = electron;

// Set assets path for Excalidraw - this needs to happen before component mounts
window.EXCALIDRAW_ASSET_PATH = "./libs/excalidraw-assets/";

// Setup close button handler
document.getElementById('close-btn')?.addEventListener('click', () => {
	ipcRenderer.send('close', 'whiteboard');
});
const App = () => {
	const [excalidrawAPI, setExcalidrawAPI] = React.useState(null);

	// Function to export SVG
	const handleExportSVG = async () => {
		try {
			const {exportToSvg} = ExcalidrawLib;

			if (!excalidrawAPI) {
				console.error('Excalidraw API is not available!');
				return;
			}

			const elements = excalidrawAPI.getSceneElements();
			const svg = await exportToSvg({
				elements,
				appState: {
					exportWithDarkMode: false, // Optional: handle dark mode
				},
			});

			// Serialize SVG and send it back to main process
			const svgString = new XMLSerializer().serializeToString(svg);

			ipcRenderer.send('send-svg-to-main', {type: 'whiteboard', data: elements, svgString}); // Send SVG to main process
		} catch (error) {
			console.error('Error exporting SVG:', error);
		}
	};

	function getData(event, data) {
		try {
			excalidrawAPI.updateScene({
				elements: JSON.parse(data),
				appState: {
					gridSize: 5,
				},
			});
		} catch (error) {
			console.log(error);
		}
	}

	// Attach IPC Listener
	React.useEffect(() => {
		ipcRenderer.on('request-svg', handleExportSVG);
		ipcRenderer.on('content-data', getData);

		if (excalidrawAPI) {
			excalidrawAPI.updateScene({
				appState: {
					gridSize: 5,
				},
			});
		}
		return () => {
			ipcRenderer.removeListener('request-svg', handleExportSVG);
			ipcRenderer.removeListener('content-data', getData); // Clean up listener
		};
	}, [excalidrawAPI]);

	return React.createElement(
		React.Fragment,
		null,
		React.createElement(
			'div',
			{
				style: {height: '500px', position: 'relative'},
			},
			React.createElement(ExcalidrawLib.Excalidraw, {
				onCollabButtonClick: () => alert('Collab!'), // Example API use
				excalidrawAPI: (api) => setExcalidrawAPI(api), // Save API to state
			}),
		),
	);
};

const excalidrawWrapper = document.getElementById('app');
const root = ReactDOM.createRoot(excalidrawWrapper);
root.render(React.createElement(App));
// Select the resizable element
document.getElementById('close-btn').addEventListener('click', () => {
	ipcRenderer.send('close', 'whiteboard');
});
const threeDots = document.querySelector('.three-dots');
let isMaximized = false;

threeDots.addEventListener('click', () => {
	if (isMaximized) {
		// Minimize to original size
		ipcRenderer.send('set-screen-size', {isMaximized: true, type: 'whiteboard'});
	} else {
		// Maximize to full width and 400px height
		ipcRenderer.send('set-screen-size', {isMaximized: false, type: 'whiteboard'});
	}
	isMaximized = !isMaximized;
});
