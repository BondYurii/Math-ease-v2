// Copy SVG from Excalidraw
function copySVG() {
	// Send a message to the Excalidraw window to fetch the SVG content
	window.electronAPI.toggleWhiteboard();

	// Receive the message containing the SVG
	window.addEventListener('message', (event) => {
		if (event.data.type === 'SVG_CONTENT') {
			const svgContent = event.data.svg;

			// Create a temporary element to copy the SVG
			const tempElement = document.createElement('textarea');
			tempElement.value = svgContent;
			document.body.appendChild(tempElement);
			tempElement.select();
			document.execCommand('copy');
			document.body.removeChild(tempElement);

			alert('Whiteboard content copied as SVG!');
		}
	});
}

function showOcr(element) {
	window.electronAPI.showOcr();
	const iconContainers = document.querySelectorAll('.icon-container');
	if (element.classList.contains('active')) {
		element.classList.remove('active');
	} else {
		iconContainers.forEach((ic) => ic.classList.remove('active'));
		element.classList.add('active');
	}
}

function showGraph(element) {
	// Check if the Desmos window exists
	window.electronAPI.showGraph();
	const iconContainers = document.querySelectorAll('.icon-container');
	if (element.classList.contains('active')) {
		element.classList.remove('active');
	} else {
		iconContainers.forEach((ic) => ic.classList.remove('active'));
		element.classList.add('active');
	}
}

function showWhiteboard(element) {
	window.electronAPI.showWhiteboard();
	const iconContainers = document.querySelectorAll('.icon-container');
	if (element.classList.contains('active')) {
		element.classList.remove('active');
	} else {
		iconContainers.forEach((ic) => ic.classList.remove('active'));
		element.classList.add('active');
	}
}

function createInfoWindow(element) {
	window.electronAPI.showInfo(element);
	const iconContainers = document.querySelectorAll('.icon-container');
	if (element.classList.contains('active')) {
		element.classList.remove('active');
	} else {
		iconContainers.forEach((ic) => ic.classList.remove('active'));
		element.classList.add('active');
	}
}

function showLatex(element) {
	window.electronAPI.showLatex(element);
	const iconContainers = document.querySelectorAll('.icon-container');
	if (element.classList.contains('active')) {
		element.classList.remove('active');
	} else {
		iconContainers.forEach((ic) => ic.classList.remove('active'));
		element.classList.add('active');
	}
}

function copy() {
	window.electronAPI.copy();
}

function edit() {
	window.electronAPI.edit();
}

function showToast(message) {
	const toast = document.getElementById('toast');
	toast.textContent = message;
	toast.className = 'toast show';
	setTimeout(() => {
		toast.className = toast.className.replace('show', '');
	}, 2000);
}

window.electronAPI.on('svg-copied-success', () => {
	showToast('SVG copied to clipboard!');
});

window.electronAPI.on('closing-window', (type) => {
	const iconContainers = document.querySelectorAll('.icon-container');
	const keys = {
		info: 0,
		ocr: 1,
		graph: 2,
		whiteboard: 3,
		latex: 4,
	};

	const index = keys[type];
	if (index !== undefined) {
		iconContainers[index].classList.remove('active');
	}
});
window.electronAPI.on('active-window', (type) => {
	const iconContainers = document.querySelectorAll('.icon-container');
	const keys = {
		info: 0,
		ocr: 1,
		graph: 2,
		whiteboard: 3,
		latex: 4,
	};

	const index = keys[type];
	if (index) {
		const element = iconContainers[index];
		iconContainers.forEach((ic) => ic.classList.remove('active'));
		element.classList.add('active');
	}
});

// Toggle dropdown menu
function toggleDropdown(element) {
    // Close all other dropdowns first
    const dropdowns = document.getElementsByClassName('dropdown-content');
    for (let dropdown of dropdowns) {
        if (dropdown !== element.nextElementSibling && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    }
    
    // Toggle the clicked dropdown
    const dropdownContent = element.nextElementSibling;
    dropdownContent.classList.toggle('show');
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.matches('.icon-image')) {
        const dropdowns = document.getElementsByClassName('dropdown-content');
        for (let dropdown of dropdowns) {
            if (dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
            }
        }
    }
});

// Close the application
function closeApp(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    window.electronAPI.closeApp();
}

// Handle keyboard shortcuts
window.electronAPI.onTriggerCopy(() => {
    copy();
});

window.electronAPI.onTriggerEdit(() => {
    window.electronAPI.edit();
});
