// Window System Global Context Allocation
let windowZIndex = 100;
let activeWindowId = null;
let msGrid = [];
let msMines = 10;
let msTimerInterval = null;
let msTimeElapsed = 0;
let msIsGameOver = false;

// Initialization Hook
window.addEventListener('DOMContentLoaded', () => {
    // Break the bootloader scene wrap safely
    setTimeout(() => {
        const boot = document.getElementById('boot-screen');
        if (boot) {
            boot.style.opacity = '0';
            setTimeout(() => { boot.style.display = 'none'; }, 1000);
        }
    }, 1800);

    // Initialize System Tray Engine Output
    updateClock();
    setInterval(updateClock, 1000);

    // Global Click Dismiss rules
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('start-menu');
        const startBtn = document.getElementById('start-btn');
        if (menu && !menu.classList.contains('hidden') && !menu.contains(e.target) && !startBtn.contains(e.target)) {
            menu.classList.add('hidden');
        }
    });
});

function updateClock() {
    const clockEl = document.getElementById('clock');
    if (!clockEl) return;
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // structural conversion format
    clockEl.textContent = `${hours}:${minutes} ${ampm}`;
}

function toggleStartMenu(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('start-menu');
    if (menu) menu.classList.toggle('hidden');
}

// Window Controller Modules
function openWindow(appId) {
    const container = document.getElementById('windows-container');
    if (!container) return;

    // Avoid duplicating operational shells
    if (document.getElementById(`win-${appId}`)) {
        focusWindow(appId);
        return;
    }

    const template = document.getElementById(`tpl-${appId}`);
    if (!template) return;

    windowZIndex++;
    const win = document.createElement('div');
    win.id = `win-${appId}`;
    win.className = 'window';
    win.style.zIndex = windowZIndex;
    win.style.left = `${50 + (windowZIndex % 10) * 15}px`;
    win.style.top = `${40 + (windowZIndex % 10) * 15}px`;

    const appTitles = {
        'notepad': 'Notepad - Text Editor',
        'calculator': 'Calculator',
        'cmd': 'Command Prompt',
        'minesweeper': 'Minesweeper Pro',
        'paint': 'Paint Canvas Studio',
        'mediaplayer': 'Media Player v1.0',
        'control-panel': 'Control Panel'
    };

    win.innerHTML = `
        <div class="title-bar" onmousedown="startWindowDrag(event, '${appId}')">
            <div class="title-bar-text">${appTitles[appId] || appId}</div>
            <div class="title-bar-controls">
                <button class="control-btn" onclick="minimizeWindow('${appId}')">0</button>
                <button class="control-btn" style="font-weight:bold;">1</button>
                <button class="control-btn close" onclick="closeWindow('${appId}')">r</button>
            </div>
        </div>
        <div class="window-content" onmousedown="focusWindow('${appId}')">
            ${template.innerHTML}
        </div>
    `;

    container.appendChild(win);
    addTaskbarTab(appId, appTitles[appId] || appId);
    focusWindow(appId);

    // Initialization bindings unique to context parameters
    if (appId === 'minesweeper') {
        const gridContainer = win.querySelector('.ms-grid');
        if (gridContainer) initMinesweeperElements(gridContainer);
    } else if (appId === 'paint') {
        initPaintCanvas(win.querySelector('.paint-canvas'));
    }
}

function focusWindow(appId) {
    const win = document.getElementById(`win-${appId}`);
    if (!win) return;
    windowZIndex++;
    win.style.zIndex = windowZIndex;
    activeWindowId = appId;

    document.querySelectorAll('.taskbar-item').forEach(item => item.classList.remove('active'));
    const tbi = document.getElementById(`tbi-${appId}`);
    if (tbi) tbi.classList.add('active');
}

function closeWindow(appId) {
    const win = document.getElementById(`win-${appId}`);
    if (win) win.remove();
    const tbi = document.getElementById(`tbi-${appId}`);
    if (tbi) tbi.remove();

    if (appId === 'minesweeper' && msTimerInterval) {
        clearInterval(msTimerInterval);
        msTimerInterval = null;
    }
}

function minimizeWindow(appId) {
    const win = document.getElementById(`win-${appId}`);
    if (win) win.remove();
    const tbi = document.getElementById(`tbi-${appId}`);
    if (tbi) tbi.classList.remove('active');
}

