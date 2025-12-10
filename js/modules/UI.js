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
        
        // Header elements (New)
        this.headerLocation = document.getElementById('header-location');
        this.headerCoords = document.getElementById('header-coords');
        this.headerCredits = document.getElementById('header-credits');
        this.terminalCoords = document.querySelector('.terminal-coords'); // By class
        this.suggestionsBar = document.getElementById('suggestions-bar');
        
        // Title Screen
        this.titleScreen = document.getElementById('title-screen');
        this.titleLogo = document.getElementById('title-logo');
        
        // Command History
        this.commandHistory = [];
        this.historyIndex = -1;
        
        // Minimap State
        this.isPanMode = false;
        this.isDragging = false;
        this.mapOffsetX = 0;
        this.mapOffsetY = 0;
        
        // Fast Text State
        this.skipTyping = false;
        
        // Autocomplete
        this.autocompleteContext = null; 
        
        // Custom cursor
        this.customCursor = document.getElementById('custom-cursor');
        this.inputMirror = document.getElementById('input-mirror');
        
        // HUD Tabs and Views
        this.tabInventory = document.getElementById('tab-inventory');
        this.viewInventory = document.getElementById('view-inventory');
        this.equipmentSlots = document.getElementById('equipment-slots');
        this.inventoryItems = document.getElementById('inventory-items');

        // Log retention policy to avoid DOM bloat
        this.maxLogLines = 400;
        
        // Setup input handlers
        this.setupInputHandlers();
        this.setupHUDTabs();
        this.init();
    }

    init() {
        if (this.minimapCanvas) {
            this.minimapCanvas.addEventListener('mousedown', (e) => this.handleMinimapMouseDown(e));
            this.minimapCanvas.addEventListener('mouseup', (e) => this.handleMinimapMouseUp(e));
            this.minimapCanvas.addEventListener('mousemove', (e) => this.handleMinimapMouseMove(e));
            this.minimapCanvas.addEventListener('mouseleave', (e) => this.handleMinimapMouseUp(e));
        }

        // Button Controls
        const panBtn = document.getElementById('pan-mode-btn');
        const resetBtn = document.getElementById('reset-mode-btn');

        if (panBtn && resetBtn) {
            panBtn.addEventListener('click', () => {
                this.isPanMode = true;
                panBtn.style.display = 'none';
                resetBtn.style.display = 'inline-block';
                this.log("[MODE PANORAMIQUE ACTIVÉ] Utilisez les flèches ou la souris.", { color: 'var(--accent)' });
            });

            resetBtn.addEventListener('click', () => {
                this.isPanMode = false;
                this.mapOffsetX = 0;
                this.mapOffsetY = 0;
                panBtn.style.display = 'inline-block';
                resetBtn.style.display = 'none';
                resetBtn.style.display = 'none';
                this.log("[RETOUR SIGNAL AGENT]", { color: 'var(--primary)' });
                if (this.currentWorld) this.updateMinimap(this.currentWorld);
            });
        }
        
        // Key Listeners for Pan & Fast Text
        document.addEventListener('keydown', (e) => {
            // Fast Text Trigger - but NOT when typing in input field
            if (document.activeElement !== this.inputField) {
                this.skipTyping = true;
            }

            if (!this.isPanMode) return;
            switch(e.key) {
                case 'ArrowUp': this.mapOffsetY -= 1; e.preventDefault(); break;
                case 'ArrowDown': this.mapOffsetY += 1; e.preventDefault(); break;
                case 'ArrowLeft': this.mapOffsetX -= 1; e.preventDefault(); break;
                case 'ArrowRight': this.mapOffsetX += 1; e.preventDefault(); break;
            }
            if (this.currentWorld) this.updateMinimap(this.currentWorld);
        });
    }

    handleMinimapMouseDown(e) {
        if (!this.isPanMode) return;
        
        if (e.button === 0) { // Left click
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            
            this.minimapCanvas.style.cursor = 'grabbing';
        }
    }

    handleMinimapMouseUp(e) {
        if (!this.isPanMode) return;
        this.isDragging = false;
        this.minimapCanvas.style.cursor = 'grab';
        
        // CLICK DETECTION (Click-to-Jump)
        // If distance moved is small, treat as click
        if (e && Math.hypot(e.clientX - this.dragStartX, e.clientY - this.dragStartY) < 5) {
             this.handleClickToJump(e);
        }
    }
    
    handleClickToJump(e) {
        if (!this.currentWorld) return;
        
        const rect = this.minimapCanvas.getBoundingClientRect();
        // Correct for CSS scaling vs Internal resolution
        const scaleX = this.minimapCanvas.width / rect.width;
        const scaleY = this.minimapCanvas.height / rect.height;
        
        const canvasX = (e.clientX - rect.left) * scaleX;
        const canvasY = (e.clientY - rect.top) * scaleY;
        
        const width = this.minimapCanvas.width;
        const height = this.minimapCanvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const drawScale = 50; // cellSize(20) * 2.5
        
        const currentZone = this.currentWorld.getCurrentZone();
        const focusX = currentZone.x + this.mapOffsetX;
        const focusY = currentZone.y + this.mapOffsetY;
        
        // Inverse Projection
        const targetX = Math.round(((canvasX - centerX) / drawScale) + focusX);
        const targetY = Math.round(((canvasY - centerY) / drawScale) + focusY);
        
        // VALIDATION: Check if zone exists and is visited
        const targetZoneId = this.currentWorld.getZoneIdByCoords(targetX, targetY);
        
        if (targetZoneId) {
             const targetZone = this.currentWorld.getZone(targetZoneId);
             if (targetZone.visited) {
                 this.log(`[CIBLAGE] Coordonnées verrouillées : [${targetX}, ${targetY}]`, { color: 'cyan' });
                 if (this.inputField) {
                     this.inputField.value = `JUMP ${targetX} ${targetY}`;
                     this.inputField.focus();
                 }
                 return;
             }
        }
        
        // Feedback for invalid clicks
        // this.log(`[ERREUR DE CIBLAGE] Secteur vide ou inconnu.`, { color: 'var(--text-dim)' });
    }

    handleMinimapMouseMove(e) {
        if (!this.isPanMode || !this.isDragging) return;

        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;

        // Adjust map offsets based on mouse movement
        this.mapOffsetX -= dx * 0.05; 
        this.mapOffsetY -= dy * 0.05;

        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;

        // Trigger a minimap redraw (assuming world object is accessible, or passed)
        if (this.currentWorld) this.updateMinimap(this.currentWorld);
    }

    setupHUDTabs() {
        if (this.tabInventory) {
            this.tabInventory.classList.add('active');
        }
    }

    switchTab(tabName) {
        // Placeholder
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
        
        // Hide suggestions if empty
        if (!input || input.trim() === '') {
            this.hideSuggestions();
            return;
        }

        // Build completion list logic (same as before)
        let candidates = [];
        const commands = ['MOVE', 'LOOK', 'TAKE', 'INV', 'EQUIP', 'UNEQUIP', 'ATTACK', 'HACK', 'TALK', 'QUESTS', 'SAVE', 'QUIT', 'HELP'];
        candidates.push(...commands.filter(cmd => cmd.startsWith(lastPart)));
        
        if (this.autocompleteContext.npcs) candidates.push(...this.autocompleteContext.npcs.map(id => id.toUpperCase()).filter(id => id.includes(lastPart)));
        if (this.autocompleteContext.items) candidates.push(...this.autocompleteContext.items.map(id => id.toUpperCase()).filter(id => id.includes(lastPart)));
        if (this.autocompleteContext.inventory) candidates.push(...this.autocompleteContext.inventory.map(id => id.toUpperCase()).filter(id => id.includes(lastPart)));
        const directions = ['NORD', 'SUD', 'EST', 'OUEST'];
        candidates.push(...directions.filter(dir => dir.startsWith(lastPart)));
        
        candidates = [...new Set(candidates)];
        
        if (candidates.length === 1) {
             // If tab pressed (implicit context), complete it.
             // But if just typing, maybe show it?
             // Logic in inputHandler calls this on Tab.
             // We'll separate "show suggestions" from "complete" maybe?
             // For now, let's keep original behavior: if triggered by TAB, complete.
             parts[parts.length - 1] = candidates[0];
             this.inputField.value = parts.join(' ');
             this.updateCursorPosition();
             this.hideSuggestions();
        } else if (candidates.length > 1) {
            this.showSuggestions(candidates, lastPart);
        } else {
            this.hideSuggestions();
        }
    }

    showSuggestions(candidates, match) {
        if (!this.suggestionsBar) return;
        this.suggestionsBar.style.display = 'block';
        this.suggestionsBar.innerHTML = '';
        
        candidates.forEach(cand => {
            const el = document.createElement('div');
            el.className = 'suggestion-item';
            el.textContent = cand;
            el.onclick = () => {
                const input = this.inputField.value;
                const parts = input.split(/\s+/);
                parts[parts.length - 1] = cand;
                this.inputField.value = parts.join(' ');
                this.inputField.focus();
                this.updateCursorPosition();
                this.hideSuggestions();
            };
            this.suggestionsBar.appendChild(el);
        });
    }

    hideSuggestions() {
        if (this.suggestionsBar) this.suggestionsBar.style.display = 'none';
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
        this.updateCursorPosition();
    }
    
    async showBootSequence() {
        const bootMessages = [
            "CYBRPK ONI-SHELL V2.077",
            "PROTOCOLE D'ACCÈS NEURONAL INITIÉ...",
            "CALIBRATION ONI-SHELL...",
            "CHARGEMENT DES PILOTES...OK",
            "TENTATIVE DE LIAISON AVEC LE RÉSEAU NOIR...",
            "RECHERCHE D'UN SIGNAL AGENT...",
            "SIGNAL DÉTECTÉ. BIENVENUE, OPÉRATEUR."
        ];

        let bootDiv = document.getElementById('boot-screen');
        if (!bootDiv) {
            bootDiv = document.createElement('div');
            bootDiv.id = 'boot-screen';
            bootDiv.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: #000;
                color: #00ffaa;
                font-family: 'Share Tech Mono', monospace;
                font-size: 1.2rem;
                padding: 40px;
                z-index: 2000;
                overflow: auto;
                cursor: pointer;
            `;
            document.body.appendChild(bootDiv);
        }

        // Animate boot messages
        for (const msg of bootMessages) {
            await this.typeText(bootDiv, msg);
            await this.sleep(300);
        }

        // Wait for user Interaction
        const continueMsg = document.createElement('div');
        continueMsg.style.marginTop = "20px";
        continueMsg.className = "blink";
        continueMsg.textContent = "> SYNCHRONISATION TERMINÉE, OPÉRATEUR. APPUYEZ SUR ENTRÉE POUR CHARGER L'INTERFACE_";
        bootDiv.appendChild(continueMsg);

        return new Promise(resolve => {
            const proceed = () => {
                document.removeEventListener('keydown', proceed);
                bootDiv.removeEventListener('click', proceed);
                bootDiv.remove();
                resolve();
            };
            document.addEventListener('keydown', proceed);
            bootDiv.addEventListener('click', proceed);
        });
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
        // ASCII Art Logo (Already correct in HTML <pre> style usually, but we ensure it matches)
        const logo = `
   ██████╗██╗   ██╗██████╗ ██████╗ ██████╗ ██╗  ██╗
  ██╔════╝╚██╗ ██╔╝██╔══██╗██╔══██╗██╔══██╗██║ ██╔╝
  ██║      ╚████╔╝ ██████╔╝██████╔╝██████╔╝█████╔╝ 
  ██║       ╚██╔╝  ██╔══██╗██╔══██╗██╔═══╝ ██╔═██╗ 
  ╚██████╗   ██║   ██████╔╝██║  ██║██║     ██║  ██╗
   ╚═════╝   ╚═╝   ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝
        `;

        if (this.titleLogo) this.titleLogo.textContent = logo;
        if (this.titleScreen) this.titleScreen.style.display = 'flex';

        // Check save
        const SaveManager = window.SaveManager || { hasSave: () => false };
        const hasSave = SaveManager.hasSave();
        
        // Menu Items
        const startBtn = document.getElementById('menu-start');
        const loadBtn = document.getElementById('menu-load');
        const helpBtn = document.getElementById('menu-help');
        
        if (hasSave && loadBtn) {
            loadBtn.classList.remove('disabled');
            loadBtn.textContent = 'REPRISE DE LIEN PERSISTANT (Load)';
        } else if (loadBtn) {
             loadBtn.classList.add('disabled');
             loadBtn.textContent = 'NO SIGNAL FOUND (No Save)';
        }

        startBtn.textContent = "INITIATION D'UN NOUVEAU LIEN";
        
        // Navigation Logic
        let items = [startBtn, loadBtn, helpBtn].filter(btn => btn && !btn.classList.contains('disabled'));
        // If load is disabled but still in DOM, we usually keep it in list but skip? 
        // Better: items are just array of elements.
        items = [startBtn, loadBtn, helpBtn]; 
        
        let selectedIndex = 0;

        const updateSelection = () => {
            items.forEach((item, index) => {
                if (!item) return;
                if (index === selectedIndex) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });
        };

        // Initialize selection
        if (!items[1].classList.contains('disabled')) {
             // If load available, maybe select it? Or default to Start. Default Start.
        }
        updateSelection();

        // Handlers
        const triggerAction = () => {
             const selected = items[selectedIndex];
             if (!selected || selected.classList.contains('disabled')) return;
             
             if (selected === startBtn) {
                 cleanup();
                 onStart();
             } else if (selected === loadBtn) {
                 cleanup();
                 onLoad();
             } else if (selected === helpBtn) {
                 this.showHelpScreen();
             }
        };

        const keyHandler = (e) => {
            if (e.key === 'ArrowUp') {
                selectedIndex = (selectedIndex - 1 + items.length) % items.length;
                // Skip disabled if possible, simple logic for now
                if (items[selectedIndex].classList.contains('disabled')) {
                     selectedIndex = (selectedIndex - 1 + items.length) % items.length;
                }
                updateSelection();
            } else if (e.key === 'ArrowDown') {
                selectedIndex = (selectedIndex + 1) % items.length;
                 if (items[selectedIndex].classList.contains('disabled')) {
                     selectedIndex = (selectedIndex + 1) % items.length;
                }
                updateSelection();
            } else if (e.key === 'Enter') {
                triggerAction();
            }
        };

        const cleanup = () => {
            if (this.titleScreen) this.titleScreen.style.display = 'none';
            document.removeEventListener('keydown', keyHandler);
        };
        
        document.addEventListener('keydown', keyHandler);

        // Mouse Hover Support
        items.forEach((item, index) => {
            if (!item) return;
            item.onmouseover = () => {
                selectedIndex = index;
                updateSelection();
            };
            item.onclick = () => {
                if (!item.classList.contains('disabled')) triggerAction();
            };
        });
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
        if (this.terminalContainer) this.terminalContainer.style.display = 'grid'; // Use grid, not flex
        if (this.inputField) {
            this.inputField.focus();
            this.updateCursorPosition();
        }
    }

    updateHUD(player) {
        if (!player) return;

        // 1. HP & Avatar
        const hpPercent = (player.hp / player.maxHp) * 100;
        if (this.hudHpText) this.hudHpText.innerHTML = `${player.hp}<span>/${player.maxHp}</span>`;
        if (this.hudHpBar) this.hudHpBar.style.width = `${hpPercent}%`;

        // Image swap based on HP
        if (this.hudAvatar) {
            let face = 'face_healthy.png';
            if (hpPercent <= 0) face = 'face_lost.png';
            else if (hpPercent < 25) face = 'face_critical.png';
            else if (hpPercent < 50) face = 'face_hurt.png';
            this.hudAvatar.src = `img/${face}`;
        }

        // 2. Stats (Updated for Grid Layout)
        if (this.hudStatsContent) {
            const s = player.stats;
            const html = `
                <div class="stat">
                    <div class="stat-value">${s.strength}</div>
                    <div class="stat-label">FORCE</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${s.agility}</div>
                    <div class="stat-label">AGILITÉ</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${s.hacking}</div>
                    <div class="stat-label">HACK</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${s.armor}</div>
                    <div class="stat-label">ARMURE</div>
                </div>
            `;
            this.hudStatsContent.innerHTML = html;
        }

        // 3. Header Updates
        if (this.headerCredits) this.headerCredits.innerText = player.credits;
    }

    updateInventoryDisplay(player, itemLookupFn) {
        if (!this.equipmentSlots || !this.inventoryItems) return;
        
        // Update Equipment Slots
        let equipHTML = '';
        const weapon = player.equipment.weapon;
        const head = player.equipment.head;
        const body = player.equipment.body;
        
        const renderSlot = (label, item) => `
            <div class="equipment-slot">
                <span class="slot-name">${label}</span>
                ${item ? `<span class="slot-item">${item.nom}</span>` : `<span class="slot-empty">VIDE</span>`}
            </div>
        `;

        equipHTML += renderSlot("ARME:", weapon);
        equipHTML += renderSlot("TÊTE:", head);
        equipHTML += renderSlot("CORPS:", body);
        
        this.equipmentSlots.innerHTML = equipHTML;
        
        // Update Inventory Items
        let invHTML = '';
        
        if (player.inventory.length === 0) {
            invHTML = `<div class="inventory-empty" style="padding:10px; color:var(--text-dim);">Sac vide</div>`;
        } else {
            // Count items
            const counts = player.inventory.reduce((acc, id) => {
                acc[id] = (acc[id] || 0) + 1;
                return acc;
            }, {});
            
            for (const [id, count] of Object.entries(counts)) {
                let itemName = id;
                const item = itemLookupFn(id);
                if (item) itemName = item.nom;

                invHTML += `<div class="inventory-item">`;
                invHTML += `<span class="item-name">${itemName}</span>`;
                if (count > 1) {
                    invHTML += `<span class="item-count">x${count}</span>`;
                }
                invHTML += `</div>`;
            }
        }
        
        this.inventoryItems.innerHTML = invHTML;
    }

    log(text, { allowHTML = true, prefix = null } = {}) {
        if (!this.gameLog) return;
        
        // Add prefix if specified
        let finalText = text;
        if (prefix) {
            finalText = `<span style="color: var(--accent); font-weight: bold;">[${prefix}]</span> ${text}`;
            allowHTML = true;
        }
        
        // Add new line (allow HTML only when explicitly intended)
        const newLine = document.createElement('div');
        newLine.className = 'output-line';
        if (allowHTML) {
            newLine.innerHTML = finalText;
        } else {
            newLine.textContent = finalText;
        }
        this.gameLog.appendChild(newLine);
        this.pruneLog();
        requestAnimationFrame(() => {
            newLine.scrollIntoView({ behavior: "smooth", block: "end" });
        });
    }
    
    logSystem(text) {
        this.log(text, { prefix: 'ONI-SHELL UPLINK' });
    }

    async logTyped(text, speed = 20, className = 'output-line') {
        if (!this.gameLog) return;
        
        // Reset skip flag at START to prevent carryover from previous keypresses
        const wasSkipped = this.skipTyping;
        this.skipTyping = false;
        
        // Create new line
        const newLine = document.createElement('div');
        newLine.className = className;
        this.gameLog.appendChild(newLine);
        this.pruneLog();
        
        // Type character by character
        for (let i = 0; i < text.length; i++) {
            if (wasSkipped || this.skipTyping) {
                 newLine.textContent = text; // Dump full text
                 this.skipTyping = false; // Reset for next message
                 break;
            }
            
            newLine.textContent += text[i];
            
            // Scroll to ensure visibility
            if (this.gameLog.scrollHeight - this.gameLog.scrollTop - this.gameLog.clientHeight < 100) {
                 newLine.scrollIntoView({ behavior: "smooth", block: "end" });
            }
            await this.sleep(speed);
        }
        
        // Final scroll to ensure visibility
        requestAnimationFrame(() => {
            newLine.scrollIntoView({ behavior: "smooth", block: "end" });
        });
    }

    pruneLog() {
        if (!this.gameLog) return;
        
        const lines = this.gameLog.children;
        const total = lines.length;
        const max = this.maxLogLines || 100;

        // Prune older lines
        while (lines.length > max) {
            this.gameLog.removeChild(lines[0]);
        }
        
        // Apply opacity fade to older lines
        const fadeThreshold = 20; // Number of lines to keep fully opaque
        const startFade = Math.max(0, lines.length - fadeThreshold);
        
        for (let i = 0; i < lines.length; i++) {
            // Newest lines are at the end (index approx length-1)
            // We want index 0 (oldest) to be transparent
            // Let's say last 10 lines = 1.0
            // Previous ones fade down to 0.3
            
            const distanceFromBottom = lines.length - 1 - i;
            
            if (distanceFromBottom < 10) {
                 lines[i].style.opacity = '1';
            } else {
                 // Gradual fade
                 const opacity = Math.max(0.2, 1 - ((distanceFromBottom - 10) * 0.05));
                 lines[i].style.opacity = opacity.toFixed(2);
            }
        }
    }

    escapeHTML(text) {
        if (text === null || text === undefined) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    updateMinimap(world) {
        if (!this.minimapCtx || !world) return;
        this.currentWorld = world; // Cache for panning updates

        const ctx = this.minimapCtx;
        const width = this.minimapCanvas.width;
        const height = this.minimapCanvas.height;
        const currentZone = world.getCurrentZone();

        // OFFSET LOGIC
        // If pan mode is active, we use mapOffsetX/Y.
        // If not, we center on 0,0 relative to currentZone (so offset is 0).
        let renderOffsetX = 0;
        let renderOffsetY = 0;

        if (this.isPanMode) {
             // Center is screen center.
             // We want to draw zones based on their absolute coordinates plus our pan offset.
             // But Wait: The drawing logic below relies on (zone.x - currentZone.x).
             // To support free panning, we need to decouple from 'currentZone'.
        }
        
        // Revised Drawing Logic for Pan Support
        // CenterX/Y is the canvas center.
        // We want (CenterX, CenterY) to correspond to the point (LookAtX, LookAtY) in world space.
        // In Normal Mode: LookAt = CurrentZone.x, CurrentZone.y
        // In Pan Mode: LookAt = CurrentZone.x + PanX, CurrentZone.y + PanY
        
        let focusX = currentZone.x;
        let focusY = currentZone.y;

        if (this.isPanMode) {
            focusX += this.mapOffsetX;
            focusY += this.mapOffsetY;
        }

        // New Minimap Style
        // Clear transparently to let CSS grid show through? 
        // Or draw semi-transparent background
        ctx.clearRect(0,0, width, height);
        
        // Config Grid
        const cellSize = 20;
        const centerX = width / 2;
        const centerY = height / 2;

        ctx.lineWidth = 2;

        // Draw connections first
        world.zones.forEach(zone => {
           if (!zone.visited) return;
           
           const zx = centerX + (zone.x - focusX) * (cellSize * 2.5);
           const zy = centerY + (zone.y - focusY) * (cellSize * 2.5);

           Object.keys(zone.connexions).forEach(dir => {
               const targetId = zone.connexions[dir];
               const targetZone = world.getZone(targetId);
                if (targetZone && targetZone.visited) {
                    const tx = centerX + (targetZone.x - focusX) * (cellSize * 2.5);
                    const ty = centerY + (targetZone.y - focusY) * (cellSize * 2.5);
                   
                   ctx.strokeStyle = 'rgba(0, 170, 119, 0.5)'; // --primary-dim with opacity
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

           const x = centerX + (zone.x - focusX) * (cellSize * 2.5);
           const y = centerY + (zone.y - focusY) * (cellSize * 2.5);

            // Style based on current
            if (zone.id === currentZone.id) {
                ctx.fillStyle = '#ff0050'; // --accent
                ctx.strokeStyle = '#ff0050'; 
                // Add glow effect manually or via loop? Canvas glow is expensive but let's try
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ff0050';
            } else {
                ctx.fillStyle = 'rgba(0, 255, 170, 0.2)'; // --primary with low opacity
                ctx.strokeStyle = '#00aa77'; // --primary-dim
                ctx.shadowBlur = 0;
            }
            
            // Draw Rect
            ctx.fillRect(x - cellSize/2, y - cellSize/2, cellSize, cellSize);
            ctx.strokeRect(x - cellSize/2, y - cellSize/2, cellSize, cellSize);
        });

        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Update Header location text as well
        if (this.headerLocation) {
             // Extract just the name part if possible, or use ID
             // currentLocationId is like "ZONE_0_0"
             // maybe use currentZone.nom (which includes [x,y])?
             // Let's us zone name but strip coords for cleanliness or keep them
             this.headerLocation.textContent = currentZone.nom; // e.g. "RUE [0,0]"
        }
        
        // Update Panel Coords
        if (this.terminalCoords) {
             this.terminalCoords.textContent = `[${currentZone.x},${currentZone.y}]`;
        }
    }

    clearInput() {
        if (this.inputField) this.inputField.value = '';
    }

    updatePrompt(locationId) {
        // Prompt is static "▶" now in new design, 
        // but we can update it if we want the location id there too?
        // Design doc says: <span class="prompt">▶</span>
        // So we keep it static or minimal.
    }

    setHackingMode(active) {
        if (active) {
            this.terminalContainer.style.display = 'none';
            this.canvasContainer.style.display = 'block';
        } else {
            this.terminalContainer.style.display = 'grid'; // Restore to grid
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
    escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}
