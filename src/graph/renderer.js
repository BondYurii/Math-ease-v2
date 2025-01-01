let elt = document.getElementById('calculator');
var calculator = Desmos.GraphingCalculator(elt);
document.getElementById('close-btn').addEventListener('click', () => {
	// Call the secure API exposed by the preload script
	window.electronAPI.close();
});

window.electronAPI.onRequestSVG(() => {
	try {
		const opts = {
			mode: 'stretch',
			width: 300,
			height: 500,
			showLabels: true,
			format: 'svg',
		};

		// Access `globalCalculator` directly from the window object
		const data = calculator.getExpressions();
		calculator.asyncScreenshot(opts, (svgString) => {
			// Send the SVG data back to the main process
			window.electronAPI.sendSVG({type: 'graph', data, svgString});
		});
	} catch (error) {
		console.error('Error generating SVG:', error);
	}
});

window.electronAPI.onContentData((data) => {
	try {
		calculator.setExpressions(JSON.parse(data));
	} catch (error) {
		console.error('Error setting content data:', error);
	}
});
document.getElementById('close-btn').addEventListener('click', () => {
	window.electronAPI.close();
});
// Select the resizable element
const threeDots = document.querySelector('.three-dots');
let isMaximized = false;

threeDots.addEventListener('click', () => {
	if (isMaximized) {
		// Minimize to original size
		window.electronAPI.send('set-screen-size', {isMaximized: true, type: 'graph'});
	} else {
		// Maximize to full width and 400px height
		window.electronAPI.send('set-screen-size', {isMaximized: false, type: 'graph'});
	}
	isMaximized = !isMaximized;
});