// Taskbar Tracking Array Setup
function addTaskbarTab(appId, title) {
    const appsBar = document.getElementById('taskbar-apps');
    if (!appsBar) return;
    if (document.getElementById(`tbi-${appId}`)) return;

    const btn = document.createElement('div');
    btn.id = `tbi-${appId}`;
    btn.className = 'taskbar-item';
    btn.textContent = title.split(' - ')[0];
    btn.onclick = () => {
        if (document.getElementById(`win-${appId}`) && activeWindowId === appId) {
            minimizeWindow(appId);
        } else {
            openWindow(appId);
        }
    };
    appsBar.appendChild(btn);
}

// Dragging Layer Interceptor Engine
function startWindowDrag(e, appId) {
    const win = document.getElementById(`win-${appId}`);
    if (!win) return;
    focusWindow(appId);

    if (e.target.closest('.title-bar-controls')) return;

    let posX = e.clientX;
    let posY = e.clientY;

    function moveEvent(moveEvt) {
        const diffX = moveEvt.clientX - posX;
        const diffY = moveEvt.clientY - posY;
        posX = moveEvt.clientX;
        posY = moveEvt.clientY;
        win.style.left = `${win.offsetLeft + diffX}px`;
        win.style.top = `${win.offsetTop + diffY}px`;
    }

    function stopEvent() {
        document.removeEventListener('mousemove', moveEvent);
        document.removeEventListener('mouseup', stopEvent);
    }

    document.addEventListener('mousemove', moveEvent);
    document.addEventListener('mouseup', stopEvent);
}

// App Subsystem Interface Blocks: CMD Prompt Interpreter
function focusCmdInput(container) {
    const inp = container.querySelector('.cmd-input');
    if (inp) inp.focus();
}

function handleCmd(e) {
    if (e.key !== 'Enter') return;
    const inp = e.target;
    const cmdText = inp.value.trim().toLowerCase();
    const winContent = inp.closest('.app-content');
    const out = winContent.querySelector('.cmd-output');

    let response = `\n'${inp.value}' is not recognized as an internal or external command,\noperable program or batch file.\n`;
    
    if (cmdText === 'help') {
        response = `\nSupported OS commands:\n  help    - Show system documentation\n  ver     - Output environment builds\n  cls     - Flush terminal stream buffer\n  theme   - Toggle theme configurations (theme classic / theme aero)\n`;
    } else if (cmdText === 'ver') {
        response = `\nMicrosoft Windows Engine Sandbox Terminal [Version 6.1.7601]\n`;
    } else if (cmdText === 'cls') {
        out.innerHTML = '';
        inp.value = '';
        return;
    } else if (cmdText.startsWith('theme ')) {
        const selection = cmdText.split(' ')[1];
        if (['aero', 'classic', 'neon'].includes(selection)) {
            changeTheme(selection);
            response = `\nTheme successfully updated to ${selection}.\n`;
        } else {
            response = `\nInvalid theme. Try 'theme aero' or 'theme classic'.\n`;
        }
    }

    out.innerHTML += `C:\\Users\\User&gt; ${inp.value}<br>${response.replace(/\n/g, '<br>')}<br>`;
    inp.value = '';
    
    const cmdParent = winContent.closest('.cmd');
    if (cmdParent) cmdParent.scrollTop = cmdParent.scrollHeight;
}

// App Subsystem Interface Blocks: Control Panel Theme Routing
function switchCPTab(target, tabId) {
    const appWin = target.closest('.control-panel-app');
    appWin.querySelectorAll('.cp-nav-item').forEach(el => el.classList.remove('active'));
    target.classList.add('active');

    appWin.querySelectorAll('.cp-tab-pane').forEach(el => el.classList.add('hidden'));
    const targetedPane = appWin.querySelector(`#cp-${tabId}`);
    if (targetedPane) targetedPane.classList.remove('hidden');
}

function changeTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
}

function toggleBootScreenSetting(cb) {
    // Soft toggle rule matrix mapping logic interface placeholders
}

function updateWallpaperPattern(select) {
    const desktop = document.getElementById('desktop');
    if (!desktop) return;
    const style = select.value;
    if (style === 'solid') {
        desktop.style.background = '#1a365d';
    } else if (style === 'grid') {
        desktop.style.background = 'radial-gradient(circle, #2d3748 10%, transparent 11%), #1a202c';
        desktop.style.backgroundSize = '20px 20px';
    } else {
        desktop.style.background = 'var(--desktop-bg)';
        desktop.style.backgroundSize = 'cover';
    }
}

