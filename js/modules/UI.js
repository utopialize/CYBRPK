export class UI {
    constructor() {
        this.gameLog = document.getElementById('game-log');
        this.inputField = document.getElementById('command-input');
        this.promptDisplay = document.getElementById('prompt');
        this.terminalContainer = document.getElementById('terminal-container');
        this.canvasContainer = document.getElementById('canvas-container');
        this.hackCanvas = document.getElementById('hack-canvas');
        this.hackCtx = this.hackCanvas ? this.hackCanvas.getContext('2d') : null;
        
        this.minimapCanvas = document.getElementById('minimap-canvas');
        this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

        // HUD Elements
        this.hudAvatar = document.getElementById('hud-avatar');
        this.hudHpText = document.getElementById('hud-hp-text');
        this.hudHpBar = document.getElementById('hud-hp-bar');
        this.hudStatsContent = document.getElementById('hud-stats-content');
        
        // Title Screen
        this.titleScreen = document.getElementById('title-screen');
        this.titleLogo = document.getElementById('title-logo');
        
        // Command History
        this.commandHistory = [];
        this.historyIndex = -1;
        
        // Autocomplete
        this.autocompleteContext = null; // Will be set by Game
        
        // Custom cursor
        this.customCursor = document.getElementById('custom-cursor');
        this.inputMirror = document.getElementById('input-mirror');
        
        // HUD Tabs and Views
        this.tabStats = document.getElementById('tab-stats');
        this.tabInventory = document.getElementById('tab-inventory');
        this.viewStats = document.getElementById('view-stats');
        this.viewInventory = document.getElementById('view-inventory');
        this.equipmentSlots = document.getElementById('equipment-slots');
        this.inventoryItems = document.getElementById('inventory-items');
        
        // Setup input handlers
        this.setupInputHandlers();
        this.setupHUDTabs();
    }

    setupHUDTabs() {
        if (!this.tabStats || !this.tabInventory) return;
        
        this.tabStats.addEventListener('click', () => this.switchTab('stats'));
        this.tabInventory.addEventListener('click', () => this.switchTab('inventory'));
    }

    switchTab(tabName) {
        if (tabName === 'stats') {
            this.tabStats.classList.add('active');
            this.tabInventory.classList.remove('active');
            this.viewStats.classList.add('active');
            this.viewInventory.classList.remove('active');
        } else if (tabName === 'inventory') {
            this.tabStats.classList.remove('active');
            this.tabInventory.classList.add('active');
            this.viewStats.classList.remove('active');
            this.viewInventory.classList.add('active');
        }
    }

    setupInputHandlers() {
        if (!this.inputField) return;
        
        // Update cursor position on input
        this.inputField.addEventListener('input', () => this.updateCursorPosition());
        this.inputField.addEventListener('click', () => this.updateCursorPosition());
        this.inputField.addEventListener('keyup', () => this.updateCursorPosition());
        
        this.inputField.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory('up');
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory('down');
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.handleAutocomplete();
            }
        });
    }

    handleAutocomplete() {
        if (!this.autocompleteContext) return;
        
        const input = this.inputField.value;
        const parts = input.split(/\s+/);
        const lastPart = parts[parts.length - 1].toUpperCase();
        
        if (!lastPart) return;
        
        // Build completion list
        let candidates = [];
        
        // Commands
        const commands = ['MOVE', 'LOOK', 'TAKE', 'INV', 'EQUIP', 'UNEQUIP', 'ATTACK', 'HACK', 'TALK', 'QUESTS', 'SAVE', 'QUIT', 'HELP'];
        candidates.push(...commands.filter(cmd => cmd.startsWith(lastPart)));
        
        // NPCs in current zone
        if (this.autocompleteContext.npcs) {
            candidates.push(...this.autocompleteContext.npcs
                .map(id => id.toUpperCase())
                .filter(id => id.includes(lastPart)));
        }
        
        // Items in zone
        if (this.autocompleteContext.items) {
            candidates.push(...this.autocompleteContext.items
                .map(id => id.toUpperCase())
                .filter(id => id.includes(lastPart)));
        }
        
        // Items in inventory
        if (this.autocompleteContext.inventory) {
            candidates.push(...this.autocompleteContext.inventory
                .map(id => id.toUpperCase())
                .filter(id => id.includes(lastPart)));
        }
        
        // Directions
        const directions = ['NORD', 'SUD', 'EST', 'OUEST'];
        candidates.push(...directions.filter(dir => dir.startsWith(lastPart)));
        
        // Remove duplicates
        candidates = [...new Set(candidates)];
        
        if (candidates.length === 1) {
            // Complete
            parts[parts.length - 1] = candidates[0];
            this.inputField.value = parts.join(' ');
        } else if (candidates.length > 1) {
            // Show options
            this.log(`\nOptions: ${candidates.join(', ')}`);
        }
    }

    setAutocompleteContext(context) {
        this.autocompleteContext = context;
    }

    updateCursorPosition() {
        if (!this.inputField || !this.customCursor || !this.inputMirror) return;
        
        // Get text up to cursor position
        const cursorPos = this.inputField.selectionStart;
        const textBeforeCursor = this.inputField.value.substring(0, cursorPos);
        
        // Mirror the text to measure width
        this.inputMirror.textContent = textBeforeCursor;
        
        // Position cursor after the text
        const textWidth = this.inputMirror.offsetWidth;
        this.customCursor.style.left = textWidth + 'px';
    }

    addToHistory(command) {
        if (!command || command.trim() === '') return;
        
        // Don't add duplicate consecutive commands
        if (this.commandHistory[this.commandHistory.length - 1] !== command) {
            this.commandHistory.push(command);
        }
        
        // Limit history size
        if (this.commandHistory.length > 50) {
            this.commandHistory.shift();
        }
        
        // Reset index
        this.historyIndex = this.commandHistory.length;
    }

    navigateHistory(direction) {
        if (this.commandHistory.length === 0) return;
        
        if (direction === 'up') {
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.inputField.value = this.commandHistory[this.historyIndex];
            }
        } else if (direction === 'down') {
            if (this.historyIndex < this.commandHistory.length - 1) {
                this.historyIndex++;
                this.inputField.value = this.commandHistory[this.historyIndex];
            } else {
                this.historyIndex = this.commandHistory.length;
                this.inputField.value = '';
            }
        }
    }
    
    async showBootSequence() {
        const bootMessages = [
            "CYBRPK OS v2.077",
            "Initializing neural interface...",
            "Loading combat protocols...",
            "Connecting to network...",
            "Decrypting world data...",
            "Boot sequence complete."
        ];

        // Create temporary boot screen
        const bootDiv = document.createElement('div');
        bootDiv.id = 'boot-screen';
        bootDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #000;
            color: #00FF41;
            font-family: 'VT323', monospace;
            font-size: 1.2rem;
            padding: 40px;
            z-index: 2000;
            overflow: auto;
        `;
        document.body.appendChild(bootDiv);

        // Animate boot messages
        for (const msg of bootMessages) {
            await this.typeText(bootDiv, msg);
            await this.sleep(300);
        }

        await this.sleep(500);
        bootDiv.remove();
    }

    async typeText(element, text, speed = 30) {
        const line = document.createElement('div');
        element.appendChild(line);
        
        for (const char of text) {
            line.textContent += char;
            await this.sleep(speed);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showTitleScreen(onStart, onLoad) {
        // ASCII Art Logo
        const logo = `
   ██████╗██╗   ██╗██████╗ ██████╗ ██████╗ ██╗  ██╗
  ██╔════╝╚██╗ ██╔╝██╔══██╗██╔══██╗██╔══██╗██║ ██╔╝
  ██║      ╚████╔╝ ██████╔╝██████╔╝██████╔╝█████╔╝ 
  ██║       ╚██╔╝  ██╔══██╗██╔══██╗██╔═══╝ ██╔═██╗ 
  ╚██████╗   ██║   ██████╔╝██║  ██║██║     ██║  ██╗
   ╚═════╝   ╚═╝   ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝
        `;

        this.titleLogo.textContent = logo;
        this.titleScreen.style.display = 'flex';

        // Check if save exists
        const SaveManager = window.SaveManager || { hasSave: () => false };
        const hasSave = SaveManager.hasSave();
        
        const loadBtn = document.getElementById('menu-load');
        if (hasSave && loadBtn) {
            loadBtn.classList.remove('disabled');
            loadBtn.innerHTML = '► LOAD';
        }

        // Handle START click
        const startBtn = document.getElementById('menu-start');
        
        const handleStart = () => {
            this.titleScreen.style.display = 'none';
            document.removeEventListener('keypress', keyHandler);
            onStart();
        };

        const handleLoad = () => {
            if (hasSave && onLoad) {
                this.titleScreen.style.display = 'none';
                document.removeEventListener('keypress', keyHandler);
                onLoad();
            }
        };

        startBtn.onclick = handleStart;
        if (loadBtn) loadBtn.onclick = handleLoad;
        
        // Handle HELP click
        const helpBtn = document.getElementById('menu-help');
        if (helpBtn) {
            helpBtn.onclick = () => this.showHelpScreen();
        }
        
        const keyHandler = (e) => {
            if (e.key === 'Enter') {
                handleStart();
            }
        };
        
        document.addEventListener('keypress', keyHandler);
    }

    triggerScreenShake() {
        if (!this.gameLog) return;
        
        this.gameLog.classList.add('shake');
        setTimeout(() => {
            this.gameLog.classList.remove('shake');
        }, 500);
    }

    triggerDamageEffect() {
        if (!this.terminalContainer) return;
        
        // Shake + Glitch combo
        this.terminalContainer.classList.add('damage-effect');
        
        // Also shake HUD
        const hudPanel = document.getElementById('hud-panel');
        if (hudPanel) hudPanel.classList.add('shake');
        
        setTimeout(() => {
            this.terminalContainer.classList.remove('damage-effect');
            if (hudPanel) hudPanel.classList.remove('shake');
        }, 600);
    }

    showHelpScreen() {
        const helpScreen = document.getElementById('help-screen');
        if (!helpScreen) return;
        
        helpScreen.style.display = 'flex';
        
        const closeHelp = () => {
            helpScreen.style.display = 'none';
            document.removeEventListener('keydown', escHandler);
            helpScreen.removeEventListener('click', clickHandler);
        };
        
        const escHandler = (e) => {
            if (e.key === 'Escape') closeHelp();
        };
        
        const clickHandler = (e) => {
            if (e.target === helpScreen) closeHelp();
        };
        
        document.addEventListener('keydown', escHandler);
        helpScreen.addEventListener('click', clickHandler);
    }

    showGameInterface() {
        this.terminalContainer.style.display = 'flex';
        if (this.inputField) {
            this.inputField.focus();
            this.updateCursorPosition();
        }
    }

    updateHUD(player) {
        if (!player) return;

        // 1. HP & Avatar
        const hpPercent = (player.hp / player.maxHp) * 100;
        if (this.hudHpText) this.hudHpText.innerText = `PV: ${player.hp}/${player.maxHp}`;
        if (this.hudHpBar) this.hudHpBar.style.width = `${hpPercent}%`;

        if (this.hudAvatar) {
            let face = 'face_healthy.png';
            if (hpPercent < 25) face = 'face_critical.png';
            else if (hpPercent < 50) face = 'face_hurt.png';
            this.hudAvatar.src = `img/${face}`;
        }

        // 2. Stats
        if (this.hudStatsContent) {
            const s = player.stats;
            const html = `
                <div class="stat-row"><span class="stat-name">FOR:</span><span class="stat-val">${s.strength}</span></div>
                <div class="stat-row"><span class="stat-name">AGI:</span><span class="stat-val">${s.agility}</span></div>
                <div class="stat-row"><span class="stat-name">PIR:</span><span class="stat-val">${s.hacking}</span></div>
                <div class="stat-row"><span class="stat-name">ARM:</span><span class="stat-val">${s.armor}</span></div>
                <div class="stat-row" style="margin-top:5px;"><span class="stat-name">CR:</span><span class="stat-val">${player.credits}</span></div>
            `;
            this.hudStatsContent.innerHTML = html;
        }
    }

    updateInventoryDisplay(player, itemLookupFn) {
        if (!this.equipmentSlots || !this.inventoryItems) return;
        
        // Update Equipment Slots
        let equipHTML = '';
        const weapon = player.equipment.weapon;
        const head = player.equipment.head;
        const body = player.equipment.body;
        
        equipHTML += `<div class="equipment-slot">`;
        equipHTML += `<span class="slot-name">ARME:</span>`;
        equipHTML += weapon ? `<span class="slot-item">${weapon.nom}</span>` : `<span class="slot-empty">(vide)</span>`;
        equipHTML += `</div>`;
        
        equipHTML += `<div class="equipment-slot">`;
        equipHTML += `<span class="slot-name">TÊTE:</span>`;
        equipHTML += head ? `<span class="slot-item">${head.nom}</span>` : `<span class="slot-empty">(vide)</span>`;
        equipHTML += `</div>`;
        
        equipHTML += `<div class="equipment-slot">`;
        equipHTML += `<span class="slot-name">CORPS:</span>`;
        equipHTML += body ? `<span class="slot-item">${body.nom}</span>` : `<span class="slot-empty">(vide)</span>`;
        equipHTML += `</div>`;
        
        this.equipmentSlots.innerHTML = equipHTML;
        
        // Update Inventory Items
        let invHTML = '';
        
        if (player.inventory.length === 0) {
            invHTML = `<div class="inventory-empty">Sac vide</div>`;
        } else {
            // Count items
            const counts = player.inventory.reduce((acc, id) => {
                acc[id] = (acc[id] || 0) + 1;
                return acc;
            }, {});
            
            for (const [id, count] of Object.entries(counts)) {
                const item = itemLookupFn(id);
                if (item) {
                    invHTML += `<div class="inventory-item">`;
                    invHTML += `<span class="item-name">${item.nom}</span>`;
                    if (count > 1) {
                        invHTML += `<span class="item-count">x${count}</span>`;
                    }
                    invHTML += `</div>`;
                } else {
                    invHTML += `<div class="inventory-item">`;
                    invHTML += `<span class="item-name">${id}</span>`;
                    if (count > 1) {
                        invHTML += `<span class="item-count">x${count}</span>`;
                    }
                    invHTML += `</div>`;
                }
            }
        }
        
        this.inventoryItems.innerHTML = invHTML;
    }

    log(text) {
        if (!this.gameLog) return;
        
        // Degrade existing lines
        const existingLines = this.gameLog.querySelectorAll('.log-line');
        existingLines.forEach(line => {
            const currentDim = parseInt(line.dataset.dim || '0');
            const newDim = Math.min(currentDim + 1, 5);
            
            // Remove old dim class
            line.classList.remove(`dim-${currentDim}`);
            // Add new dim class
            line.classList.add(`dim-${newDim}`);
            line.dataset.dim = newDim;
        });
        
        // Add new line
        const newLine = document.createElement('div');
        newLine.className = 'log-line active-line';
        newLine.dataset.dim = '0';
        newLine.innerHTML = text;
        
        this.gameLog.appendChild(newLine);
        this.gameLog.scrollTop = this.gameLog.scrollHeight;
    }

    async logTyped(text, speed = 20) {
        if (!this.gameLog) return;
        
        // Degrade existing lines
        const existingLines = this.gameLog.querySelectorAll('.log-line');
        existingLines.forEach(line => {
            const currentDim = parseInt(line.dataset.dim || '0');
            const newDim = Math.min(currentDim + 1, 5);
            line.classList.remove(`dim-${currentDim}`);
            line.classList.add(`dim-${newDim}`);
            line.dataset.dim = newDim;
        });
        
        // Create new line
        const newLine = document.createElement('div');
        newLine.className = 'log-line active-line';
        newLine.dataset.dim = '0';
        this.gameLog.appendChild(newLine);
        
        // Type character by character
        for (const char of text) {
            newLine.textContent += char;
            this.gameLog.scrollTop = this.gameLog.scrollHeight;
            await this.sleep(speed);
        }
    }

    updateMinimap(world) {
        if (!this.minimapCtx || !world) return;

        const ctx = this.minimapCtx;
        const width = this.minimapCanvas.width;
        const height = this.minimapCanvas.height;
        const currentZone = world.getCurrentZone();

        // Clear
        ctx.fillStyle = '#051105'; // Très sombre vert
        ctx.fillRect(0, 0, width, height);
        
        // Config Grid
        const cellSize = 15;
        const centerX = width / 2;
        const centerY = height / 2;

        ctx.strokeStyle = '#004400';
        ctx.lineWidth = 1;

        // Draw connections first
        world.zones.forEach(zone => {
           if (!zone.visited) return;
           
           const zx = centerX + (zone.x - currentZone.x) * (cellSize * 2);
           const zy = centerY + (zone.y - currentZone.y) * (cellSize * 2);

           Object.keys(zone.connexions).forEach(dir => {
               const targetId = zone.connexions[dir];
               const targetZone = world.getZone(targetId);
               if (targetZone && targetZone.visited) {
                   const tx = centerX + (targetZone.x - currentZone.x) * (cellSize * 2);
                   const ty = centerY + (targetZone.y - currentZone.y) * (cellSize * 2);
                   
                   ctx.beginPath();
                   ctx.moveTo(zx, zy);
                   ctx.lineTo(tx, ty);
                   ctx.stroke();
               }
           });
        });

        // Draw Nodes
        world.zones.forEach(zone => {
            if (!zone.visited) return;

            const x = centerX + (zone.x - currentZone.x) * (cellSize * 2);
            const y = centerY + (zone.y - currentZone.y) * (cellSize * 2);

            ctx.fillStyle = (zone.id === currentZone.id) ? '#00FF41' : '#008822';
            
            // Draw Rect
            ctx.fillRect(x - cellSize/2, y - cellSize/2, cellSize, cellSize);
            
            // Border
            ctx.strokeStyle = '#00FF41';
            ctx.strokeRect(x - cellSize/2, y - cellSize/2, cellSize, cellSize);
        });
    }

    clearInput() {
        if (this.inputField) this.inputField.value = '';
    }

    updatePrompt(locationId) {
        if (this.promptDisplay) {
            this.promptDisplay.textContent = `[${locationId}] >`;
        }
    }

    setHackingMode(active) {
        if (active) {
            this.terminalContainer.style.display = 'none';
            this.canvasContainer.style.display = 'block';
        } else {
            this.terminalContainer.style.display = 'flex';
            this.canvasContainer.style.display = 'none';
            if (this.inputField) this.inputField.focus();
        }
    }

    getCanvasContext() {
        return this.hackCtx;
    }

    getCanvas() {
        return this.hackCanvas;
    }
}
