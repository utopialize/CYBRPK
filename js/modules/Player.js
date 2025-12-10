export class Player {
    constructor(name = "Runner") {
        this.name = name;
        this.baseStats = {
            strength: 10,
            agility: 10,
            hacking: 10,
            armor: 0
        };
        this.maxHp = 100;
        this.hp = 100;
        
        // Slots: weapon, head, body
        this.equipment = {
            weapon: null,
            head: null,
            body: null
        };
        this.credits = 50;
        this.inventory = [];
        this.godMode = false; // Secret cheat
        
        // Quest tracking
        this.activeQuests = []; // Array of { questId, currentStep }
        this.completedQuests = []; // Array of questIds
    }
    
    takeDamage(amount) {
        if (this.godMode) return; // Invincible
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
    }

    isDead() {
        return this.hp <= 0;
    }

    heal(amount) {
        this.hp += amount;
        if (this.hp > this.maxHp) this.hp = this.maxHp;
    }

    // Retourne les stats finales (Base + Equipement)
    get stats() {
        const finalStats = { ...this.baseStats };
        // Pour l'armure, on part de la base (souvent 0)
        finalStats.armor = this.baseStats.armor;

        // Apply bonuses
        // WEAPON (Adds damage capability, handled in Combat, but maybe adds stats?)
        // ARMOR/IMPLANT (Adds stats)
        
        // Check Head
        if (this.equipment.head) {
             // Assuming head item object is passed or we look it up. 
             // Ideally Player should store Item Objects or IDs and look them up.
             // For simplicity, let's assume we store the full Item Data or we need a lookup.
             // Refactoring: equip() will require item data.
             this.applyItemStats(finalStats, this.equipment.head);
        }
         // Check Body
        if (this.equipment.body) {
             this.applyItemStats(finalStats, this.equipment.body);
        }
        
        return finalStats;
    }
    
    // Helper to apply stats from an item
    applyItemStats(statsObj, item) {
        if (item && item.effet) {
            if (item.effet.strength) statsObj.strength += item.effet.strength;
            if (item.effet.agility) statsObj.agility += item.effet.agility;
            if (item.effet.hacking) statsObj.hacking += item.effet.hacking;
            if (item.effet.armor) statsObj.armor += item.effet.armor;
        }
    }

    addItem(itemId) {
        this.inventory.push(itemId);
    }

    removeItem(itemId) {
        const index = this.inventory.indexOf(itemId);
        if (index > -1) {
            this.inventory.splice(index, 1);
            return true;
        }
        return false;
    }

    hasItem(itemId) {
        return this.inventory.includes(itemId);
    }
    
    // Equip an item (Requires full item object to check slot)
    equip(item) {
        if (!item) return { success: false, message: "Objet invalide." };
        if (!this.hasItem(item.id)) return { success: false, message: "Vous ne possédez pas cet objet." };
        
        const slot = item.slot;
        if (!slot || !this.equipment.hasOwnProperty(slot)) {
            return { success: false, message: `Cet objet ne peut pas être équipé (${item.type}).` };
        }

        // Calculate stat changes
        const oldStats = this.stats;
        
        // If something is already equipped, unequip it first
        if (this.equipment[slot]) {
            this.unequip(slot);
        }

        // Move from Inventory to Equipment
        this.removeItem(item.id);
        this.equipment[slot] = item;
        
        // Calculate new stats
        const newStats = this.stats;
        const statChanges = {
            strength: newStats.strength - oldStats.strength,
            agility: newStats.agility - oldStats.agility,
            hacking: newStats.hacking - oldStats.hacking,
            armor: newStats.armor - oldStats.armor
        };
        
        return { 
            success: true, 
            message: `Vous avez équipé : ${item.nom}.`,
            item: item,
            statChanges: statChanges
        };
    }

    unequip(slot) {
        if (!this.equipment.hasOwnProperty(slot)) return { success: false, message: "Emplacement invalide." };
        
        const item = this.equipment[slot];
        if (!item) return { success: false, message: "Rien n'est équipé ici." };

        // Move from Equipment to Inventory
        this.equipment[slot] = null;
        this.addItem(item.id);

        return { success: true, message: `Vous avez déséquipé : ${item.nom}.` };
    }

    addCredits(amount) {
        this.credits += amount;
    }

    getInventorySummary(itemLookupFn) {
        let summary = "";
        
        // Section Equipement
        summary += "**[ÉQUIPEMENT ACTUEL]**\n";
        summary += `ARME   : ${this.equipment.weapon ? this.equipment.weapon.nom : "(Mains nues)"}\n`;
        summary += `TÊTE   : ${this.equipment.head ? this.equipment.head.nom : "(-)"}\n`;
        summary += `CORPS  : ${this.equipment.body ? this.equipment.body.nom : "(-)"}\n`;
        
        // Stats Recap
        const s = this.stats;
        summary += `STATS  : FOR:${s.strength} AGI:${s.agility} PIR:${s.hacking} ARM:${s.armor}\n`;

        // Section Sac
        summary += "\n**[DANS LE SAC]**\n";
        if (this.inventory.length === 0) {
            summary += "Vide.\n";
        } else {
            const counts = this.inventory.reduce((acc, id) => {
                acc[id] = (acc[id] || 0) + 1;
                return acc;
            }, {});

            for (const [id, count] of Object.entries(counts)) {
                const item = itemLookupFn(id);
                if (item) {
                    let typeInfo = item.type === 'weapon' || item.type === 'equipment' ? `[${item.slot || '?'}]` : '';
                    summary += `- ${item.nom} ${typeInfo} x${count}\n`;
                } else {
                    summary += `- ${id} x${count}\n`;
                }
            }
        }
        
        return summary;
    }
}
