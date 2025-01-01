const {ipcRenderer} = require('electron/renderer');

const latexInput = document.getElementById('latexInput');
const mathOutput = document.getElementById('mathOutput');

latexInput.addEventListener('input', () => {
	const latexText = latexInput.value;
	updateMathOutput(latexText);
});

function updateMathOutput(latex) {
	if (latex.trim()) {
		mathOutput.setValue(latex);
	} else {
		mathOutput.setValue('');
	}
}
const convertToSvg = function (tex, scale = 20) {
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

ipcRenderer.on('request-svg', (event) => {
	try {
		const latex = document.getElementById('mathOutput').value;
		if (!latex) throw new Error('No text available!');
		const svg = convertToSvg(latex);

		if (svg.outerHTML) {
			ipcRenderer.send('send-svg-to-main', {type: 'latex', data: latex, svgString: svg.outerHTML});
		} else {
			throw Error('Getting svg failed');
		}
	} catch (e) {
		console.log('Error:', e);
	}
});

ipcRenderer.on('content-data', (event, content) => {
	if (content) {
		const textarea = document.querySelector('#latexInput');
		textarea.value = content;
		updateMathOutput(content);
	} else {
		console.log('No content to edit!');
	}
});

document.getElementById('close-btn').addEventListener('click', () => {
	ipcRenderer.send('close', 'latex');
});
// Select the resizable element
const threeDots = document.querySelector('.three-dots');
let isMaximized = false;

threeDots.addEventListener('click', () => {
	if (isMaximized) {
		// Minimize to original size
		ipcRenderer.send('set-screen-size', {isMaximized: true, type: 'latex'});
	} else {
		// Maximize to full width and 400px height
		ipcRenderer.send('set-screen-size', {isMaximized: false, type: 'latex'});
	}
	isMaximized = !isMaximized;
});
