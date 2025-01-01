const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');

let isDrawing = false;
let strokes = {x: [], y: []};
let undoneStrokes = {x: [], y: []};
let currentStroke = [];
let latex = '';
let debounceTimeout;
let ongoingRequest = null;

// Set canvas width to half of the window width
canvas.width = window.innerWidth / 2;

// Adjust canvas width on window resize
window.addEventListener('resize', () => {
	canvas.width = window.innerWidth / 2;
	canvas.height = window.innerHeight - 100;
	redrawCanvas();
});

// Start drawing
canvas.addEventListener('mousedown', (event) => {
	isDrawing = true;
	currentStroke = [];
	ctx.beginPath();
	const {x, y} = getRelativeCoordinates(event);
	ctx.moveTo(x, y);
});

// Track the drawing
canvas.addEventListener('mousemove', (event) => {
	if (!isDrawing) return;

	const {x, y} = getRelativeCoordinates(event);
	currentStroke.push({x, y});

	// Draw on the canvas
	ctx.lineTo(x, y);
	ctx.stroke();
});

// End drawing
canvas.addEventListener('mouseup', () => {
	isDrawing = false;

	// Add the stroke to the strokes array
	if (currentStroke.length > 0) {
		strokes.x.push(currentStroke.map((point) => point.x));
		strokes.y.push(currentStroke.map((point) => point.y));
		undoneStrokes = {x: [], y: []}; // Clear the undone strokes
	}

	// Debounce the API request
	if (debounceTimeout) clearTimeout(debounceTimeout);
	debounceTimeout = setTimeout(() => {
		sendStrokesToAPI();
	}, 1000);
	ctx.beginPath();
});

// Clear canvas
document.getElementById('clearButton').addEventListener('click', () => {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	strokes = {x: [], y: []};
	undoneStrokes = {x: [], y: []};
});

// Undo last stroke
document.getElementById('undoButton').addEventListener('click', () => {
	if (strokes.x.length > 0) {
		undoneStrokes.x.push(strokes.x.pop());
		undoneStrokes.y.push(strokes.y.pop());
		redrawCanvas();
	}
});

// Redo last undone stroke
document.getElementById('redoButton').addEventListener('click', () => {
	if (undoneStrokes.x.length > 0) {
		strokes.x.push(undoneStrokes.x.pop());
		strokes.y.push(undoneStrokes.y.pop());
		redrawCanvas();
	}
});

// Redraw the canvas
function redrawCanvas() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (let i = 0; i < strokes.x.length; i++) {
		ctx.beginPath();
		for (let j = 0; j < strokes.x[i].length; j++) {
			const x = strokes.x[i][j];
			const y = strokes.y[i][j];
			if (j === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		}
		ctx.stroke();
	}
}

// Helper function to get coordinates relative to the canvas
function getRelativeCoordinates(event) {
	const rect = canvas.getBoundingClientRect();
	return {
		x: event.clientX - rect.left,
		y: event.clientY - rect.top,
	};
}

// Helper function to send strokes to the MathPix API
async function sendStrokesToAPI() {
	if (ongoingRequest) {
		ongoingRequest.abort();
	}

	const controller = new AbortController();
	ongoingRequest = controller;

	try {
		const strokesData = {strokes};
		if (!strokes.x.length || !strokes.y.length) throw new Error('No data available');
		const result = await window.electronAPI.sendStrokes(strokesData, {signal: controller.signal});
		// If LaTeX is available, render it
		if (result.latex_styled) {
			updateMathOutput(result.latex_styled);
		}
	} catch (error) {
		if (error.name === 'AbortError') {
			console.log('Request was aborted');
		} else {
			console.error('Error recognizing strokes:', error);
		}
	} finally {
		ongoingRequest = null;
	}
}

const mathOutput = document.getElementById('mathOutput');

function updateMathOutput(latex) {
	if (latex.trim()) {
		mathOutput.setValue(latex);
	} else {
		mathOutput.setValue('');
	}
}

const convertToSvg = function (tex, scale = 5) {
	const wrapper = MathJax.tex2svg(tex);
	const svg = wrapper.querySelector('svg');
	const width = svg.getAttribute('width').replace('ex', '') * scale;
	const height = svg.getAttribute('height').replace('ex', '') * scale;

	// Set the new width and height
	svg.setAttribute('width', `${width}ex`);
	svg.setAttribute('height', `${height}ex`);

	// Adjust the viewBox to scale the SV
	// svg.setAttribute('viewBox', viewBox.join(' '));
	return svg;
};

document.getElementById('close-btn').addEventListener('click', () => {
	window.electronAPI.send('close', 'ocr');
});

// Select the resizable element
const threeDots = document.querySelector('.three-dots');
let isMaximized = false;

threeDots.addEventListener('click', () => {
	if (isMaximized) {
		// Minimize to original size
		window.electronAPI.send('set-screen-size', {isMaximized: true, type: 'ocr'});
	} else {
		// Maximize to full width and 400px height
		window.electronAPI.send('set-screen-size', {isMaximized: false, type: 'ocr'});
	}
	isMaximized = !isMaximized;
});

window.electronAPI.on('request-svg', (event) => {
	try {
		const latex = document.getElementById('mathOutput').value;
		if (!latex) throw new Error('No text available!');
		const svg = convertToSvg(latex);

		if (svg.outerHTML) {
			window.electronAPI.send('send-svg-to-main', {type: 'ocr', data: {latex, strokes}, svgString: svg.outerHTML});
		} else {
			throw Error('Getting svg failed');
		}
	} catch (e) {
		console.log('Error:', e);
	}
});

window.electronAPI.on('content-data', (content) => {
	if (content) {
		const {strokes, latex: latexData} = JSON.parse(content);
		updateMathOutput(latexData);

		// Clear the canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw the strokes on the canvas
		for (let i = 0; i < strokes.x.length; i++) {
			ctx.beginPath();
			for (let j = 0; j < strokes.x[i].length; j++) {
				const x = strokes.x[i][j];
				const y = strokes.y[i][j];
				if (j === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			}
			ctx.stroke();
		}
	} else {
		console.log('No content to edit!');
	}
});

document.querySelector('math-field').addEventListener('focus', () => {
	mathVirtualKeyboard.layouts = ['numeric', 'symbols'];
	mathVirtualKeyboard.visible = true;
});