// App Subsystem Interface Blocks: Calculator Matrix Engine
let calcMemory = '0';
let calcOperation = null;
let calcResetOnNextType = false;

function calcType(e, char) {
    const display = e.target.closest('.calculator').querySelector('.calc-display');
    if (display.value === '0' || calcResetOnNextType) {
        display.value = char;
        calcResetOnNextType = false;
    } else {
        display.value += char;
    }
}

function calcOp(e, op) {
    const display = e.target.closest('.calculator').querySelector('.calc-display');
    calcMemory = display.value;
    calcOperation = op;
    calcResetOnNextType = true;
}

function calcClear(e) {
    const display = e.target.closest('.calculator').querySelector('.calc-display');
    display.value = '0';
    calcMemory = '0';
    calcOperation = null;
    calcResetOnNextType = false;
}

function calcEq(e) {
    const display = e.target.closest('.calculator').querySelector('.calc-display');
    if (!calcOperation) return;
    const val1 = parseFloat(calcMemory);
    const val2 = parseFloat(display.value);
    let out = 0;
    switch(calcOperation) {
        case '+': out = val1 + val2; break;
        case '-': out = val1 - val2; break;
        case '*': out = val1 * val2; break;
        case '/': out = val2 !== 0 ? val1 / val2 : 'Error'; break;
    }
    display.value = out;
    calcOperation = null;
    calcResetOnNextType = true;
}

// App Subsystem Interface Blocks: Paint Logic Canvas Matrix
function initPaintCanvas(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let painting = false;
    let brushColor = '#000000';
    let brushSize = 2;

    // Standard high density display configuration rules mappings
    canvas.width = 280;
    canvas.height = 200;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    canvas.onmousedown = (e) => { painting = true; draw(e); };
    canvas.onmousemove = (e) => { draw(e); };
    window.addEventListener('mouseup', () => painting = false);

    function draw(e) {
        if (!painting) return;
        const rect = canvas.getBoundingClientRect();
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.strokeStyle = brushColor;

        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }

    const appRoot = canvas.closest('.paint-app');
    if (appRoot) {
        appRoot.querySelector('.paint-color').onchange = (evt) => { brushColor = evt.target.value; };
        appRoot.querySelectorAll('.size-btn').forEach(btn => {
            btn.onclick = (evt) => {
                appRoot.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
                evt.target.classList.add('active');
                brushSize = parseInt(evt.target.getAttribute('onclick').match(/\d+/)[0]);
            };
        });
        appRoot.querySelector('.paint-clear-btn').onclick = () => {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
        };
    }
}

// App Subsystem Interface Blocks: Audio Player Hook Sync
function controlPlayer(btn, macro) {
    const parent = btn.closest('.player-app');
    const node = parent.querySelector('.player-audio-node');
    const visualizer = parent.querySelector('.visualization-box');
    const statusText = parent.querySelector('.track-status');

    if (macro === 'play') {
        node.play().catch(() => {});
        visualizer.classList.add('active');
        statusText.textContent = 'Playing';
    } else if (macro === 'pause') {
        node.pause();
        visualizer.classList.remove('active');
        statusText.textContent = 'Paused';
    } else if (macro === 'stop') {
        node.pause();
        node.currentTime = 0;
        visualizer.classList.remove('active');
        statusText.textContent = 'Stopped';
    }
}

// App Subsystem Interface Blocks: Native Logic Grid Minesweeper Initialization
function initMinesweeper(e) {
    const app = e.target.closest('.minesweeper-app');
    const gridEl = app.querySelector('.ms-grid');
    initMinesweeperElements(gridEl);
}

