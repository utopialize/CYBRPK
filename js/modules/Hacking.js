export class Hacking {
    constructor(ui, player, world, combat) {
        this.ui = ui;
        this.player = player;
        this.world = world;
        this.combat = combat;
        this.active = false;
        this.ctx = ui.getCanvasContext();
        this.canvas = ui.getCanvas();
        this.currentTarget = null;
    }

    startHack(targetQuery, onSuccessCallback) {
        if (!targetQuery) {
            this.ui.log("QUOI PIRATER ? (HACK [Système/NPC])");
            return;
        }

        // Find target in current zone
        const zone = this.world.getCurrentZone();
        let targetId = zone.pnj_presents.find(id => id.toUpperCase().includes(targetQuery.toUpperCase()));
        
        // Try by name search if direct ID fails
        if (!targetId) {
             targetId = zone.pnj_presents.find(id => {
                 const npc = this.world.getNPC(id);
                 return npc && npc.nom.toUpperCase().includes(targetQuery.toUpperCase());
             });
        }

        if (!targetId) {
             this.ui.log("Cible de piratage introuvable.");
             return;
        }
        
        this.currentTarget = targetId;

        this.ui.log(`[SHELL INJECTION EN COURS] L'Opérateur prend le contrôle direct de ${targetId}...`);
        this.ui.setHackingMode(true);
        this.active = true;

        this.runMinigame(targetId, onSuccessCallback);
    }

    runMinigame(targetId, onSuccess) {
        if (!this.ctx) return;

        // Visuals
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#0a0';
        this.ctx.font = "20px Courier New";
        this.ctx.fillText("HACKING IN PROGRESS...", 50, 50);
        this.ctx.fillText(`TARGET: ${targetId}`, 50, 80);

        // Simulation
        // In a real game, this would be an interactive loop
        setTimeout(() => {
            const success = Math.random() > 0.3; // 70% success rate for test
            this.finishHack(success, targetId, onSuccess);
        }, 2000);
    }

    finishHack(success, targetId, onSuccess) {
        this.active = false;
        this.ui.setHackingMode(false);
        this.ui.clearInput();

        if (success) {
            this.ui.log(`\n**[ACCÈS ROOT CONFIRMÉ]** Droits administrateur obtenus.`);
            
            // Specific Loot Logic
            if (targetId === 'DROIDE_CORROMPU') {
                 // Check if player already has it to avoid duplicates
                 if (!this.player.hasItem('DATAPAD_KEY') && !this.player.hasItem('DATAPAD_BROKEN')) {
                      this.player.addItem('DATAPAD_KEY');
                      this.ui.log(`**CRITIQUE** : Vous extrayez les données avant destruction. 'Clé Datapad' obtenue !`);
                 } else {
                     this.ui.log("Les données ont déjà été extraites.");
                 }
                 
                 // Transform drone: Remove corrupted, add security drone
                 const zone = this.world.getCurrentZone();
                 this.world.removeNPCFromZone(zone.id, 'DROIDE_CORROMPU');
                 this.world.addNPCToZone(zone.id, 'DROIDE_GARDIEN');
                 this.ui.log(`\n**[REPROGRAMMATION RÉUSSIE]** Le drone corrompu a été converti en Drone de Sécurité E-04.`);
                 this.ui.log(`Il est maintenant sous votre contrôle et patrouille la zone.`);
            } else {
                 // Generic loot (credits)
                 const credits = Math.floor(Math.random() * 50) + 10;
                 this.player.addCredits(credits);
                 this.ui.log(`Données converties en ${credits} crédits.`);
            }

            if (onSuccess) onSuccess();
        } else {
            this.ui.log("\n[ALERTE SYSTÈME] : Le firewall a rejeté la connexion. Repéré !");
            
            // Trigger combat for hostile NPCs
            const npc = this.world.getNPC(targetId);
            if (npc && npc.hostile && this.combat) {
                this.ui.log(`**[CONTRE-MESURE ACTIVE]** ${npc.nom} lance une attaque préventive !`);
                // Give NPC initiative by triggering counter-attack first
                setTimeout(async () => {
                    await this.combat.playCounterAttack(npc, this.player.stats);
                    // Then start normal combat
                    this.combat.startCombat(targetId);
                }, 500);
            }
        }
    }
}
