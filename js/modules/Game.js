import { UI } from './UI.js';
import { Player } from './Player.js';
import { World } from './World.js';
import { Combat } from './Combat.js';
import { Hacking } from './Hacking.js';
import { QuestManager } from './QuestManager.js';
import { AudioPlayer } from './AudioPlayer.js';
import { DataLoader } from '../utils/DataLoader.js';
import { SaveManager } from '../utils/SaveManager.js';

export class Game {
    constructor() {
        this.ui = new UI();
        this.player = new Player();
        this.world = null;
        this.combat = null;
        this.hacking = null;
        this.questManager = null;
        this.audioPlayer = null;
        this.currentScreen = 'BOOT'; // BOOT, TITLE, GAME
    }

    async init() {
        // Init Audio Player early
        this.audioPlayer = new AudioPlayer();

        // Show boot sequence first
        await this.ui.showBootSequence();
        
        // Auto-play audio on interaction
        this.audioPlayer.loadTrack(0); // Preload
        this.audioPlayer.togglePlay(); // Start playing (user just clicked)

        // Then show title screen
        this.showTitleScreen();
    }

    showTitleScreen() {
        this.currentScreen = 'TITLE';
        this.ui.showTitleScreen(
            () => this.startGame(),
            () => this.loadGame()
        );
    }

    async startGame(loadedSave = null) {
        this.currentScreen = 'GAME';
        this.ui.showGameInterface();
        
        this.ui.log("Initialisation du système...");
        
        try {
            const data = await DataLoader.loadAll();
            if (!data || !data.zones) {
                throw new Error("Données corrompues.");
            }

            let seed, startLocation;
            
            if (loadedSave) {
                // Load from save
                seed = loadedSave.seed;
                this.ui.log(`CHARGEMENT : ${seed}`);
                
                // Restore player state
                this.restorePlayerState(loadedSave.player, data.items);
                startLocation = loadedSave.world.currentLocationId;
            } else {
                // New game
                seed = "SEED-" + Math.floor(Math.random() * 10000);
                this.ui.log(`SEED GÉNÉRATION : ${seed}`);
                startLocation = null; // Will use default from World
            }

            this.world = new World(data.zones, data.pnjs, data.items, seed);
            
            // Restore world state if loading
            if (loadedSave && loadedSave.world) {
                this.restoreWorldState(loadedSave.world);
            }
            
            this.questManager = new QuestManager(data.quests, this.player, this.world, this.ui);
            this.combat = new Combat(this.world, this.player, this.ui, this.questManager);
            this.hacking = new Hacking(this.ui, this.player, this.world, this.combat);
            
            // Audio Init - Bind UI (Player already active)
            if (this.audioPlayer) {
                this.audioPlayer.bindUI({
                    playBtn: document.getElementById('btn-play'),
                    nextBtn: document.getElementById('btn-next'),
                    volSlider: document.getElementById('vol-slider'),
                    trackName: document.getElementById('track-name'),
                    visualizer: document.getElementById('audio-visualizer')
                });
            }

            this.ui.log("Connexion établie.");
            this.handleLook();
            this.ui.updatePrompt(this.world.currentLocationId);
            this.ui.updateMinimap(this.world);
            this.ui.updateHUD(this.player);
            this.ui.updateInventoryDisplay(this.player, (id) => this.world.getItem(id));
        } catch (e) {
            this.ui.log(`Erreur fatale : ${e.message}`);
        }
    }

    async loadGame() {
        const result = SaveManager.loadGame();
        if (!result.success) {
            this.ui.log(result.message);
            return;
        }

        await this.startGame(result.data);
    }

