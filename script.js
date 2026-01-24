// Centralized state object
const state = {
  elements: [],
  selectedElementId: null,
  currentAction: null, // 'drag', 'resize', 'rotate', or null
  currentTool: null,
  elementCounter: 0 // For unique IDs
};

// font available
const AVAILABLE_FONTS = [
  'Arial',
  'Inter',
  'Poppins',
  'Roboto',
  'Montserrat',
  'Courier New'
];

// Canvas dimensions (fixed for bounds checking)
const CANVAS_WIDTH = 1210;
const CANVAS_HEIGHT = 1010;

// DOM references
const canvas = document.getElementById('canvas');
const layersList = document.getElementById('layers-list');
const propWidth = document.getElementById('prop-width');
const propHeight = document.getElementById('prop-height');
const propBg = document.getElementById('prop-bg');
const textColorInput = document.getElementById("prop-color");
const propText = document.getElementById('prop-text');
const textLabel = document.getElementById('text-label');
const toolBtn = document.querySelectorAll('.tool-btn')
const fontSizeInput = document.getElementById('prop-font-size');
const alignBtns = document.querySelectorAll('.text-align-btn');
const textAlignControls = document.getElementById('text-align-controls');
const fontStyleBtns = document.querySelectorAll('.font-style-btn');
const radiusTL = document.getElementById('radius-tl');
const radiusTR = document.getElementById('radius-tr');
const radiusBR = document.getElementById('radius-br');
const radiusBL = document.getElementById('radius-bl');
const fontFamilySelect = document.getElementById('prop-font-family');
const deleteBtn = document.getElementById('delete-element');

// Initialize canvas size
canvas.style.width = `${CANVAS_WIDTH}px`;
canvas.style.height = `${CANVAS_HEIGHT}px`;

// Load state from localStorage on page load
function loadState() {
  const saved = localStorage.getItem('editorState');
  if (saved) {
    const parsed = JSON.parse(saved);
    state.elements = parsed.elements || [];
    state.elementCounter = parsed.elementCounter || 0;
    renderAll();
  }
}

// Save state to localStorage
function saveState() {
  localStorage.setItem('editorState', JSON.stringify({
    elements: state.elements,
    elementCounter: state.elementCounter
  }));
}

// Tool select karne ke liye function
function selectTool(toolName) {
  state.currentTool = toolName;

  toolBtn.forEach(btn => {
    btn.classList.toggle(
      'active',
      btn.dataset.tool === toolName
    );
  });

}

// change tha update border radius
function updateBorderRadius(corner, value) {
  const elem = state.elements.find(e => e.id === state.selectedElementId);
  if (!elem || !elem.styles.borderRadius) return;

  elem.styles.borderRadius[corner] = Math.max(0, Number(value) || 0);
  renderElements();
  saveState();
}

// Render all elements on canvas based on state
function renderElements() {
  canvas.innerHTML = ''; // Clear canvas
  state.elements.forEach(elem => {
    const div = document.createElement('div');
    div.className = 'element';
    div.id = elem.id;
    div.style.left = `${elem.x}px`;
    div.style.top = `${elem.y}px`;
    div.style.width = `${elem.width}px`;
    div.style.height = `${elem.height}px`;
    div.style.transform = `rotate(${elem.rotation}deg)`;
    div.style.zIndex = elem.zIndex;
    div.style.backgroundColor = elem.styles.backgroundColor;
    if (elem.styles.borderRadius) {
      div.style.borderRadius = `
    ${elem.styles.borderRadius.tl}px
    ${elem.styles.borderRadius.tr}px
    ${elem.styles.borderRadius.br}px
    ${elem.styles.borderRadius.bl}px
  `;
    }
    if (elem.type === 'text') {
      div.textContent = elem.styles.textContent;
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.fontFamily = elem.styles.fontFamily;
      div.style.justifyContent = elem.styles.justifyContent;
      div.style.fontSize = `${elem.styles.fontSize}px`;
      div.style.color = elem.styles.textColor;
      div.style.fontWeight = elem.styles.fontWeight;
      div.style.fontStyle = elem.styles.fontStyle;
      div.style.textDecoration = elem.styles.textDecoration;
    }
    if (elem.type === 'circle') {
      div.style.borderRadius = '50%';
    }

    if (state.selectedElementId === elem.id) {
      div.classList.add('selected');
      // Add resize handles
      ['nw', 'ne', 'sw', 'se'].forEach(corner => {
        const handle = document.createElement('div');
        handle.className = `handle ${corner}`;
        div.appendChild(handle);
      });
      // Add rotation handle
      const rotateHandle = document.createElement('div');
      rotateHandle.className = 'rotate-handle';
      div.appendChild(rotateHandle);
    }
    canvas.appendChild(div);
  });
}