function initMinesweeperElements(gridContainer) {
    const parentApp = gridContainer.closest('.minesweeper-app');
    const mineCounter = parentApp.querySelector('#ms-mines-count');
    const timerCounter = parentApp.querySelector('#ms-timer');
    const smiley = parentApp.querySelector('.ms-smiley');

    if (msTimerInterval) clearInterval(msTimerInterval);
    msTimeElapsed = 0;
    msIsGameOver = false;
    timerCounter.textContent = '000';
    mineCounter.textContent = '010';
    smiley.textContent = '🙂';

    msGrid = Array(9).fill(null).map(() => Array(9).fill(0));
    gridContainer.innerHTML = '';

    // Assign 10 coordinate arrays for mines randomly
    let assigned = 0;
    while (assigned < 10) {
        const r = Math.floor(Math.random() * 9);
        const c = Math.floor(Math.random() * 9);
        if (msGrid[r][c] !== 'M') {
            msGrid[r][c] = 'M';
            assigned++;
        }
    }

    // Set configuration maps around nodes
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (msGrid[r][c] === 'M') continue;
            let count = 0;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (msGrid[r + i] && msGrid[r + i][c + j] === 'M') count++;
                }
            }
            msGrid[r][c] = count;
        }
    }

    // Create cells inside DOM element nodes sequentially
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = document.createElement('div');
            cell.className = 'ms-cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            cell.addEventListener('click', (evt) => handleMinesweeperClick(evt, r, c, cell, parentApp));
            cell.addEventListener('contextmenu', (evt) => {
                evt.preventDefault();
                handleMinesweeperRightClick(cell, mineCounter);
            });
            gridContainer.appendChild(cell);
        }
    }
}

function startMinesTimer(timerEl) {
    if (msTimerInterval) return;
    msTimerInterval = setInterval(() => {
        msTimeElapsed++;
        timerEl.textContent = String(Math.min(msTimeElapsed, 999)).padStart(3, '0');
    }, 1000);
}

function handleMinesweeperClick(evt, r, c, cell, parentApp) {
    if (msIsGameOver || cell.classList.contains('revealed') || cell.textContent === '🚩') return;
    
    const timerCounter = parentApp.querySelector('#ms-timer');
    startMinesTimer(timerCounter);

    if (msGrid[r][c] === 'M') {
        // Mine blast triggered
        cell.classList.add('mine');
        cell.textContent = '💣';
        msIsGameOver = true;
        clearInterval(msTimerInterval);
        msTimerInterval = null;
        parentApp.querySelector('.ms-smiley').textContent = '😵';
        revealAllMines(parentApp);
    } else {
        revealMinesCell(r, c, parentApp);
        checkMinesweeperWinCondition(parentApp);
    }
}

function handleMinesweeperRightClick(cell, counterEl) {
    if (msIsGameOver || cell.classList.contains('revealed')) return;
    let currentMines = parseInt(counterEl.textContent);

    if (cell.textContent === '🚩') {
        cell.textContent = '';
        counterEl.textContent = String(currentMines + 1).padStart(3, '0');
    } else {
        cell.textContent = '🚩';
        counterEl.textContent = String(currentMines - 1).padStart(3, '0');
    }
}

function revealMinesCell(r, c, parentApp) {
    const cell = parentApp.querySelector(`.ms-cell[data-row="${r}"][data-col="${c}"]`);
    if (!cell || cell.classList.contains('revealed')) return;

    cell.classList.add('revealed');
    const val = msGrid[r][c];

    if (val > 0) {
        cell.textContent = val;
        cell.setAttribute('data-num', val);
    } else {
        // Continuous flood expansion sequence over null zones
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (msGrid[r + i] !== undefined && msGrid[r + i][c + j] !== undefined) {
                    revealMinesCell(r + i, c + j, parentApp);
                }
            }
        }
    }
}

function revealAllMines(parentApp) {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (msGrid[r][c] === 'M') {
                const cell = parentApp.querySelector(`.ms-cell[data-row="${r}"][data-col="${c}"]`);
                if (cell && !cell.classList.contains('mine')) {
                    cell.textContent = '💣';
                    cell.classList.add('revealed');
                }
            }
        }
    }
}

function checkMinesweeperWinCondition(parentApp) {
    const cells = parentApp.querySelectorAll('.ms-cell');
    let coveredSafeCells = 0;

    cells.forEach(cell => {
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        if (msGrid[r][c] !== 'M' && !cell.classList.contains('revealed')) {
            coveredSafeCells++;
        }
    });

    if (coveredSafeCells === 0) {
        msIsGameOver = true;
        clearInterval(msTimerInterval);
        msTimerInterval = null;
        parentApp.querySelector('.ms-smiley').textContent = '😎';
    }
}
