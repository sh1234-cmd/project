// Global Configuration Flags managed via Control Panel
let systemConfig = {
    showBootScreen: true
};

// Boot Screen Logic
setTimeout(() => {
    const bootScreen = document.getElementById('boot-screen');
    if (!systemConfig.showBootScreen) {
        bootScreen.style.display = 'none';
        return;
    }
    bootScreen.style.opacity = '0';
    setTimeout(() => {
        bootScreen.style.display = 'none';
    }, 1000);
}, 2000);

// System Clock
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    minutes = minutes < 10 ? '0' + minutes : minutes;
    document.getElementById('clock').innerText = hours + ':' + minutes + ' ' + ampm;
}
setInterval(updateClock, 1000);
updateClock();

// Start Menu Toggle
function toggleStartMenu(e) {
    if (e) e.stopPropagation();
    document.getElementById('start-menu').classList.toggle('hidden');
}

// Window Management System
let zIndexCounter = 10;
const windows = {};

function openWindow(appId) {
    if (windows[appId]) {
        restoreWindow(appId);
        return;
    }
    const container = document.getElementById('windows-container');
    const win = document.createElement('div');
    win.className = 'window';
    win.id = 'win-' + appId;
    
    const offset = Object.keys(windows).length * 30;
    win.style.left = (100 + offset) + 'px';
    win.style.top = (100 + offset) + 'px';
    win.style.zIndex = ++zIndexCounter;

    const titles = {
        'notepad': 'Untitled - Notepad',
        'calculator': 'Calculator',
        'cmd': 'Command Prompt',
        'minesweeper': 'Minesweeper',
        'paint': 'Paint Canvas Studio',
        'mediaplayer': 'Windows Media Player',
        'control-panel': 'Control Panel'
    };

    win.innerHTML = `
        <div class="title-bar" onmousedown="startDrag(event, '${appId}')">
            <div class="title-bar-text">${titles[appId]}</div>
            <div class="title-bar-controls">
                <button class="control-btn" onclick="minimizeWindow(event, '${appId}')">_</button>
                <button class="control-btn" onclick="maximizeWindow(event, '${appId}')">□</button>
                <button class="control-btn close" onclick="closeWindow(event, '${appId}')">X</button>
            </div>
        </div>
        <div class="window-content">
            ${document.getElementById('tpl-' + appId).innerHTML}
        </div>
    `;
    win.onmousedown = () => focusWindow(appId);
    container.appendChild(win);
    
    windows[appId] = { el: win, maximized: false, prevWidth: '400px', prevHeight: '300px', prevTop: '100px', prevLeft: '100px', calcValue: '' };
    
    addTaskbarItem(appId, titles[appId]);
    focusWindow(appId);

    // Initialization hooks for apps requiring dynamic engine bindings
    if (appId === 'cmd') {
        const input = win.querySelector('.cmd-input');
        if (input) setTimeout(() => input.focus(), 50);
    } else if (appId === 'minesweeper') {
        initMinesweeperOnElement(win);
    } else if (appId === 'paint') {
        initPaintCanvasEngine(win);
    }
}

function closeWindow(e, appId) {
    if (e) e.stopPropagation();
    if (!windows[appId]) return;
    
    if (appId === 'minesweeper' && windows[appId].msTimerId) {
        clearInterval(windows[appId].msTimerId);
    }
    if (appId === 'mediaplayer') {
        const audio = windows[appId].el.querySelector('.player-audio-node');
        if (audio) { audio.pause(); audio.currentTime = 0; }
    }

    windows[appId].el.remove();
    delete windows[appId];
    const taskbarItem = document.getElementById('taskbar-item-' + appId);
    if (taskbarItem) taskbarItem.remove();
}

function minimizeWindow(e, appId) {
    if (e) e.stopPropagation();
    if (!windows[appId]) return;
    windows[appId].el.style.display = 'none';
    const taskbarItem = document.getElementById('taskbar-item-' + appId);
    if (taskbarItem) taskbarItem.classList.remove('active');
}

function restoreWindow(appId) {
    if (!windows[appId]) return;
    windows[appId].el.style.display = 'flex';
    focusWindow(appId);
    if (appId === 'paint') {
        syncPaintCanvasSize(windows[appId].el);
    }
}

