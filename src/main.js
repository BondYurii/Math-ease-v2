const {info} = require('console');
const {app, BrowserWindow, ipcMain} = require('electron/main');
const {clipboard, nativeImage, screen} = require('electron');
const fs = require('fs');
const path = require('path');
const {createObjectCsvWriter} = require('csv-writer');
const {parse} = require('csv-parse');
const crypto = require('crypto');
const {JSDOM} = require('jsdom');
const https = require('https');
const csv = require('csv-parse');
const {
	showGraphWindow,
	showWiteboardWindow,
	showLatexWindow,
	showInfoWindow,
	createToolbarWindow,
	showOcrWindow,
} = require('./modules/show-windows');
const {stringify} = require('./modules/utils');
const sharp = require('sharp');
const axios = require('axios');
require('dotenv').config();

let strokesSessionId = '';
const APP_ID = process.env.APP_ID;
const APP_KEY = process.env.APP_KEY;
let toolbarWindow = null;
let infoWindow = null;
let graphWindow = null;
let whiteboardWindow = null;
let latexWindow = null;
let ocrWindow = null;

function calculateHash(buffer) {
	const hash = crypto.createHash('sha256');
	hash.update(buffer);
	return hash.digest('hex');
}

const csvFilePath = path.join(app.getPath('userData'), 'history.csv');
const csvWriter = createObjectCsvWriter({
	path: csvFilePath,
	header: [
		{id: 'timestamp', title: 'Timestamp'},
		{id: 'type', title: 'Type'},
		{id: 'data', title: 'Data'},
		{id: 'hash', title: 'Hash'},
		{id: 'svgString', title: 'SVG String'},
	],
	append: true, // Append to the file if it exists
	fieldDelimiter: ';',
});

// Desmos
ipcMain.on('show-graph', () => {
	graphWindow = showGraphWindow(graphWindow, toolbarWindow);
	closeOtherWindowsExcept('graph');
});

//Dealing with window switching messages
ipcMain.on('show-whiteboard', () => {
	whiteboardWindow = showWiteboardWindow(whiteboardWindow, toolbarWindow);
	closeOtherWindowsExcept('whiteboard');
});

ipcMain.on('show-info', () => {
	infoWindow = showInfoWindow(infoWindow, toolbarWindow);
	closeOtherWindowsExcept('info');
});

ipcMain.on('show-latex', () => {
	latexWindow = showLatexWindow(latexWindow, toolbarWindow);
	closeOtherWindowsExcept('latex');
});

ipcMain.on('show-ocr', () => {
	ocrWindow = showOcrWindow(ocrWindow, toolbarWindow);
	closeOtherWindowsExcept('ocr');
});

const closeOtherWindowsExcept = (theType) => {
	const keys = {
		info: infoWindow,
		latex: latexWindow,
		graph: graphWindow,
		whiteboard: whiteboardWindow,
		ocr: ocrWindow,
	};
	for (const [key, value] of Object.entries(keys)) {
		if (key !== theType && value && !value.isDestroyed()) {
			value.hide();
		}
	}
};

ipcMain.on('close', (event, type) => {
	switch (type) {
		case 'info': {
			infoWindow.close();
			toolbarWindow.webContents.send('closing-window', 'info');
			break;
		}
		case 'latex': {
			latexWindow.close();
			toolbarWindow.webContents.send('closing-window', 'latex');
			break;
		}
		case 'ocr': {
			ocrWindow.close();
			toolbarWindow.webContents.send('closing-window', 'ocr');
			break;
		}
		case 'graph': {
			graphWindow.close();
			toolbarWindow.webContents.send('closing-window', 'graph');
			break;
		}
		case 'whiteboard': {
			whiteboardWindow.close();
			toolbarWindow.webContents.send('closing-window', 'whiteboard');
			break;
		}
	}
});

ipcMain.on('copy', (event) => {
	let shouldSendData = false;
	if (latexWindow && !latexWindow.isDestroyed() && latexWindow.isVisible()) {
		latexWindow.webContents.send('request-svg');
		shouldSendData = true;
	}

	if (whiteboardWindow && !whiteboardWindow.isDestroyed() && whiteboardWindow.isVisible()) {
		whiteboardWindow.webContents.send('request-svg');
		shouldSendData = true;
	}

	if (graphWindow && !graphWindow.isDestroyed() && graphWindow.isVisible()) {
		graphWindow.webContents.send('request-svg');
		shouldSendData = true;
	}

	if (ocrWindow && !ocrWindow.isDestroyed() && ocrWindow.isVisible()) {
		ocrWindow.webContents.send('request-svg');
		shouldSendData = true;
	}

	if (shouldSendData) {
		ipcMain.once('send-svg-to-main', async (event, {svgString, type, data}) => {
			const timestamp = Date.now();
			try {
				const pngBuffer = await sharp(Buffer.from(svgString)).png({quality: 100}).toBuffer();
				const image = nativeImage.createFromBuffer(pngBuffer);
				clipboard.writeImage(image);
				const hash = calculateHash(image.toPNG());
				await csvWriter.writeRecords([{timestamp, type, data: stringify(data), hash, svgString}]);
			} catch (error) {
				console.log(error);
			}

			toolbarWindow.webContents.send('svg-copied-success');
		});
	}
});