// Render layers panel
function renderLayers() {
  layersList.innerHTML = '';
  // Sort elements by zIndex for display
  const sorted = [...state.elements].sort((a, b) => a.zIndex - b.zIndex);
  sorted.forEach(elem => {
    const item = document.createElement('div');
    item.className = 'layer-item';
    if (state.selectedElementId === elem.id) item.classList.add('selected');
    item.innerHTML = `
            <span>${elem.type} (${elem.id})</span>
            <div>
                <button class="move-up">↑</button>
                <button class="move-down">↓</button>
            </div>
        `;
    item.addEventListener('click', () => selectElement(elem.id));
    item.querySelector('.move-up').addEventListener('click', (e) => {
      e.stopPropagation();
      moveLayer(elem.id, 'up');
    });
    item.querySelector('.move-down').addEventListener('click', (e) => {
      e.stopPropagation();
      moveLayer(elem.id, 'down');
    });
    layersList.appendChild(item);
  });
}

// Render properties panel for selected element
function renderProperties() {
  const elem = state.elements.find(e => e.id === state.selectedElementId);
  if (!elem) {
    propWidth.value = '';
    propHeight.value = '';
    propBg.value = '#ffffff';
    propText.value = '';
    textLabel.style.display = 'none';
    radiusTL.value = ""
    radiusTR.value = "";
    radiusBR.value = "";
    radiusBL.value = "";
    deleteBtn.classList.add('hidden');
    return;
  }
  deleteBtn.classList.remove('hidden'); // 🟢 show
  if (elem.styles.borderRadius) {
    radiusTL.value = elem.styles.borderRadius.tl;
    radiusTR.value = elem.styles.borderRadius.tr;
    radiusBR.value = elem.styles.borderRadius.br;
    radiusBL.value = elem.styles.borderRadius.bl;
  }
  propWidth.value = elem.width;
  propHeight.value = elem.height;
  propBg.value = elem.styles.backgroundColor;
  if (elem.type === 'text') {
    textLabel.style.display = 'block';
    fontSizeInput.value = elem.styles.fontSize || 16;
    fontFamilySelect.value = elem.styles.fontFamily || 'Arial';
    syncTextAlignUI(elem)
    syncFontStyleUI(elem);
    propText.value = elem.styles.textContent;
    textColorInput.value = elem.styles.textColor || '#000000';
  } else {
    fontSizeInput.value = '';
    textLabel.style.display = 'none';
    textAlignControls.style.display = 'center';
  }
}

// Combined render function
function renderAll() {
  renderElements();
  renderLayers();
  renderProperties();
  saveState();

  selectTool("select");

}

// yahe par alignment ka logic laga lag
function syncTextAlignUI(elem) {
  if (!elem || elem.type !== 'text') return;

  alignBtns.forEach(btn => {
    btn.classList.toggle(
      'alignActive',
      btn.dataset.align === elem.styles.justifyContent
    );
  });
}

// yahe par style ka chnage logic ha  
function syncFontStyleUI(elem) {
  fontStyleBtns.forEach(btn => {
    const style = btn.dataset.style;
    let isActive = false;

    if (style === 'bold') {
      isActive = elem.styles.fontWeight === 'bold';
    }

    if (style === 'italic') {
      isActive = elem.styles.fontStyle === 'italic';
    }

    if (style === 'underline') {
      isActive = elem.styles.textDecoration === 'underline';
    }

    btn.classList.toggle('styleActive', isActive);
  });
}

