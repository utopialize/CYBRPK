export class SaveManager {
    static SAVE_KEY = 'CRPK_SAVE_DATA';

    static saveGame(player, world) {
        const saveData = {
            version: '1.0',
            timestamp: Date.now(),
            seed: world.seed,
            player: {
                name: player.name,
                hp: player.hp,
                maxHp: player.maxHp,
                baseStats: player.baseStats,
                credits: player.credits,
                inventory: player.inventory,
                equipment: {
                    weapon: player.equipment.weapon ? player.equipment.weapon.id : null,
                    head: player.equipment.head ? player.equipment.head.id : null,
                    body: player.equipment.body ? player.equipment.body.id : null
                },
                activeQuests: player.activeQuests,
                completedQuests: player.completedQuests
            },
            world: {
                currentLocationId: world.currentLocationId,
                zones: world.zones.map(zone => ({
                    id: zone.id,
                    visited: zone.visited,
                    items_statiques: zone.items_statiques,
                    pnj_presents: zone.pnj_presents
                })),
                npcHealth: world.npcHealth
            }
        };

        try {
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
            return { success: true, message: "Partie sauvegardée." };
        } catch (e) {
            return { success: false, message: `Erreur de sauvegarde : ${e.message}` };
        }
    }

    static loadGame() {
        try {
            const data = localStorage.getItem(this.SAVE_KEY);
            if (!data) {
                return { success: false, message: "Aucune sauvegarde trouvée." };
            }

            const saveData = JSON.parse(data);
            return { success: true, data: saveData };
        } catch (e) {
            return { success: false, message: `Erreur de chargement : ${e.message}` };
        }
    }

    static hasSave() {
        return localStorage.getItem(this.SAVE_KEY) !== null;
    }

    static deleteSave() {
        localStorage.removeItem(this.SAVE_KEY);
    }

    static getSaveInfo() {
        const result = this.loadGame();
        if (!result.success) return null;

        const date = new Date(result.data.timestamp);
        return {
            date: date.toLocaleString('fr-FR'),
            seed: result.data.seed,
            credits: result.data.player.credits,
            hp: result.data.player.hp
        };
    }
}