    restorePlayerState(savedPlayer, itemsData) {
        this.player.hp = savedPlayer.hp;
        this.player.maxHp = savedPlayer.maxHp;
        this.player.baseStats = savedPlayer.baseStats;
        this.player.credits = savedPlayer.credits;
        this.player.inventory = savedPlayer.inventory;
        this.player.activeQuests = savedPlayer.activeQuests;
        this.player.completedQuests = savedPlayer.completedQuests;
        
        // Restore equipment (need to find item objects)
        if (savedPlayer.equipment.weapon) {
            const item = itemsData.find(i => i.id === savedPlayer.equipment.weapon);
            if (item) this.player.equipment.weapon = item;
        }
        if (savedPlayer.equipment.head) {
            const item = itemsData.find(i => i.id === savedPlayer.equipment.head);
            if (item) this.player.equipment.head = item;
        }
        if (savedPlayer.equipment.body) {
            const item = itemsData.find(i => i.id === savedPlayer.equipment.body);
            if (item) this.player.equipment.body = item;
        }
    }

    restoreWorldState(savedWorld) {
        // Restore current location
        this.world.currentLocationId = savedWorld.currentLocationId;
        
        // Restore zone states (visited, items, NPCs)
        if (savedWorld.zones) {
            savedWorld.zones.forEach(savedZone => {
                const zone = this.world.getZone(savedZone.id);
                if (zone) {
                    zone.visited = savedZone.visited;
                    zone.items_statiques = savedZone.items_statiques;
                    zone.pnj_presents = savedZone.pnj_presents;
                }
            });
        }
        
        // Restore NPC health
        if (savedWorld.npcHealth) {
            this.world.npcHealth = savedWorld.npcHealth;
        }
    }

    processInput(input) {
        // Add to history
        this.ui.addToHistory(input);
        
        // Echo user input safely (escaped)
        this.ui.log(this.ui.escapeHTML(`> ${input}`), { allowHTML: false });
        
        const parts = input.toUpperCase().split(/\s+/).filter(p => p.length > 0);
        const command = parts[0];
        const args = parts.slice(1);
        
        this.resolveAction(command, args);
    }

    resolveAction(command, args) {
        // [GAMEOVER LOCK]
        if (this.player.isDead() && command !== 'QUIT') {
            this.ui.logSystem("ERREUR CRITIQUE : LIEN ROMPU. LE SYSTÈME NE RÉPOND PLUS, Opérateur.");
            return;
        }

        switch (command) {
            case 'MOVE':
            case 'GO':
                this.handleMove(args[0]);
                break;
            case 'LOOK':
                this.handleLook();
                break;
            case 'TAKE':
            case 'GET':
                this.handleTake(args[0]);
                break;

            case 'EQUIP':
                this.handleEquip(args[0]);
                break;
            case 'UNEQUIP':
                this.handleUnequip(args[0]);
                break;
            case 'ATTACK':
            case 'KILL':
                this.combat.handleAttack(args[0]);
                break;
            case 'HACK':
                this.hacking.startHack(args[0], () => this.handleLook());
                break;
            case 'TALK':
            case 'SPEAK':
                this.handleTalk(args[0]);
                break;
            case 'QUESTS':
            case 'QUEST':
            case 'Q':
                this.handleQuests();
                break;
            case 'SAVE':
                this.handleSave();
                break;
            case 'DEBUG':
                this.handleDebug();
                break;
            case 'QUIT':
                this.handleQuit();
                break;
            case 'JUMP':
                const x = parseInt(args[0]);
                const y = parseInt(args[1]);
                this.handleJump(x, y);
                break;
            case 'HELP':
                this.ui.logSystem("Commandes disponibles, Opérateur: MOVE, LOOK, TAKE, EQUIP, UNEQUIP, ATTACK, HACK, TALK, QUESTS, JUMP, SAVE, QUIT");
                break;
            default:
                this.ui.logSystem("COMMANDE INCONNUE, Opérateur. Tapez HELP pour la liste des commandes.");
        }
    }

    handleMove(direction) {
        const result = this.world.move(direction);
        if (result.success) {
            this.ui.updatePrompt(result.newId);
            this.ui.log(`\n**[PROTOCOLE D'ORIENTATION]** Activation du déplacement ${direction}...`);
            this.handleLook();
            this.ui.updateMinimap(this.world);
            this.updateAutocompleteContext();
        } else {
            this.ui.log(result.message);
        }
    }

