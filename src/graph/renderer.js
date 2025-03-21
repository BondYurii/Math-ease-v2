let elt = document.getElementById('calculator');
var calculator = Desmos.GraphingCalculator(elt);
let isGeometrieLoaded = false;
let is3DLoaded = false;

// Tab switching logic
document.getElementById('graph-tab').addEventListener('click', showGraphCalculator);
document.getElementById('geometrie-tab').addEventListener('click', showGeometrieCalculator);
document.getElementById('3d-tab').addEventListener('click', show3DCalculator);

// Show the 2D graph calculator
function showGraphCalculator() {
	setActiveTab('graph-tab');
	document.getElementById('calculator').classList.add('active');
	document.getElementById('geometrie-calculator').classList.remove('active');
	document.getElementById('3d-calculator').classList.remove('active');
}

// Show the Geometrie calculator
function showGeometrieCalculator() {
	setActiveTab('geometrie-tab');
	document.getElementById('calculator').classList.remove('active');
	document.getElementById('geometrie-calculator').classList.add('active');
	document.getElementById('3d-calculator').classList.remove('active');
	
	// Load the Geometrie iframe if not already loaded
	if (!isGeometrieLoaded) {
		document.getElementById('geometrie-calculator').src = 'https://www.desmos.com/geometry?lang=de';
		isGeometrieLoaded = true;
	}
}

// Show the 3D calculator
function show3DCalculator() {
	setActiveTab('3d-tab');
	document.getElementById('calculator').classList.remove('active');
	document.getElementById('geometrie-calculator').classList.remove('active');
	document.getElementById('3d-calculator').classList.add('active');
	
	// Load the 3D iframe if not already loaded
	if (!is3DLoaded) {
		document.getElementById('3d-calculator').src = 'https://www.desmos.com/3d?lang=de';
		is3DLoaded = true;
	}
}

// Set active tab styling
function setActiveTab(tabId) {
	document.querySelectorAll('.calculator-tab').forEach(tab => {
		tab.classList.remove('active');
	});
	document.getElementById(tabId).classList.add('active');
}

// Close button
document.getElementById('close-btn').addEventListener('click', () => {
	// Call the secure API exposed by the preload script
	window.electronAPI.close();
});

// Handle SVG requests from main process
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

// Handle incoming expression data
window.electronAPI.onContentData((data) => {
	try {
		calculator.setExpressions(JSON.parse(data));
	} catch (error) {
		console.error('Error setting content data:', error);
	}
});

// Three dots behavior for maximize/minimize
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
