// The grid is a square with a fixed side length of gridSize vh units. 
// Variable "resolution" determines the amount rows and columns in the grid.
// Constant "gridSize" determines the portion of the screen the canvas makes up.
const gridSize = 80;
const maxAllowedResolution = 64;
let resolution = 22;
let chosenColor = getComputedStyle(document.body).getPropertyValue('--dock-button-selected-color').toString();
let outlinesActive = false;
let eraserActive = false;
let isDrawing = false;

// Disable dragging in the window, which can interrupt drawing.
window.ondragstart = function () { return false;};
// Populate grid with initial cells.
setGridLayout();
populateGrid();
// Set listeners for grid cells to know when user is drawing.
setListenersOnCells();
// Keep track of when user stops drawing.
window.addEventListener('mouseup', e => {
    isDrawing = false;
});
// Set listeners for dock buttons.
const buttons = document.querySelectorAll(".dock-button");
for (const button of buttons) {
    let func;
    switch(button.id) {
        case "palette":
            func = handlePalette;
            break;
        case "eraser":
            func = handleEraser;
            break;
        case "outlines":
            func = handleOutlines;
            break;
        case "resize":
            func = handleResize;
            break;
        case "clear":
            func = handleClear;
            break;
        case "save":
            func = handleSave;
    }
    button.addEventListener('click', func);
}
// Set listener for color changes.
setColorUpdateListener();


// --- HELPER FUNCTIONS ---
// Sets grid's CSS grid properties to properly display cells based on amount.
function setGridLayout() {
    grid.style.gridTemplateColumns = `repeat(${resolution}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${resolution}, 1fr)`;
}
function populateGrid() {
    // Clear the grid of any cells that are there.
    grid.innerHTML = '';
    // And populate with new cells that match the conditions.
    let styleSheet = getComputedStyle(document.body);
    for (let i = 0; i < resolution ** 2; i++) {
        let cell = document.createElement('cell');
        cell.style.width = getCellSize();
        cell.style.height = getCellSize();
        
        if (outlinesActive) {
            cell.style.outline = "var(--cell-outline-size) solid var(--cell-outline-color)";
        }
        
        if (eraserActive) {
            cell.style.cursor = styleSheet.getPropertyValue('--cell-eraser-cursor');
        }
        else {
            cell.style.cursor = styleSheet.getPropertyValue('--cell-cursor');
        }
        grid.appendChild(cell);
    }
    // Returns current cell size in vh units as a string.
    function getCellSize() {
        return (gridSize / resolution).toString() + "vh";
    }
}
function setListenersOnCells() {
    const cells = document.querySelectorAll('cell');
    for (const cell of cells) {
        cell.addEventListener('mousedown', e => {
            isDrawing = true;
        });
        cell.addEventListener('mousemove', handleDrawing);
        cell.addEventListener('click', handleDrawing);
    }
}
function setColorUpdateListener() {
    let colorSelector = document.querySelector("#color-selector");
    colorSelector.addEventListener("change", saveColor);
    colorSelector.addEventListener("input", doStuffWithCurrentChosenColor);
    
    function saveColor(colorSelector) {
        chosenColor = colorSelector.target.value;
    }
    function doStuffWithCurrentChosenColor(inputEvent) {
        rightDock = document.querySelector('#dock-right');
        rightDock.style.backgroundColor = inputEvent.target.value;
    }
}
function handleDrawing(event) {
    if (isDrawing || event.type === 'click') {
        if (!eraserActive) {
            this.style.backgroundColor = chosenColor;
        }
        else {
            this.style.backgroundColor = 'var(--cell-background-color)';
        }
    }
}


