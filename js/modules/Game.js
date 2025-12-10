import { UI } from './UI.js';
import { Player } from './Player.js';
import { World } from './World.js';
import { Combat } from './Combat.js';
import { Hacking } from './Hacking.js';
import { QuestManager } from './QuestManager.js';
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
        this.currentScreen = 'BOOT'; // BOOT, TITLE, GAME
    }

    async init() {
        // Show boot sequence first
        await this.ui.showBootSequence();
        
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
            this.hacking = new Hacking(this.ui, this.player);

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
        
        this.ui.log(`> ${input}`);
        
        const parts = input.toUpperCase().split(/\s+/).filter(p => p.length > 0);
        const command = parts[0];
        const args = parts.slice(1);
        
        this.resolveAction(command, args);
    }

    resolveAction(command, args) {
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
            case 'HELP':
                this.ui.log("Commandes: MOVE, LOOK, TAKE, EQUIP, UNEQUIP, ATTACK, HACK, TALK, QUESTS, SAVE, QUIT");
                break;
            default:
                this.ui.log("COMMANDE INCONNUE. Taper HELP.");
        }
    }

    handleMove(direction) {
        const result = this.world.move(direction);
        if (result.success) {
            this.ui.updatePrompt(result.newId);
            this.ui.log(`Vous vous dirigez vers le ${direction}...`);
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

        this.ui.log(`\n<b>VOUS ÊTES DANS : ${zone.nom}</b>`);
        
        // Use typing effect for description
        await this.ui.logTyped(zone.description, 15);

        const exits = Object.keys(zone.connexions).join(', ');
        this.ui.log(`**SORTIES :** ${exits.length > 0 ? exits : 'Aucune.'}`);

        if (zone.pnj_presents && zone.pnj_presents.length > 0) {
            const pnjNames = zone.pnj_presents.map(id => {
                const p = this.world.getNPC(id);
                return p ? p.nom : id;
            }).join(', ');
            this.ui.log(`**ENTITÉS :** ${pnjNames}`);
        }

        if (zone.items_statiques && zone.items_statiques.length > 0) {
             const itemNames = zone.items_statiques.map(id => {
                const i = this.world.getItem(id);
                return i ? i.nom : id;
            }).join(', ');
            this.ui.log(`**OBJETS VISIBLES :** ${itemNames}`);
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
        this.ui.log(result.message);
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
        this.ui.log("Déconnexion en cours...");
        
        // Reset game state
        setTimeout(() => {
            // Clear game log
            if (this.ui.gameLog) this.ui.gameLog.innerHTML = '';
            
            // Reset player
            this.player = new Player();
            this.world = null;
            this.combat = null;
            this.hacking = null;
            
            // Hide game interface
            this.ui.terminalContainer.style.display = 'none';
            
            // Show title screen
            this.showTitleScreen();
        }, 1000);
    }
}
