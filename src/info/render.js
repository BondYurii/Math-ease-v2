// const {remote, ipcRenderer} = require('electron/renderer');
// const {screen} = require('electron/main');

// Handle the close button
document.getElementById('close-btn').addEventListener('click', () => {
	window.electronAPI.close();
});

// Select the resizable element
const resizable = document.querySelector('#drag-region');
console.log(resizable);
let isResizing = false;

// Listen for mousedown to start resizing
// resizable.addEventListener('mousedown', (e) => {
// 	isResizing = true;
// 	const startY = e.screenY;
// 	const startHeight = window.outerHeight;
// 	const windowPoistionY = window.screenY;
// 	// Listen for mousemove to calculate new dimensions
// 	const onMouseMove = (e) => {
// 		if (isResizing) {
// 			// Send new dimensions to the main process
// 			ipcRenderer.send('resize-window', {y: windowPoistionY + e.screenY - startY, height: startHeight - e.screenY + startY, type: 'info'});
// 		}
// 	};

// 	// Listen for mouseup to stop resizing
// 	const onMouseUp = () => {
// 		isResizing = false;
// 		window.removeEventListener('mousemove', onMouseMove);
// 		window.removeEventListener('mouseup', onMouseUp);
// 	};

// 	window.addEventListener('mousemove', onMouseMove);
// 	window.addEventListener('mouseup', onMouseUp);
// });
// Handle the three dots click for toggling maximize/minimize
// Select the resizable element
const threeDots = document.querySelector('.three-dots');
let isMaximized = false;

threeDots.addEventListener('click', () => {
	if (isMaximized) {
		// Minimize to original size
		window.electronAPI.send('set-screen-size', {isMaximized: true, type: 'info'});
	} else {
		// Maximize to full width and 400px height
		window.electronAPI.send('set-screen-size', {isMaximized: false, type: 'info'});
	}
	isMaximized = !isMaximized;
});