function maximizeWindow(e, appId) {
    if (e) e.stopPropagation();
    const state = windows[appId];
    if (!state) return;
    const win = state.el;
    
    if (state.maximized) {
        win.style.width = state.prevWidth;
        win.style.height = state.prevHeight;
        win.style.top = state.prevTop;
        win.style.left = state.prevLeft;
        state.maximized = false;
    } else {
        state.prevWidth = win.style.width || '400px';
        state.prevHeight = win.style.height || '300px';
        state.prevTop = win.style.top;
        state.prevLeft = win.style.left;
        
        win.style.width = '100%';
        win.style.height = 'calc(100% - 40px)';
        win.style.top = '0';
        win.style.left = '0';
        state.maximized = true;
    }

    if (appId === 'paint') {
        setTimeout(() => syncPaintCanvasSize(win), 50);
    }
}

function focusWindow(appId) {
    if (!windows[appId]) return;
    windows[appId].el.style.zIndex = ++zIndexCounter;
    
    document.querySelectorAll('.taskbar-item').forEach(el => el.classList.remove('active'));
    const taskbarBtn = document.getElementById('taskbar-item-' + appId);
    if(taskbarBtn) taskbarBtn.classList.add('active');
}

// Drag & Drop Logic
let activeDrag = null;
let startX = 0, startY = 0;
let startLeft = 0, startTop = 0;

function startDrag(e, appId) {
    if (e.target.closest('.title-bar-controls')) return; 
    if (windows[appId].maximized) return; 
    
    activeDrag = windows[appId].el;
    focusWindow(appId);
    
    startX = e.clientX;
    startY = e.clientY;
    
    startLeft = parseInt(activeDrag.style.left, 10) || 0;
    startTop = parseInt(activeDrag.style.top, 10) || 0;
    
    document.onmousemove = doDrag;
    document.onmouseup = stopDrag;
    e.preventDefault();
}

function doDrag(e) {
    if (!activeDrag) return;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    activeDrag.style.left = (startLeft + deltaX) + 'px';
    activeDrag.style.top = (startTop + deltaY) + 'px';
}

function stopDrag() {
    if (activeDrag && activeDrag.id === 'win-paint') {
        syncPaintCanvasSize(activeDrag);
    }
    activeDrag = null;
    document.onmousemove = null;
    document.onmouseup = null;
}

// Taskbar System
function addTaskbarItem(appId, title) {
    const tb = document.getElementById('taskbar-apps');
    const btn = document.createElement('div');
    btn.className = 'taskbar-item active';
    btn.id = 'taskbar-item-' + appId;
    
    let iconSrc = 'https://win98icons.alexmeub.com/icons/png/notepad-0.png';
    if(appId === 'calculator') iconSrc = 'https://win98icons.alexmeub.com/icons/png/calculator-0.png';
    if(appId === 'cmd') iconSrc = 'https://win98icons.alexmeub.com/icons/png/console_prompt-0.png';
    if(appId === 'minesweeper') iconSrc = 'https://win98icons.alexmeub.com/icons/png/minesweeper_laser-0.png';
    if(appId === 'paint') iconSrc = 'https://win98icons.alexmeub.com/icons/png/paint_old-0.png';
    if(appId === 'mediaplayer') iconSrc = 'https://win98icons.alexmeub.com/icons/png/cd_audio_cd-0.png';
    if(appId === 'control-panel') iconSrc = 'https://win98icons.alexmeub.com/icons/png/control_panel-4.png';
    
    btn.innerHTML = `<img src="${iconSrc}" width="16" style="margin-right:5px;"> ${title}`;
    
    btn.onclick = (e) => {
        e.stopPropagation();
        const win = windows[appId].el;
        if (win.style.display === 'none') {
            restoreWindow(appId);
        } else {
            if (win.style.zIndex == zIndexCounter) {
                minimizeWindow(null, appId);
            } else {
                focusWindow(appId);
            }
        }
    };
    
    document.querySelectorAll('.taskbar-item').forEach(el => el.classList.remove('active'));
    tb.appendChild(btn);
}

// Calculator Engine Logic
function getCalcDisplay(btnEl) {
    return btnEl.closest('.calculator').querySelector('.calc-display');
}
function calcType(e, val) {
    const appId = e.target.closest('.window').id.replace('win-', '');
    windows[appId].calcValue += val;
    getCalcDisplay(e.target).value = windows[appId].calcValue;
}
if (!window.calcOp) {
    window.calcOp = function(e, op) {
        const appId = e.target.closest('.window').id.replace('win-', '');
        windows[appId].calcValue += op;
        getCalcDisplay(e.target).value = windows[appId].calcValue;
    }
}
function calcClear(e) {
    const appId = e.target.closest('.window').id.replace('win-', '');
    windows[appId].calcValue = '';
    getCalcDisplay(e.target).value = '0';
}
function calcEq(e) {
    const appId = e.target.closest('.window').id.replace('win-', '');
    try {
        if(windows[appId].calcValue) {
            windows[appId].calcValue = eval(windows[appId].calcValue).toString();
            getCalcDisplay(e.target).value = windows[appId].calcValue;
        }
    } catch {
        getCalcDisplay(e.target).value = 'Error';
        windows[appId].calcValue = '';
    }
}

