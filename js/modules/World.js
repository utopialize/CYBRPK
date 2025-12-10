import { SeededRandom } from '../utils/SeededRandom.js';

export class World {
    constructor(zonesData, pnjsData, itemsData, seed = "CRPK-DEFAULT") {
        this.templates = zonesData;
        this.pnjs = pnjsData;
        this.itemsData = itemsData || [];
        this.npcHealth = {};
        
        this.seed = seed;
        this.rng = new SeededRandom(seed);
        this.zones = [];
        this.currentLocationId = null;

        this.generateWorld();
    }

    getZoneIdByCoords(x, y) {
        // Find zone with matching coordinates
        const zone = this.zones.find(z => z.x === x && z.y === y);
        return zone ? zone.id : null;
    }

    generateWorld() {
        const grid = new Map();
        const numRooms = 15;
        let x = 0, y = 0;

        // Create Start Room (safe zone, no enemies)
        this.addZoneToGrid(grid, x, y, true);

        // Random Walk to create connected world
        for (let i = 0; i < numRooms; i++) {
            const dirs = ['nord', 'sud', 'est', 'ouest'];
            const move = this.rng.pick(dirs);

            let nx = x, ny = y;
            if (move === 'nord') ny -= 1;
            if (move === 'sud') ny += 1;
            if (move === 'est') nx += 1;
            if (move === 'ouest') nx -= 1;

            if (!grid.has(`${nx},${ny}`)) {
                this.addZoneToGrid(grid, nx, ny);
            }

            const currentZone = grid.get(`${x},${y}`);
            const nextZone = grid.get(`${nx},${ny}`);

            currentZone.connexions[move] = nextZone.id;
            
            const opposite = { 'nord': 'sud', 'sud': 'nord', 'est': 'ouest', 'ouest': 'est' };
            nextZone.connexions[opposite[move]] = currentZone.id;

            x = nx;
            y = ny;
        }

        this.zones = Array.from(grid.values());
        this.currentLocationId = grid.get("0,0").id;
        this.getZone(this.currentLocationId).visited = true;
        
        // CRITICAL: Ensure quest-critical NPCs and items are placed
        this.ensureQuestCompletability();
        
        console.log(`World generated with ${this.zones.length} zones.`);
    }

    ensureQuestCompletability() {
        // Find quest giver (Gibson)
        const questGiver = this.pnjs.find(npc => npc.id === 'GIBSON_HACKER');
        if (questGiver) {
            // Remove Gibson from ANY zone first to prevent duplicates
            this.zones.forEach(z => {
                const idx = z.pnj_presents.indexOf(questGiver.id);
                if (idx !== -1) {
                    z.pnj_presents.splice(idx, 1);
                }
            });

            // Place Gibson in start zone definitely
            const startZone = this.getZone(this.currentLocationId);
            if (!startZone.pnj_presents.includes(questGiver.id)) {
                startZone.pnj_presents.push(questGiver.id);
            }
        }

        // Ensure Corrupted Drone exists (Unique Quest Enemy)
        const corruptedDrone = this.pnjs.find(npc => npc.id === 'DROIDE_CORROMPU');
        if (corruptedDrone) {
             const hasDrone = this.zones.some(z => z.pnj_presents.includes(corruptedDrone.id));
             if (!hasDrone) {
                 // Place drone in a random non-start zone
                 const nonStartZones = this.zones.filter(z => z.id !== this.currentLocationId);
                 if (nonStartZones.length > 0) {
                     const targetZone = this.rng.pick(nonStartZones);
                     targetZone.pnj_presents.push(corruptedDrone.id);
                 }
             }
        }

        // Ensure at least some weapons and armor are available
        const weapons = this.itemsData.filter(item => item.type === 'weapon');
        const armor = this.itemsData.filter(item => item.type === 'equipment' && item.slot === 'body');
        
        // Place at least one weapon
        if (weapons.length > 0) {
            const hasWeapon = this.zones.some(z => 
                z.items_statiques.some(itemId => {
                    const item = this.getItem(itemId);
                    return item && item.type === 'weapon';
                })
            );
            if (!hasWeapon) {
                const weapon = this.rng.pick(weapons);
                const targetZone = this.rng.pick(this.zones.filter(z => z.id !== this.currentLocationId));
                targetZone.items_statiques.push(weapon.id);
            }
        }

        // Place at least one armor piece
        if (armor.length > 0) {
            const hasArmor = this.zones.some(z => 
                z.items_statiques.some(itemId => {
                    const item = this.getItem(itemId);
                    return item && item.type === 'equipment' && item.slot === 'body';
                })
            );
            if (!hasArmor) {
                const armorPiece = this.rng.pick(armor);
                const targetZone = this.rng.pick(this.zones.filter(z => z.id !== this.currentLocationId));
                targetZone.items_statiques.push(armorPiece.id);
            }
        }
    }