function initBorderRadiusControls() {
  const radiusMap = {
    tl: radiusTL,
    tr: radiusTR,
    br: radiusBR,
    bl: radiusBL
  };

  Object.entries(radiusMap).forEach(([corner, input]) => {
    if (!input) return;

    input.addEventListener('input', (e) => {
      updateBorderRadius(corner, e.target.value);
    });
  });
}

function initFontStyleControls() {
  fontStyleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const elem = state.elements.find(e => e.id === state.selectedElementId);
      if (!elem || elem.type !== 'text') return;

      const style = btn.dataset.style;

      if (style === 'bold') {
        elem.styles.fontWeight =
          elem.styles.fontWeight === 'bold' ? 'normal' : 'bold';
      }

      if (style === 'italic') {
        elem.styles.fontStyle =
          elem.styles.fontStyle === 'italic' ? 'normal' : 'italic';
      }

      if (style === 'underline') {
        elem.styles.textDecoration =
          elem.styles.textDecoration === 'underline' ? 'none' : 'underline';
      }

      syncFontStyleUI(elem);
      renderElements();
      saveState();
    });
  });
}

function initTextAlignControls() {
  alignBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const elem = state.elements.find(e => e.id === state.selectedElementId);
      if (!elem || elem.type !== 'text') return;

      elem.styles.justifyContent = btn.dataset.align;

      syncTextAlignUI(elem);
      renderElements();
      saveState();
    });
  });
}
// Select an element
function selectElement(id) {
  state.selectedElementId = id;
  renderAll();
}

// Deselect (click on canvas)
canvas.addEventListener('click', (e) => {
  if (e.target === canvas) {
    state.selectedElementId = null;
    renderAll();
  }
});

// Add rectangle
document.getElementById('add-rectangle').addEventListener('click', () => {
  const id = `elem${++state.elementCounter}`;
  state.elements.push({
    id,
    type: 'rectangle',
    x: 100,
    y: 100,
    width: 100,
    height: 100,
    maxWidth: CANVAS_WIDTH,
    maxHeight: CANVAS_HEIGHT,
    rotation: 0,
    zIndex: state.elements.length + 1,
    styles: {
      backgroundColor: '#2c2c2c', textContent: '', borderRadius: {
        tl: 0,
        tr: 0,
        br: 0,
        bl: 0
      }
    }
  });
  selectElement(id);
  renderAll();
});

// Add circle
document.getElementById('add-circle').addEventListener('click', () => {
  const id = `elem${++state.elementCounter}`;
  state.elements.push({
    id,
    type: 'circle',
    x: 100,
    y: 100,
    width: 100,
    height: 100,
    maxWidth: CANVAS_WIDTH,
    maxHeight: CANVAS_HEIGHT,
    rotation: 0,
    zIndex: state.elements.length + 1,
    styles: {
      backgroundColor: '#2c2c2c', textContent: '', borderRadius: {
        tl: 9999,
        tr: 9999,
        br: 9999,
        bl: 9999
      }
    }
  });
  selectElement(id);
  renderAll();
});

// Add text
document.getElementById('add-text').addEventListener('click', () => {
  const id = `elem${++state.elementCounter}`;
  state.elements.push({
    id,
    type: 'text',
    x: 100,
    y: 100,
    width: 200,
    height: 50,
    rotation: 0,
    zIndex: state.elements.length + 1,
    styles: {
      backgroundColor: 'transparent', textContent: 'New Text', textColor: '#000000', fontSize: 16, justifyContent: "center", fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      borderRadius: {
        tl: 0,
        tr: 0,
        br: 0,
        bl: 0
      },
      fontFamily: 'Arial',
    }
  });
  selectElement(id);
  renderAll();
});

// tool selected 
toolBtn.forEach(btn => {
  btn.addEventListener('click', () => {
    selectTool(btn.dataset.tool);
  });
});