const handleEdit = (type, contentData) => {
	switch (type) {
		case 'latex': {
			const isDestroyed = latexWindow === null || latexWindow.isDestroyed();
			latexWindow = showLatexWindow(latexWindow, toolbarWindow);
			toolbarWindow.webContents.send('active-window', 'latex');
			if (isDestroyed) {
				latexWindow.webContents.on('did-finish-load', () => {
					latexWindow.webContents.send('content-data', contentData);
				});
			} else {
				latexWindow.webContents.send('content-data', contentData);
			}
			break;
		}
		case 'whiteboard': {
			const isDestroyed = whiteboardWindow === null || whiteboardWindow.isDestroyed();
			whiteboardWindow = showWiteboardWindow(whiteboardWindow, toolbarWindow);
			toolbarWindow.webContents.send('active-window', 'whiteboard');
			if (isDestroyed) {
				whiteboardWindow.webContents.on('did-finish-load', () => {
					whiteboardWindow.webContents.send('content-data', contentData);
				});
			} else {
				whiteboardWindow.webContents.send('content-data', contentData);
			}
			break;
		}
		case 'graph': {
			const isDestroyed = graphWindow === null || graphWindow.isDestroyed();
			graphWindow = showGraphWindow(graphWindow, toolbarWindow);
			toolbarWindow.webContents.send('active-window', 'graph');
			if (isDestroyed) {
				graphWindow.webContents.on('did-finish-load', () => {
					graphWindow.webContents.send('content-data', contentData);
				});
			} else {
				graphWindow.webContents.send('content-data', contentData);
			}
			break;
		}
		case 'ocr': {
			const isDestroyed = ocrWindow === null || ocrWindow.isDestroyed();
			ocrWindow = showOcrWindow(ocrWindow, toolbarWindow);
			toolbarWindow.webContents.send('active-window', 'ocr');
			if (isDestroyed) {
				ocrWindow.webContents.on('did-finish-load', () => {
					ocrWindow.webContents.send('content-data', contentData);
				});
			} else {
				ocrWindow.webContents.send('content-data', contentData);
			}
			break;
		}
	}
};
const downloadImage = async (url) => {
	return new Promise((resolve, reject) => {
		https
			.get(url, (response) => {
				const chunks = [];
				response.on('data', (chunk) => {
					chunks.push(chunk);
				});

				response.on('end', () => {
					const buffer = Buffer.concat(chunks);
					const image = nativeImage.createFromBuffer(buffer).toPNG();
					resolve(image);
				});

				response.on('error', (err) => {
					reject(err);
				});
			})
			.on('error', (err) => {
				reject(err);
			});
	});
};

ipcMain.on('edit', async (event) => {
	try {
		const clipboardFormats = clipboard.availableFormats();
		let clipboardImage = null;
		let clipboardTexts = '';
		console.log(clipboardFormats);
		if (clipboardFormats.includes('image/png')) {
			clipboardImage = clipboard.readImage().toPNG(); // Read as text
		} else if (clipboardFormats.includes('text/html')) {
			clipboardTexts = clipboard.readHTML();
			console.log(clipboardTexts);
		}

		if (clipboardTexts) {
			const dom = new JSDOM(clipboardTexts);
			const imgElement = dom.window.document.querySelector('img');
			if (imgElement) {
				const imgSrc = imgElement.src;
				clipboardTexts = await downloadImage(imgSrc);
			}
		} else {
			console.log('Clipboard does not contain an image or text.');
		}
		let isOpened = false;
		const clipboardHash = calculateHash(clipboardImage ? clipboardImage : clipboardTexts);
		if (fs.existsSync(csvFilePath)) {
			fs
				.createReadStream(csvFilePath)
				.pipe(csv.parse({delimiter: ';'}))
				.on('data', (data) => {
					const [, type, contentData, hash] = data;
					console.log(hash, clipboardHash);
					if (hash === clipboardHash && !isOpened) {
						isOpened = true;
						handleEdit(type, contentData);
					}
				})
				.on('end', function () {
					console.log('Reading csv finished');
				})
				.on('error', function (error) {
					console.log(error.message);
					fs.unlinkSync(csvFilePath);
				});
		}
	} catch (error) {
		console.error('Error handling edit:', error);
		event.reply('edit-result', {error: 'An error occurred while processing the edit.'});
	}
});