    addZoneToGrid(grid, x, y, isStart = false) {
        const template = this.rng.pick(this.templates);
        
        const newZone = JSON.parse(JSON.stringify(template));
        newZone.id = `ZONE_${x}_${y}`;
        newZone.x = x;
        newZone.y = y;
        newZone.visited = false;
        
        newZone.nom = `${template.nom} [${x},${y}]`;
        newZone.connexions = {};
        newZone.pnj_presents = [];
        newZone.items_statiques = [];

        // Random population (but quest-critical items are ensured later)
        if (!isStart && this.rng.next() > 0.6) {
            if (this.pnjs.length > 0) {
                 const npc = this.rng.pick(this.pnjs);
                 newZone.pnj_presents.push(npc.id);
            }
        }
        
        if (!isStart && this.rng.next() > 0.5) {
             const item = this.rng.pick(this.itemsData);
             // Don't place quest-critical items or scenery randomly
             if (item.type !== 'key' && item.id !== 'DATAPAD_KEY' && item.type !== 'scenery') {
                 newZone.items_statiques.push(item.id);
             }
        }

        grid.set(`${x},${y}`, newZone);
    }

    getCurrentZone() {
        return this.zones.find(z => z.id === this.currentLocationId);
    }

    getZone(id) {
        return this.zones.find(z => z.id === id);
    }

    getItem(id) {
        return this.itemsData.find(i => i.id === id);
    }

    getNPC(id) {
        return this.pnjs.find(p => p.id === id);
    }

    move(direction) {
        if (!direction) return { success: false, message: "Direction manquante. Utiliser : MOVE [NORD/SUD/EST/OUEST]" };

        const zone = this.getCurrentZone();
        if (!zone) return { success: false, message: "Erreur zone introuvable." };

        const newId = zone.connexions[direction.toLowerCase()];
        if (newId) {
            this.currentLocationId = newId;
            this.getZone(newId).visited = true;
            return { success: true, message: `Vous vous dirigez vers le ${direction.toLowerCase()}...` };
        } else {
            return { success: false, message: `MOUVEMENT IMPOSSIBLE. Il n'y a pas de sortie au ${direction}.` };
        }
    }

    removeItemFromZone(zoneId, itemId) {
        const zone = this.getZone(zoneId);
        if (zone && zone.items_statiques) {
            zone.items_statiques = zone.items_statiques.filter(id => id !== itemId);
        }
    }

    removeNPCFromZone(zoneId, npcId) {
        const zone = this.getZone(zoneId);
        if (zone && zone.pnj_presents) {
            zone.pnj_presents = zone.pnj_presents.filter(id => id !== npcId);
        }
    }

    addItemToZone(zoneId, itemId) {
        const zone = this.getZone(zoneId);
        if (zone) {
            zone.items_statiques.push(itemId);
        }
    }

    addNPCToZone(zoneId, npcId) {
        const zone = this.getZone(zoneId);
        if (zone && !zone.pnj_presents.includes(npcId)) {
            zone.pnj_presents.push(npcId);
        }
    }
}