// CMD Command Engine Logic
function focusCmdInput(el) {
    const input = el.querySelector('.cmd-input');
    if (input) input.focus();
}
function handleCmd(e) {
    if (e.key === 'Enter') {
        const input = e.target;
        const cmd = input.value.trim();
        const winContent = input.closest('.cmd');
        const output = winContent.querySelector('.cmd-output');
        
        output.innerHTML += cmd + '<br>';
        
        if (cmd.toLowerCase() === 'dir') {
            output.innerHTML += ' Volume in drive C has no label.<br> Directory of C:\\Users\\User<br><br>08/06/2026  03:15 PM    &lt;DIR&gt;          .<br>08/06/2026  03:15 PM    &lt;DIR&gt;          ..<br>08/06/2026  03:15 PM                 0 config.sys<br>               1 File(s)              0 bytes<br><br>';
        } else if (cmd.toLowerCase() === 'help') {
            output.innerHTML += 'Available commands: dir, help, echo, cls, theme, winver<br>';
        } else if (cmd.toLowerCase().startsWith('echo ')) {
            output.innerHTML += cmd.substring(5) + '<br>';
        } else if (cmd.toLowerCase() === 'cls') {
            output.innerHTML = 'Microsoft Windows [Version 6.1.7601]<br>Copyright (c) 2009 Microsoft Corporation. All rights reserved.<br><br>';
        } else if (cmd.toLowerCase() === 'winver') {
            output.innerHTML += 'WebOS Environment Platform (Build 2026.1.1)<br>';
        } else if (cmd.toLowerCase().startsWith('theme ')) {
            const tgtTheme = cmd.substring(6).trim().toLowerCase();
            if(['aero','classic','neon'].includes(tgtTheme)) {
                changeTheme(tgtTheme);
                output.innerHTML += `Theme altered to ${tgtTheme}.<br>`;
            } else {
                output.innerHTML += "Unknown theme choice. Try 'aero', 'classic', or 'neon'.<br>";
            }
        } else if (cmd !== '') {
            output.innerHTML += `'${cmd}' is not recognized as an internal or external command.<br>`;
        }
        
        output.innerHTML += 'C:\\Users\\User&gt; ';
        input.value = '';
        winContent.scrollTop = winContent.scrollHeight;
    }
}

// Control Panel Logic
function switchCPTab(navItem, tabId) {
    const appEl = navItem.closest('.control-panel-app');
    appEl.querySelectorAll('.cp-nav-item').forEach(el => el.classList.remove('active'));
    navItem.classList.add('active');
    
    appEl.querySelectorAll('.cp-tab-pane').forEach(el => el.classList.add('hidden'));
    appEl.querySelector('#cp-' + tabId).classList.remove('hidden');
}
function changeTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
}
function toggleBootScreenSetting(checkbox) {
    systemConfig.showBootScreen = checkbox.checked;
}
function updateWallpaperPattern(selectEl) {
    const desktop = document.getElementById('desktop');
    if (selectEl.value === 'solid') {
        desktop.style.background = 'var(--desktop-bg)';
    } else if (selectEl.value === 'grid') {
        desktop.style.background = 'radial-gradient(circle, transparent 20%, var(--desktop-bg) 20%, var(--desktop-bg) 80%, transparent 80%, transparent), radial-gradient(circle, transparent 20%, var(--desktop-bg) 20%, var(--desktop-bg) 80%, transparent 80%, transparent) 10px 10px';
        desktop.style.backgroundColor = '#111';
        desktop.style.backgroundSize = '20px 20px';
    } else {
        desktop.style.background = '';
    }
}

// Minesweeper Engine Logic
function initMinesweeper(e) {
    const winEl = e.target.closest('.window');
    initMinesweeperOnElement(winEl);
}