app.whenReady().then(async () => {
	toolbarWindow = createToolbarWindow();
	strokesSessionId = await getStrokeSessionId();
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			toolbarWindow = createToolbarWindow();
		}
	});
});

const readCsvFile = async () => {
	return new Promise((resolve, reject) => {
		const records = [];
		fs
			.createReadStream(csvFilePath)
			.pipe(csv.parse({delimiter: ';'}))
			.on('data', (data) => {
				if (data) {
					const [timestamp, type, contentData, hash, svgString] = data;
					records.push({timestamp, type, data: contentData, hash, svgString});
				}
			})
			.on('end', function () {
				resolve(records);
			})
			.on('error', function (error) {
				reject(error);
			});
	});
};
// Clean up records older than 24 hours
const cleanOldRecords = async () => {
	if (!fs.existsSync(csvFilePath)) return;

	const now = Date.now();
	const threshold = now - 6 * 60 * 60 * 1000;
	try {
		const records = await readCsvFile();
		const filteredRecords = records.filter((line) => {
			const {timestamp} = line; // Assuming timestamp is the first column
			return parseInt(timestamp) > threshold;
		});

		fs.unlinkSync(csvFilePath);
		await csvWriter.writeRecords(filteredRecords);
		console.log('Old records cleaned.');
	} catch (error) {
		console.log(error);
	}
};

// Listen for 'resize-window' messages
ipcMain.on('resize-window', (event, {y, height, type}) => {
	if (type === 'info')
		if (infoWindow) {
			infoWindow.setBounds({
				y,
				height: Math.max(height, 10), // Minimum height
			});
		}
});

function resizeWindow(isMaximized, area, window) {
	isMaximized
		? window.setBounds({x: 0, y: area.height - 500, width: area.width, height: 400})
		: window.setBounds({
				x: (area.width - Math.min(400, area.width * 0.9)) / 2,
				y: area.height - 300,
				width: Math.min(400, area.width * 0.9),
				height: 200,
		  });
}

ipcMain.on('set-screen-size', (event, {isMaximized, type}) => {
	const area = screen.getPrimaryDisplay().workAreaSize;
	const windows = {
		info: infoWindow,
		ocr: ocrWindow,
		graph: graphWindow,
		whiteboard: whiteboardWindow,
		latex: latexWindow,
	};

	const window = windows[type];
	if (window) {
		resizeWindow(isMaximized, area, window);
	}
});

// Provide current window bounds
ipcMain.handle('get-window-bounds', (event, type) => {
	if (type === 'info') {
		return infoWindow ? infoWindow.getBounds() : null;
	}
});

const getStrokeSessionId = async () => {
	try {
		if (!APP_ID || !APP_KEY) throw new Error('APP id or key is not provided.');
		const response = await axios.post(
			'https://api.mathpix.com/v3/app-tokens',
			{
				include_strokes_session_id: true,
				expires: 43200, // 12 hours
			},
			{
				headers: {
					'Content-Type': 'application/json',
					app_id: APP_ID,
					app_key: APP_KEY,
				},
			},
		);

		return response.data.strokes_session_id;
	} catch (error) {
		console.error('Error getting stroke_session_id:', error.response?.data || error.message);
		throw error;
	}
};
async function sendStrokes(strokesSessionId, strokesData) {
	try {
		const response = await axios.post(
			'https://api.mathpix.com/v3/strokes',
			{
				strokes: strokesData,
				'strokes-session-id': strokesSessionId,
			},
			{
				headers: {
					app_id: APP_ID,
					app_key: APP_KEY,
					'Content-Type': 'application/json',
				},
			},
		);
		console.log(JSON.stringify(response.data));
		return response.data;
	} catch (error) {
		console.error('Error sending strokes:', error.response?.data || error.message);
		throw error;
	}
}
ipcMain.handle('send-strokes', async (event, strokesData) => {
	return await sendStrokes(strokesSessionId, strokesData);
});
app.on('window-all-closed', async () => {
	await cleanOldRecords();
	if (process.platform !== 'darwin') app.quit();
});
app.commandLine.appendSwitch('enable-logging');