propWidth.addEventListener('input', () => {
  const elem = state.elements.find(e => e.id === state.selectedElementId);
  if (elem) {
    elem.width = Math.max(10, parseInt(propWidth.value) || 10);
    renderAll();
  }
});

propHeight.addEventListener('input', () => {
  const elem = state.elements.find(e => e.id === state.selectedElementId);
  if (elem) {
    elem.height = Math.max(10, parseInt(propHeight.value) || 10);
    renderAll();
  }
});

propBg.addEventListener('input', () => {
  const elem = state.elements.find(e => e.id === state.selectedElementId);
  if (elem) {
    elem.styles.backgroundColor = propBg.value;
    renderAll();
  }
});

propText.addEventListener('input', () => {
  const elem = state.elements.find(e => e.id === state.selectedElementId);
  if (elem && elem.type === 'text') {
    elem.styles.textContent = propText.value;
    renderAll();
  }
});

textColorInput.addEventListener('input', () => {
  const elem = state.elements.find(e => e.id === state.selectedElementId);
  if (elem && elem.type === 'text') {
    elem.styles.textColor = textColorInput.value;
    renderElements(); // fast render
    saveState();
  }
});

// this is will update the font family
function updateFontFamily() {
  const elem = state.elements.find(e => e.id === state.selectedElementId);
  if (!elem || elem.type !== 'text') return;

  elem.styles.fontFamily = fontFamilySelect.value;
  renderElements(); // fast render
  saveState();
}

function updateFontSize() {
  const elem = state.elements.find(e => e.id === state.selectedElementId);
  if (!elem || elem.type !== 'text') return;

  const size = parseInt(fontSizeInput.value, 10);

  if (isNaN(size) || size < 1) return;

  elem.styles.fontSize = size;
  renderElements(); // fast render
  saveState();
}

fontSizeInput.addEventListener('input', updateFontSize);
fontFamilySelect.addEventListener('change', updateFontFamily);

// Move layer up/down
function moveLayer(id, direction) {
  const index = state.elements.findIndex(e => e.id === id);
  if (direction === 'up' && index < state.elements.length - 1) {
    [state.elements[index], state.elements[index + 1]] = [state.elements[index + 1], state.elements[index]];
    state.elements[index].zIndex++;
    state.elements[index + 1].zIndex--;
  } else if (direction === 'down' && index > 0) {
    [state.elements[index], state.elements[index - 1]] = [state.elements[index - 1], state.elements[index]];
    state.elements[index].zIndex--;
    state.elements[index - 1].zIndex++;
  }
  renderAll();
}

// Mouse event variables for dragging/resizing/rotating
let startX, startY, startWidth, startHeight, startRotation, startMouseX, startMouseY;

// Event listeners for elements (delegated to canvas)
canvas.addEventListener('mousedown', (e) => {
  const target = e.target;
  const elemDiv = target.closest('.element');
  if (!elemDiv) return;
  const id = elemDiv.id;
  selectElement(id);
  const elem = state.elements.find(e => e.id === id);
  startX = elem.x;
  startY = elem.y;
  startWidth = elem.width;
  startHeight = elem.height;
  startRotation = elem.rotation;
  startMouseX = e.clientX;
  startMouseY = e.clientY;
  if (target.classList.contains('handle')) {
    state.currentAction = 'resize';
  } else if (target.classList.contains('rotate-handle')) {
    state.currentAction = 'rotate';
  } else {
    state.currentAction = 'drag';
  }
});