function initMinesweeperOnElement(winEl) {
    const appId = 'minesweeper';
    const state = windows[appId];
    if (!state) return;
    
    if (state.msTimerId) clearInterval(state.msTimerId);
    
    const rows = 9;
    const cols = 9;
    const minesCount = 10;
    
    state.msRows = rows;
    state.msCols = cols;
    state.msMinesCount = minesCount;
    state.msFlags = 0;
    state.msGameOver = false;
    state.msTime = 0;
    state.msCellsRevealed = 0;
    state.msStarted = false;
    
    const gridEl = winEl.querySelector('.ms-grid');
    const smileyEl = winEl.querySelector('.ms-smiley');
    const mineCounterEl = winEl.querySelector('#ms-mines-count');
    const timerEl = winEl.querySelector('#ms-timer');
    
    smileyEl.innerText = '🙂';
    timerEl.innerText = '000';
    mineCounterEl.innerText = String(minesCount).padStart(3, '0');
    gridEl.innerHTML = '';
    
    const board = [];
    for(let r=0; r<rows; r++) {
        board[r] = [];
        for(let c=0; c<cols; c++) {
            board[r][c] = { r, c, isMine: false, neighborMines: 0, revealed: false, flagged: false };
        }
    }
    
    let planted = 0;
    while(planted < minesCount) {
        let r = Math.floor(Math.random() * rows);
        let c = Math.floor(Math.random() * cols);
        if(!board[r][c].isMine) {
            board[r][c].isMine = true;
            planted++;
        }
    }
    
    for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
            if(board[r][c].isMine) continue;
            let count = 0;
            for(let dr=-1; dr<=1; dr++) {
                for(let dc=-1; dc<=1; dc++) {
                    if(board[r+dr] && board[r+dr][c+dc] && board[r+dr][c+dc].isMine) count++;
                }
            }
            board[r][c].neighborMines = count;
        }
    }
    
    state.msBoard = board;
    
    for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
            const cellEl = document.createElement('div');
            cellEl.className = 'ms-cell';
            cellEl.dataset.row = r;
            cellEl.dataset.col = c;
            
            cellEl.addEventListener('click', (ev) => handleMSClick(ev, r, c, winEl));
            cellEl.addEventListener('contextmenu', (ev) => {
                ev.preventDefault();
                handleMSRightClick(ev, r, c, winEl);
            });
            
            gridEl.appendChild(cellEl);
        }
    }
}

function startMSTimer(winEl) {
    const appId = 'minesweeper';
    const state = windows[appId];
    const timerEl = winEl.querySelector('#ms-timer');
    
    state.msStarted = true;
    state.msTimerId = setInterval(() => {
        state.msTime++;
        if(state.msTime > 999) state.msTime = 999;
        timerEl.innerText = String(state.msTime).padStart(3, '0');
    }, 1000);
}

function handleMSClick(ev, r, c, winEl) {
    const appId = 'minesweeper';
    const state = windows[appId];
    if(state.msGameOver) return;
    
    const cell = state.msBoard[r][c];
    if(cell.flagged || cell.revealed) return;
    
    if(!state.msStarted) startMSTimer(winEl);
    
    revealMSCell(r, c, winEl);
    checkMSWinState(winEl);
}

function handleMSRightClick(ev, r, c, winEl) {
    const appId = 'minesweeper';
    const state = windows[appId];
    if(state.msGameOver) return;
    
    const cell = state.msBoard[r][c];
    if(cell.revealed) return;
    
    if(!state.msStarted) startMSTimer(winEl);
    
    const cellEl = winEl.querySelector(`.ms-cell[data-row='${r}'][data-col='${c}']`);
    const mineCounterEl = winEl.querySelector('#ms-mines-count');
    
    if(!cell.flagged) {
        cell.flagged = true;
        cellEl.classList.add('flagged');
        cellEl.innerText = '🚩';
        state.msFlags++;
    } else {
        cell.flagged = false;
        cellEl.classList.remove('flagged');
        cellEl.innerText = '';
        state.msFlags--;
    }
    mineCounterEl.innerText = String(state.msMinesCount - state.msFlags).padStart(3, '0');
}

