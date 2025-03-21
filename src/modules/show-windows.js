const {BrowserWindow} = require('electron/main');
const path = require('path');

function createToolbarWindow() {
	const {screen} = require('electron');
	const size = screen.getPrimaryDisplay().workAreaSize;

	let toolbarWindow = new BrowserWindow({
		width: Math.min(500, size.width * 0.9),
		height: 150,
		x: (size.width - Math.min(400, size.width * 0.9)) / 2,
		y: size.height - 160,
		webPreferences: {
			preload: path.join(__dirname, '../preload.js'), //  We use Preload to increase security
			nodeIntegration: true,
			contextIsolation: true,
		},
		frame: false,
		resizable: true,
		alwaysOnTop: true,
		transparent: true,
	});

	toolbarWindow.loadFile('index.html');
	toolbarWindow.on('closed', () => {
		toolbarWindow = null;
	});
	// Uncomment the line below to open the developer tools for debugging
	// toolbarWindow.webContents.openDevTools();

	return toolbarWindow;
}

// (Excalidraw)
function createWhiteboardWindow(toolbarWindow) {
	const {screen} = require('electron');
	const size = screen.getPrimaryDisplay().workAreaSize;
	let whiteboardWindow = new BrowserWindow({
		width: size.width,
		height: 400, // Set the height to half screen at first
		y: size.height - 500,
		x: 0,
		modal: false,
		show: false,
		parent: toolbarWindow,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
		frame: false,
		resizable: true,
		alwaysOnTop: true,
		transparent: false,
	});

	whiteboardWindow.loadFile(path.join(__dirname, '../whiteboard', 'index.html'));
	// whiteboardWindow.webContents.openDevTools();
	whiteboardWindow.once('ready-to-show', () => {
		whiteboardWindow.show();
	});

	whiteboardWindow.on('closed', () => {
		whiteboardWindow = null;
	});
	return whiteboardWindow;
}

// (Info Window)
function createInfoWindow(toolbarWindow) {
	const {screen} = require('electron');
	const size = screen.getPrimaryDisplay().workAreaSize;
	let infoWindow = new BrowserWindow({
		width: size.width,
		height: 400, // Set the height to half screen at first
		y: size.height - 500,
		x: 0,
		modal: false,
		show: false,
		parent: toolbarWindow,
		webPreferences: {
			preload: path.join(__dirname, '../info', 'preload.js'),
			nodeIntegration: true,
			contextIsolation: true,
		},
		frame: false,
		resizable: true,
		alwaysOnTop: true,
		transparent: false,
	});

	infoWindow.loadFile(path.join(__dirname, '../info', 'index.html'));
	infoWindow.once('ready-to-show', () => {
		infoWindow.show();
	});
	infoWindow.on('closed', () => {
		infoWindow = null;
	});

	return infoWindow;
}

// Latex window
function createLatexWindow(toolbarWindow) {
	const {screen} = require('electron');
	const size = screen.getPrimaryDisplay().workAreaSize;
	let latexWindow = new BrowserWindow({
		width: size.width,
		height: 400, // Set the height to half screen at first
		y: size.height - 500,
		x: 0,
		modal: false,
		show: false,
		parent: toolbarWindow,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
		frame: false,
		resizable: true,
		alwaysOnTop: true,
		transparent: false,
	});

	latexWindow.loadFile(path.join(__dirname, '../latex', 'index.html'));
	latexWindow.once('ready-to-show', () => {
		latexWindow.show();
	});

	latexWindow.on('closed', () => {
		latexWindow = null;
	});
	return latexWindow;
}

function createOcrWindow(toolbarWindow) {
	const {screen} = require('electron');
	const size = screen.getPrimaryDisplay().workAreaSize;
	let ocrWindow = new BrowserWindow({
		width: size.width,
		height: 400, // Set the height to half screen at first
		y: size.height - 500,
		x: 0,
		modal: false,
		show: false,
		parent: toolbarWindow,
		webPreferences: {
			preload: path.join(__dirname, '../ocr/preload.js'),
			nodeIntegration: false,
			contextIsolation: true,
		},
		frame: false,
		resizable: true,
		alwaysOnTop: true,
		transparent: false,
	});

	ocrWindow.loadFile(path.join(__dirname, '../ocr', 'index.html'));
	ocrWindow.once('ready-to-show', () => {
		ocrWindow.show();
	});
	ocrWindow.on('closed', () => {
		ocrWindow = null;
	});
	return ocrWindow;
}

function createGraphWindow(toolbarWindow) {
	const {screen} = require('electron');
	const size = screen.getPrimaryDisplay().workAreaSize;
	let graphWindow = new BrowserWindow({
		width: size.width,
		height: 400,
		x: 0,
		y: size.height - 500,
		modal: false,
		show: false,
		parent: toolbarWindow,
		webPreferences: {
			preload: path.join(__dirname, '../graph', 'preload.js'),
			nodeIntegration: false,
			contextIsolation: true,
		},
		frame: false,
		resizable: true,
		alwaysOnTop: true,
		transparent: false,
	});
	graphWindow.loadFile(path.join(__dirname, '../graph', 'index.html'));
	graphWindow.once('ready-to-show', () => {
		graphWindow.show();
	});
	graphWindow.on('closed', () => {
		graphWindow = null;
	});
	return graphWindow;
}
function showGraphWindow(graphWindow, toolbarWindow) {
	if (graphWindow && !graphWindow.isDestroyed()) {
		if (graphWindow.isVisible()) {
			graphWindow.hide();
		} else {
			graphWindow.show();
			graphWindow.focus();
		}
	} else {
		graphWindow = createGraphWindow(toolbarWindow);
	}
	return graphWindow;
}

function showWiteboardWindow(whiteboardWindow, toolbarWindow) {
	if (whiteboardWindow && !whiteboardWindow.isDestroyed()) {
		if (whiteboardWindow.isVisible()) {
			whiteboardWindow.hide();
		} else {
			whiteboardWindow.show();
			whiteboardWindow.focus();
		}
	} else {
		whiteboardWindow = createWhiteboardWindow(toolbarWindow);
	}
	return whiteboardWindow;
}

function showLatexWindow(latexWindow, toolbarWindow) {
	if (latexWindow && !latexWindow.isDestroyed()) {
		if (latexWindow.isVisible()) {
			latexWindow.hide();
		} else {
			latexWindow.show();
			latexWindow.focus();
		}
	} else {
		latexWindow = createLatexWindow(toolbarWindow);
	}
	return latexWindow;
}

function showInfoWindow(infoWindow, toolbarWindow) {
	if (infoWindow && !infoWindow.isDestroyed()) {
		if (infoWindow.isVisible()) {
			infoWindow.hide();
		} else {
			infoWindow.show();
			infoWindow.focus();
		}
	} else {
		infoWindow = createInfoWindow(toolbarWindow);
	}
	return infoWindow;
}

function showOcrWindow(ocrWindow, toolbarWindow) {
	if (ocrWindow && !ocrWindow.isDestroyed()) {
		if (ocrWindow.isVisible()) {
			ocrWindow.hide();
		} else {
			ocrWindow.show();
			ocrWindow.focus();
		}
	} else {
		ocrWindow = createOcrWindow(toolbarWindow);
	}
	return ocrWindow;
}

module.exports = {
	showGraphWindow,
	createToolbarWindow,
	showInfoWindow,
	showLatexWindow,
	showWiteboardWindow,
	showOcrWindow,
};