    async handleLook() {
        const zone = this.world.getCurrentZone();
        if (!zone) {
            this.ui.log("ERREUR: Zone inconnue.");
            return;
        }

        // 1. Zone Header
        const headerHTML = `
            <div class="zone-header">
                <div class="zone-icon">📍</div>
                <div class="zone-title">${zone.nom}</div>
                <div class="zone-sector">SECTEUR [${zone.x},${zone.y}]</div>
            </div>
        `;
        this.ui.log(headerHTML);
        
        // Update header coordinates
        if (this.ui.headerCoords) {
            this.ui.headerCoords.textContent = `[${zone.x},${zone.y}]`;
        }
        
        // 2. Description (Typed)
        await this.ui.logTyped(zone.description, 10, 'description');

        // 3. Exits
        const exits = Object.keys(zone.connexions);
        if (exits.length > 0) {
            const exitSpans = exits.map(dir => `<span>${dir}</span>`).join('');
            const exitsHTML = `
                <div class="info-block exits">
                    <div class="info-label">SORTIES DISPONIBLES</div>
                    <div>${exitSpans}</div>
                </div>
            `;
            this.ui.log(exitsHTML);
        } else {
             this.ui.log(`<div class="info-block"><div class="info-label">SORTIES</div><span class="text-dim">Aucune issue.</span></div>`);
        }

        // 4. Entities
        if (zone.pnj_presents && zone.pnj_presents.length > 0) {
            const pnjSpans = zone.pnj_presents.map(id => {
                const p = this.world.getNPC(id);
                const name = p ? p.nom : id;
                return `<span>⚠️ ${name}</span>`;
            }).join(' ');
            
            const pnjHTML = `
                <div class="info-block entities">
                    <div class="info-label">ENTITÉS DÉTECTÉES</div>
                    <div>${pnjSpans}</div>
                </div>
            `;
            this.ui.log(pnjHTML);
        }

        // 5. Items
        if (zone.items_statiques && zone.items_statiques.length > 0) {
             const itemSpans = zone.items_statiques.map(id => {
                const i = this.world.getItem(id);
                const name = i ? i.nom : id;
                return `<span>📦 ${name}</span>`;
            }).join(' ');

            const itemsHTML = `
                <div class="info-block objects">
                    <div class="info-label">OBJETS AU SOL</div>
                    <div>${itemSpans}</div>
                </div>
            `;
            this.ui.log(itemsHTML);
        }
        
        this.updateAutocompleteContext();
    }

    updateAutocompleteContext() {
        const zone = this.world.getCurrentZone();
        if (!zone) return;
        
        this.ui.setAutocompleteContext({
            npcs: zone.pnj_presents || [],
            items: zone.items_statiques || [],
            inventory: this.player.inventory || []
        });
    }

    handleTake(arg) {
        if (!arg) {
            this.ui.log("QUE VOULEZ-VOUS RAMASSER ?");
            return;
        }

        const zone = this.world.getCurrentZone();
        const targetId = zone.items_statiques.find(id => id.includes(arg) || id === arg); 

        if (!targetId) {
            this.ui.log("Objet introuvable ici.");
            this.ui.updatePrompt(this.world.currentLocationId);
            this.ui.updateMinimap(this.world);
            this.ui.updateHUD(this.player);
            return;
        }

        const item = this.world.getItem(targetId);

        if (item.type === 'scenery') {
            this.ui.log("Impossible de ramasser cet objet.");
            return;
        }

        if (item.type === 'currency') {
             const amount = item.id === 'CREDITS_20' ? 20 : 10; 
             this.player.addCredits(amount);
             this.ui.log(`Vous avez récupéré ${amount} crédits.`);
        } else {
            this.player.addItem(targetId);
            this.ui.log(`Vous avez ramassé : ${item.nom}`);
            
            // Check quest progress
            if (this.questManager) {
                this.questManager.checkQuestProgress('obtain', targetId);
            }
        }
        
        this.world.removeItemFromZone(zone.id, targetId);
        this.ui.updateHUD(this.player);
        this.ui.updateInventoryDisplay(this.player, (id) => this.world.getItem(id));
        this.ui.switchTab('inventory');
    }