function revealMSCell(r, c, winEl) {
    const appId = 'minesweeper';
    const state = windows[appId];
    const cell = state.msBoard[r][c];
    
    if(cell.revealed) return;
    
    cell.revealed = true;
    state.msCellsRevealed++;
    
    const cellEl = winEl.querySelector(`.ms-cell[data-row='${r}'][data-col='${c}']`);
    cellEl.classList.add('revealed');
    
    if(cell.isMine) {
        cellEl.classList.add('mine');
        cellEl.innerText = '💣';
        triggerMSGameOver(false, winEl);
        return;
    }
    
    if(cell.neighborMines > 0) {
        cellEl.innerText = cell.neighborMines;
        cellEl.dataset.num = cell.neighborMines;
    } else {
        for(let dr=-1; dr<=1; dr++) {
            for(let dc=-1; dc<=1; dc++) {
                if(state.msBoard[r+dr] && state.msBoard[r+dr][c+dc]) {
                    revealMSCell(r+dr, c+dc, winEl);
                }
            }
        }
    }
}

function checkMSWinState(winEl) {
    const appId = 'minesweeper';
    const state = windows[appId];
    const totalCells = state.msRows * state.msCols;
    if(state.msCellsRevealed === totalCells - state.msMinesCount && !state.msGameOver) {
        triggerMSGameOver(true, winEl);
    }
}

function triggerMSGameOver(isWin, winEl) {
    const appId = 'minesweeper';
    const state = windows[appId];
    state.msGameOver = true;
    clearInterval(state.msTimerId);
    
    const smileyEl = winEl.querySelector('.ms-smiley');
    smileyEl.innerText = isWin ? '😎' : '😵';
    
    for(let r=0; r<state.msRows; r++) {
        for(let c=0; c<state.msCols; c++) {
            const item = state.msBoard[r][c];
            const cellEl = winEl.querySelector(`.ms-cell[data-row='${r}'][data-col='${c}']`);
            if(item.isMine && !item.flagged) {
                cellEl.classList.add('revealed', 'mine');
                cellEl.innerText = '💣';
            }
        }
    }
}

// Paint Studio Engine Logic
function initPaintCanvasEngine(winEl) {
    const canvas = winEl.querySelector('.paint-canvas');
    const ctx = canvas.getContext('2d');
    
    let painting = false;
    canvas.brushColor = '#000000';
    canvas.brushSize = 2;

    syncPaintCanvasSize(winEl);

    function startPosition(e) {
        painting = true;
        draw(e);
    }
    function finishedPosition() {
        painting = false;
        ctx.beginPath();
    }
    function draw(e) {
        if(!painting) return;
        const rect = canvas.getBoundingClientRect();
        
        ctx.lineWidth = canvas.brushSize;
        ctx.lineCap = 'round';
        ctx.strokeStyle = canvas.brushColor;

        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }

    canvas.addEventListener('mousedown', startPosition);
    canvas.addEventListener('mouseup', finishedPosition);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseleave', finishedPosition);
}

function syncPaintCanvasSize(winEl) {
    const canvas = winEl.querySelector('.paint-canvas');
    const container = winEl.querySelector('.canvas-container');
    if (!canvas || !container) return;
    
    // Save image buffer to handle resizing changes cleanly
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);
}

function updatePaintBrushColor(inputEl) {
    const canvas = inputEl.closest('.paint-app').querySelector('.paint-canvas');
    if (canvas) canvas.brushColor = inputEl.value;
}

function setPaintBrushSize(e, size) {
    const container = e.target.closest('.paint-toolbar');
    container.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    const canvas = e.target.closest('.paint-app').querySelector('.paint-canvas');
    if (canvas) canvas.brushSize = size;
}

function clearPaintCanvas(btnEl) {
    const canvas = btnEl.closest('.paint-app').querySelector('.paint-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// Media Player Engine Logic
function controlPlayer(btnEl, action) {
    const appContainer = btnEl.closest('.player-app');
    const audio = appContainer.querySelector('.player-audio-node');
    const statusText = appContainer.querySelector('.track-status');
    const visualizer = appContainer.querySelector('.visualization-box');

    if (action === 'play') {
        audio.play().catch(() => {
            statusText.innerText = "Error Loading Audio";
        });
        statusText.innerText = "Playing";
        visualizer.classList.add('active');
    } else if (action === 'pause') {
        audio.pause();
        statusText.innerText = "Paused";
        visualizer.classList.remove('active');
    } else if (action === 'stop') {
        audio.pause();
        audio.currentTime = 0;
        statusText.innerText = "Stopped";
        visualizer.classList.remove('active');
    }
}

// Global Document Event Click Closes Context Menus
document.addEventListener('click', (e) => {
    const startMenu = document.getElementById('start-menu');
    const startBtn = document.getElementById('start-btn');
    if (!startMenu.classList.contains('hidden') && !startMenu.contains(e.target) && !startBtn.contains(e.target)) {
        startMenu.classList.add('hidden');
    }
});