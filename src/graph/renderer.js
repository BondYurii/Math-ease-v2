// Get the calculator container element
const calculatorElement = document.getElementById('calculator');

// Track current calculator mode
let currentMode = 'graph';

// Initialize calculator instance
let calculator = Desmos.GraphingCalculator(calculatorElement);

// Tab switching logic
document.getElementById('graph-tab').addEventListener('click', showGraphCalculator);
document.getElementById('geometrie-tab').addEventListener('click', showGeometrieCalculator);
document.getElementById('3d-tab').addEventListener('click', show3DCalculator);

// Function to switch calculator modes
function switchCalculatorMode(mode) {
	// Save state if needed for future implementation
	
	// Destroy the current calculator
	if (calculator) {
		calculator.destroy();
	}
	
	// Create the appropriate calculator type
	switch(mode) {
		case 'graph':
			calculator = Desmos.GraphingCalculator(calculatorElement, {
				expressions: true,
				settingsMenu: false,
				zoomButtons: true,
				expressionsTopbar: true,
				border: false,
				lockViewport: false,
				expressionsCollapsed: false,
				language: 'de'
			});
			currentMode = 'graph';
			break;
		
		case 'geometrie':
			// Check if Desmos.Geometry exists
			if (typeof Desmos.Geometry === 'function') {
				console.log('Using Desmos.Geometry for geometrie mode');
				calculator = Desmos.Geometry(calculatorElement, {
					border: false
				});
				currentMode = 'geometrie';
			} else {
				// Fallback to GraphingCalculator with modified settings
				console.log('Desmos.Geometry not available, using GraphingCalculator as fallback');
				calculator = Desmos.GraphingCalculator(calculatorElement, {
					expressions: false,  // Hide expressions panel for geometry-like experience
					settingsMenu: false,
					zoomButtons: true,
					expressionsTopbar: false,
					border: false,
					lockViewport: false,
					expressionsCollapsed: true,
					language: 'de'
				});
				currentMode = 'graph'; // Use graph mode internally
			}
			break;
			
		case 'threed':
			calculator = Desmos.Calculator3D(calculatorElement, {
				settingsMenu: false,
				zoomButtons: true,
				expressionsTopbar: true,
				border: false,
				lockViewport: false,
				language: 'de'
			});
			currentMode = 'threed';
			break;
	}
}

// Show the 2D graph calculator
function showGraphCalculator() {
	setActiveTab('graph-tab');
	switchCalculatorMode('graph');
}

// Show the Geometrie calculator (uses a cleaner UI)
function showGeometrieCalculator() {
	setActiveTab('geometrie-tab');
	switchCalculatorMode('geometrie'); // Now it has its own special configuration
}

// Show the 3D calculator
function show3DCalculator() {
	setActiveTab('3d-tab');
	switchCalculatorMode('threed');
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
		if (currentMode === 'threed') {
			try {
				try {
					const opts = {
						width: 300,
						height: 500,
					};

					try {
						const state = calculator.getState(); 
						var svgString = calculator.screenshot(opts);
						if (!svgString) {
							console.error('3D screenshot failed - empty result');
							return;
						}
						window.electronAPI.sendSVG({ type: 'threed', data: state, svgString });				
					} catch (error) {
						console.error('Error taking 3D screenshot:', error);
					}

				} catch (error) {
					console.error('Error taking 3D screenshot:', error);
				}
			} catch (error) {
				console.error('Error taking 3D screenshot:', error);
			}
		} 
		else if (currentMode === 'geometrie') {
			// Geometrie calculator handling
			const opts = {
				width: 300,
				height: 500,
				targetPixelRatio: 2
			};
	
			try {
				const state = calculator.getState(); 
				var svgString = calculator.screenshot(opts);
				if (!svgString) {
					console.error('Geometrie screenshot failed - empty result');
					return;
				}
				window.electronAPI.sendSVG({ type: 'geometrie', data: state, svgString });				
			} catch (error) {
				console.error('Error taking geometrie screenshot:', error);
			}
		}
		else {
			// Graph calculator handling
			try {
				const opts = {
					mode: 'stretch',
					width: 300,
					height: 500,
					showLabels: true,
					format: 'svg',
				};
		
				const data = calculator.getExpressions();
				calculator.asyncScreenshot(opts, (svgString) => {
					window.electronAPI.sendSVG({type: 'graph', data, svgString});
				});
			} catch (error) {
				console.error('Error taking graph screenshot:', error);
			}
		}
	} catch (error) {
		console.error('Error capturing screenshot:', error);
	}
});