function handlePalette() {
    let colorSelector = document.querySelector('#color-selector');
    colorSelector.focus();
    colorSelector.value = chosenColor;
    colorSelector.click();
}
function handleEraser() {
    let eraserButton = document.querySelector('#eraser');
    let cells = document.querySelectorAll('cell');
    const eraserCursor = 
            getComputedStyle(document.body).getPropertyValue('--cell-eraser-cursor');
    const cursor = getComputedStyle(document.body).getPropertyValue('--cell-cursor');
    
    if (eraserActive) {
        eraserActive = false;
        eraserButton.classList.remove("selected-dock-button");
        
        for (let cell of cells) {
            cell.style.cursor = cursor;
        }
    }
    else {
        eraserActive = true;
        eraserButton.classList.add("selected-dock-button");

        for (let cell of cells) {
            cell.style.cursor = eraserCursor;
        }
    }
}
function handleClear() {
    const cells = document.querySelectorAll('cell');
    for (let cell of cells) {
        cell.style.backgroundColor = "var(--cell-background-color)";
    }
}
function handleResize() {
    const choice = window.prompt(
        `Enter the desired side length of the canvas (1-${maxAllowedResolution}). Your current work will be lost!`);
    if (verify(choice)) {
        resolution = parseInt(choice);
        setGridLayout();
        populateGrid();
        setListenersOnCells();
    }
    else if (choice !== null) {
        window.alert(
            `Invalid input. Integers in the range 1-${maxAllowedResolution} inclusive only, please.`);
    }
    function verify(userInput) {
        number = parseFloat(userInput);
        if (number === NaN) {
            return false;
        }
        if (!Number.isInteger(number)) {
            return false;
        }
        if (number < 1 || number > maxAllowedResolution) {
            return false;
        }
        return true;
    }
}
function handleOutlines() {
    let cells = document.querySelectorAll('cell');
    let outlinesButton = document.querySelector('#outlines');
    if (outlinesActive) {
        for (let cell of cells) {
            cell.style.outline = "";
            outlinesActive = false;
            outlinesButton.classList.remove("selected-dock-button");
        }
    }
    else {
        for (let cell of cells) {
            cell.style.outline = 
                "var(--cell-outline-size) solid var(--cell-outline-color)";
            outlinesActive = true;
            outlinesButton.classList.add("selected-dock-button");
        }
    }
}
function handleSave() {
    // Adapted from http://www.cheminfo.org/Tutorial/8._Images/9.7_Create_a_PNG_image_in_javascript/index.html
    let canvas = document.createElement('canvas');
    const height = resolution;
    const width = resolution

    canvas.height = height;
    canvas.width = width;
    let context = canvas.getContext("2d");
    let imageData = context.createImageData(width, height);
    let data = imageData.data;

    // Create an array of pixels based on the current background colors of cells.
    const pixels = createArrayOfPixelObjects();

    for (var i=0; i<height*width; i++) {
        data[i*4+0] = pixels[i][0]; // Red
        data[i*4+1] = pixels[i][1]; // Green
        data[i*4+2] = pixels[i][2]; // Blue
        data[i*4+3] = pixels[i][3]; // Alpha
    }
    context.putImageData(imageData, 0, 0); // at coords 0,0
    download(canvas.toDataURL(), "sketch.png");
    function download(dataURL, name) {
        var link = document.createElement("a");
        link.download = name;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        delete link;
    }
    function createArrayOfPixelObjects() {
        const cells = document.querySelectorAll('cell');
        let pixArray = [];
        for (let cell of cells) {
            const colorString = cell.style.backgroundColor;
            console.log(colorString);
            if (colorString === "" || colorString === "var(--cell-background-color)") {
                let x = [0,0,0,0];
                pixArray.push(x);
            }
            else {
                let x = colorValues(colorString);
                x[3] *= 255;
                pixArray.push(x);
            }
        }
        return pixArray;
        
        // Converts string "rgb(x, y, z)" to integers. Credit: oriadam on Stackoverflow.
        function colorValues(color) {             
            if (color === '')
                return;
            if (color.toLowerCase() === 'transparent')
                return [0, 0, 0, 0];
            if (color[0] === '#')
            {
                if (color.length < 7)
                {
                    // convert #RGB and #RGBA to #RRGGBB and #RRGGBBAA
                    color = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3] + (color.length > 4 ? color[4] + color[4] : '');
                }
                return [parseInt(color.substr(1, 2), 16),
                    parseInt(color.substr(3, 2), 16),
                    parseInt(color.substr(5, 2), 16),
                    color.length > 7 ? parseInt(color.substr(7, 2), 16)/255 : 1];
            }
            if (color.indexOf('rgb') === -1)
            {
                // convert named colors
                var temp_elem = document.body.appendChild(document.createElement('fictum')); // intentionally use unknown tag to lower chances of css rule override with !important
                var flag = 'rgb(1, 2, 3)'; // this flag tested on chrome 59, ff 53, ie9, ie10, ie11, edge 14
                temp_elem.style.color = flag;
                if (temp_elem.style.color !== flag)
                    return; // color set failed - some monstrous css rule is probably taking over the color of our object
                temp_elem.style.color = color;
                if (temp_elem.style.color === flag || temp_elem.style.color === '')
                    return; // color parse failed
                color = getComputedStyle(temp_elem).color;
                document.body.removeChild(temp_elem);
            }
            if (color.indexOf('rgb') === 0)
            {
                if (color.indexOf('rgba') === -1)
                    color += ',1'; // convert 'rgb(R,G,B)' to 'rgb(R,G,B)A' which looks awful but will pass the regxep below
                return color.match(/[\.\d]+/g).map(function (a)
                {
                    return +a
                });
            }
        }
    }
}