document.addEventListener('mousemove', (e) => {
  if (!state.currentAction || !state.selectedElementId) return;
  const elem = state.elements.find(e => e.id === state.selectedElementId);
  const dx = e.clientX - startMouseX;
  const dy = e.clientY - startMouseY;
  if (state.currentAction === 'drag') {
    elem.x = Math.max(0, Math.min(CANVAS_WIDTH - elem.width, startX + dx));
    elem.y = Math.max(0, Math.min(CANVAS_HEIGHT - elem.height, startY + dy));
  } else if (state.currentAction === 'resize') {
    const maxWidth = CANVAS_WIDTH - elem.x;
    const maxHeight = CANVAS_HEIGHT - elem.y;

    elem.width = Math.min(
      maxWidth,
      Math.max(10, startWidth + dx)
    );

    elem.height = Math.min(
      maxHeight,
      Math.max(10, startHeight + dy)
    );
  } else if (state.currentAction === 'rotate') {
    const centerX = startX + startWidth / 2;
    const centerY = startY + startHeight / 2;
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) - Math.atan2(startMouseY - centerY, startMouseX - centerX);
    elem.rotation = startRotation + (angle * 180 / Math.PI);
  }
  renderElements(); // Only re-render elements for performance
});

document.addEventListener('mouseup', () => {
  if (state.currentAction) {
    state.currentAction = null;
    renderAll(); // Full render to sync properties
  }
});

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (!state.selectedElementId) return;

  // ❗ IMPORTANT: agar user input / textarea me typing kar raha ho
  const tag = e.target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;

  const elem = state.elements.find(e => e.id === state.selectedElementId);
  if (!elem) return;

  // ✅ Delete OR Backspace dono se element delete
  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault(); // browser back / weird behaviour roko
    state.elements = state.elements.filter(e => e.id !== state.selectedElementId);
    state.selectedElementId = null;
    renderAll();
    return;
  }

  // Arrow movement
  let dx = 0, dy = 0;
  if (e.key === 'ArrowUp') dy = -5;
  else if (e.key === 'ArrowDown') dy = 5;
  else if (e.key === 'ArrowLeft') dx = -5;
  else if (e.key === 'ArrowRight') dx = 5;

  if (dx !== 0 || dy !== 0) {
    elem.x = Math.max(0, Math.min(CANVAS_WIDTH - elem.width, elem.x + dx));
    elem.y = Math.max(0, Math.min(CANVAS_HEIGHT - elem.height, elem.y + dy));
    renderAll();
  }
});

// delete element button
deleteBtn.addEventListener('click', () => {
  if (!state.selectedElementId) return;

  const confirmDelete = confirm('Delete this element?');
  if (!confirmDelete) return;

  state.elements = state.elements.filter(
    e => e.id !== state.selectedElementId
  );

  state.selectedElementId = null;
  renderAll();
   console.log('btn clicked')
});

// Export JSON
document.getElementById('export-json').addEventListener('click', () => {
  const data = JSON.stringify(state.elements, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'layout.json';
  a.click();
  URL.revokeObjectURL(url);
});

// Export HTML
document.getElementById('export-html').addEventListener('click', () => {
  let html = `<div style="position:relative; width:${CANVAS_WIDTH}px; height:${CANVAS_HEIGHT}px; background:#fff;">\n`;
  state.elements.forEach(elem => {
    const style = `position:absolute; left:${elem.x}px; top:${elem.y}px; width:${elem.width}px; height:${elem.height}px; transform:rotate(${elem.rotation}deg); background:${elem.styles.backgroundColor}; z-index:${elem.zIndex};`;
    html += `  <div style="${style}">${elem.type === 'text' ? elem.styles.textContent : ''}</div>\n`;
  });
  html += '</div>';
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'layout.html';
  a.click();
  URL.revokeObjectURL(url);
});

// create a new Page
document.getElementById('create-new').addEventListener('click', () => {
  const confirmNew = confirm(
    'This will delete all elements and create a new page. Continue?'
  );

  if (!confirmNew) return;

  // 🔴 HARD RESET
  state.elements = [];
  state.selectedElementId = null;
  state.currentAction = null;
  state.currentTool = 'select';
  state.elementCounter = 0;

  // 🔴 Clear storage
  localStorage.removeItem('editorState');

  // 🔴 Re-render everything
  renderAll();
});

// Initialize
loadState();
renderAll();
initBorderRadiusControls();
initFontStyleControls()
initTextAlignControls()