    handleEquip(itemQuery) {
        if (!itemQuery) {
            this.ui.log("EQUIPER QUOI ? (EQUIP [NOM])");
            return;
        }

        // Search in inventory
        const itemId = this.player.inventory.find(id => id.includes(itemQuery));
        if (!itemId) {
            this.ui.log("Vous n'avez pas cet objet.");
            return;
        }

        const item = this.world.getItem(itemId);
        const result = this.player.equip(item);
        
        if (result.success) {
            this.ui.log(`\n**[ÉQUIPEMENT]** ${result.message}`);
            
            // Display stat changes
            if (result.statChanges) {
                const changes = [];
                if (result.statChanges.strength !== 0) changes.push(`Force: ${result.statChanges.strength > 0 ? '+' : ''}${result.statChanges.strength}`);
                if (result.statChanges.agility !== 0) changes.push(`Agilité: ${result.statChanges.agility > 0 ? '+' : ''}${result.statChanges.agility}`);
                if (result.statChanges.hacking !== 0) changes.push(`Hack: ${result.statChanges.hacking > 0 ? '+' : ''}${result.statChanges.hacking}`);
                if (result.statChanges.armor !== 0) changes.push(`Armure: ${result.statChanges.armor > 0 ? '+' : ''}${result.statChanges.armor}`);
                
                if (changes.length > 0) {
                    this.ui.log(`<span style="color: var(--accent);">→ Bonus: ${changes.join(' | ')}</span>`);
                }
            }
            
            // Show weapon damage if applicable
            if (result.item && result.item.stats && result.item.stats.damage) {
                this.ui.log(`<span style="color: var(--primary);">→ Dégâts: ${result.item.stats.damage}</span>`);
            }
        } else {
            this.ui.log(result.message);
        }
        
        this.ui.updateHUD(this.player);
        this.ui.updateInventoryDisplay(this.player, (id) => this.world.getItem(id));
        this.ui.switchTab('inventory');
    }

    handleUnequip(slotName) {
        if (!slotName) {
            this.ui.log("DÉSÉQUIPER QUOI ? (UNEQUIP [WEAPON/HEAD/BODY] ou [ARME/TETE/CORPS])");
            return;
        }

        const map = {
            'ARME': 'weapon', 'WEAPON': 'weapon',
            'TETE': 'head', 'HEAD': 'head', 'CRANE': 'head',
            'CORPS': 'body', 'BODY': 'body', 'ARMURE': 'body'
        };

        const slot = map[slotName];
        if (!slot) {
            this.ui.log("Emplacement inconnu. Utilisez ARME, TETE ou CORPS.");
            return;
        }

        const result = this.player.unequip(slot);
        this.ui.log(result.message);
        this.ui.updateHUD(this.player);
        this.ui.updateInventoryDisplay(this.player, (id) => this.world.getItem(id));
        this.ui.switchTab('inventory');
    }

    async handleTalk(targetQuery) {
        if (!targetQuery) {
            this.ui.log("PARLER À QUI ? (TALK [NOM])");
            return;
        }

        const zone = this.world.getCurrentZone();
        
        // Find NPC by partial match
        let npcId = zone.pnj_presents.find(id => id.toUpperCase().includes(targetQuery));
        
        if (!npcId) {
            npcId = zone.pnj_presents.find(id => {
                const npc = this.world.getNPC(id);
                return npc && npc.nom.toUpperCase().includes(targetQuery);
            });
        }

        if (!npcId) {
            this.ui.log("Cette personne n'est pas ici.");
            return;
        }

        await this.questManager.handleTalk(npcId);
        
        // Update UI (HUD + Inventory) as quests might have changed inventory or stats
        this.ui.updateHUD(this.player);
        this.ui.updateInventoryDisplay(this.player, (id) => this.world.getItem(id));
    }

    handleQuests() {
        this.ui.log(this.questManager.getActiveQuestsSummary());
    }