// Handle incoming expression data
window.electronAPI.onContentData((data) => {
	try {
		// Different calculators have different methods to restore state
		if (currentMode === 'geometrie' || currentMode === 'threed') {
			// For geometrie and threed modes, we need to use setState
			console.log('Restoring state for', data);
			if (data && data !== 'undefined') {
				const parsedData = JSON.parse(data);
				calculator.setState(parsedData);
				console.log('Restored state for', currentMode);
			}
		} else {
			console.log('Restoring state for-------------', data);
			// Graph mode uses setExpressions
			calculator.setExpressions(JSON.parse(data));
		}
	} catch (error) {
		console.error('Error setting content data:', error, 'mode:', currentMode);
	}
});

// Handle geometrie mode activation
window.electronAPI.onActivateGeometrie(() => {
	showGeometrieCalculator();
});

// Handle threed mode activation
window.electronAPI.onActivateThreed(() => {
	show3DCalculator();
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

// // Handle SVG requests from main process
// window.electronAPI.onRequestSVG(() => {
// 	try {
// 		console.log('Request SVG received, current mode:', currentMode);
		
// 		// Get SVG based on current calculator mode
// 		if (currentMode === 'threed') {
// 			// 3D calculator handling
// 			try {
// 				calculator.screenshot({
// 					width: 800,
// 					height: 600,
// 					targetPixelRatio: 2
// 				}, (dataURL) => {
// 					if (!dataURL) {
// 						console.error('3D screenshot failed - empty result');
// 						return;
// 					}
					
// 					// Get state and send with specific type
// 					try {
// 						const state = calculator.getState();
// 						window.electronAPI.sendSVG(dataURL, 'threed', JSON.stringify(state));
// 						console.log('3D calculator data sent successfully');
// 					} catch (stateError) {
// 						console.error('Error getting 3D state:', stateError);
// 						window.electronAPI.sendSVG(dataURL, 'threed', '{}');
// 					}
// 				});
// 			} catch (error) {
// 				console.error('Error taking 3D screenshot:', error);
// 			}
// 		} 
// 		else if (currentMode === 'geometrie') {
// 			// Geometrie calculator handling
// 			try {
// 				calculator.screenshot({
// 					width: 800, 
// 					height: 600,
// 					targetPixelRatio: 2
// 				}, (svgString) => {
// 					if (!svgString) {
// 						console.error('Geometrie screenshot failed - empty result');
// 						return;
// 					}
					
// 					// Get state and send as geometrie type
// 					try {
// 						const state = calculator.getState();
// 						window.electronAPI.sendSVG(svgString, 'geometrie', JSON.stringify(state));
// 						console.log('Geometrie calculator data sent successfully');
// 					} catch (stateError) {
// 						console.error('Error getting geometrie state:', stateError);
// 						window.electronAPI.sendSVG(svgString, 'geometrie', '{}');
// 					}
// 				});
// 			} catch (error) {
// 				console.error('Error taking geometrie screenshot:', error);
// 			}
// 		}
// 		else {
// 			// Graph calculator handling
// 			try {
// 				calculator.screenshot({
// 					width: 800,
// 					height: 600,
// 					targetPixelRatio: 2,
// 					format: 'svg',
// 					mode: 'stretch',
// 					showLabels: true
// 				}, (svgString) => {
// 					if (!svgString) {
// 						console.error('Graph screenshot failed - empty result');
// 						return;
// 					}
					
// 					// Get state and send
// 					try {
// 						const state = calculator.getState();
// 						window.electronAPI.sendSVG(svgString, 'graph', JSON.stringify(state));
// 						console.log('Graph calculator data sent successfully');
// 					} catch (stateError) {
// 						console.error('Error getting graph state:', stateError);
// 						window.electronAPI.sendSVG(svgString, 'graph', '{}');
// 					}
// 				});
// 			} catch (error) {
// 				console.error('Error taking graph screenshot:', error);
// 			}
// 		}
// 	} catch (error) {
// 		console.error('Error handling request SVG:', error);
// 	}
// });