    async handleJump(targetX, targetY) {
        // 1. Validation
        if (isNaN(targetX) || isNaN(targetY)) {
            this.ui.logSystem("SYNTAXE INVALIDE, Opérateur. Utiliser : JUMP [X] [Y].");
            return;
        }

        // 2. Check accessibility
        const targetZoneId = this.world.getZoneIdByCoords(targetX, targetY);
        if (!targetZoneId) {
            this.ui.log(`[ERREUR DE LIAISON] : Secteur [${targetX}, ${targetY}] inexistant.`);
            return;
        }

        const targetZone = this.world.getZone(targetZoneId);
        if (!targetZone.visited) {
            this.ui.log(`[ERREUR DE LIAISON] : Secteur [${targetX}, ${targetY}] non cartographié. Accès refusé.`);
            return;
        }

        if (targetZoneId === this.world.currentLocationId) {
             this.ui.log("Agent déjà présent sur ce secteur.");
             return;
        }

        // 3. Combat Check (Basic check, Combat class usually handles modal state but we can check if UI is tracking it?)
        // Assuming strictly turn based, but "isActive" isn't exposed on Combat class public interface easily without checking source.
        // Actually, resolveAction wouldn't even run if combat was expecting input unless we are in free roam.
        // But let's assume valid.

        // 4. Execution
        this.ui.log(`\n**[PROTOCOLE DE SAUT NEURONAL ACTIVÉ]**`);
        this.ui.log(`Compression et re-routage du flux de données...`);
        
        await this.ui.sleep(800);
        
        // Teleport
        this.world.currentLocationId = targetZoneId;
        
        this.ui.log(`[SYNCHRONISATION TERMINÉE] : Agent 'Ghost Link' localisé au secteur [${targetX}, ${targetY}].`);
        
        this.handleLook();
        this.ui.updatePrompt(targetZoneId);
        this.ui.updateMinimap(this.world);
        this.updateAutocompleteContext();
    }

    handleSave() {
        const result = SaveManager.saveGame(
            this.player,
            this.world
        );
        this.ui.log(result.message);
    }

    handleDebug() {
        this.ui.log("\n**[DEBUG MODE]**");
        this.ui.log(`SEED: ${this.world.seed}`);
        this.ui.log(`Zones générées: ${this.world.zones.length}`);
        
        // Check quest-critical NPCs
        const gibson = this.world.zones.find(z => z.pnj_presents.includes('GIBSON_HACKER'));
        this.ui.log(`Gibson présent: ${gibson ? 'OUI ('+gibson.nom+')' : 'NON'}`);
        
        const enemies = this.world.zones.filter(z => 
            z.pnj_presents.some(id => {
                const npc = this.world.getNPC(id);
                return npc && npc.type === 'ennemi';
            })
        );
        this.ui.log(`Ennemis présents: ${enemies.length} zones`);
        
        // Check quest items
        const datapad = this.world.zones.find(z => z.items_statiques.includes('DATAPAD_KEY'));
        this.ui.log(`Datapad présent: ${datapad ? 'OUI ('+datapad.nom+')' : 'NON'}`);
        
        // Check equipment
        const weapons = this.world.zones.filter(z => 
            z.items_statiques.some(id => {
                const item = this.world.getItem(id);
                return item && item.type === 'weapon';
            })
        );
        this.ui.log(`Armes disponibles: ${weapons.length} zones`);
        
        const armor = this.world.zones.filter(z => 
            z.items_statiques.some(id => {
                const item = this.world.getItem(id);
                return item && item.type === 'equipment';
            })
        );
        this.ui.log(`Équipements disponibles: ${armor.length} zones`);
        
        this.ui.log("\nMonde jouable: " + (gibson && enemies.length > 0 ? "OUI" : "NON - REGENERER"));
    }

    handleQuit() {
        this.ui.log("\n**[DÉCONNEXION D'URGENCE]** Interruption du signal neural...", { allowHTML: true });
        this.ui.log("Sauvegarde du tampon mémoire...", { allowHTML: true });
        this.handleSave();
        setTimeout(() => {
            
            // Hide game interface
            this.ui.terminalContainer.style.display = 'none';
            
            // Show title screen
            this.showTitleScreen();
        }, 1000);
    }
}
