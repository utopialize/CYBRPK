export class Combat {
    constructor(world, player, ui, questManager = null) {
        this.world = world;
        this.player = player;
        this.ui = ui;
        this.questManager = questManager;
    }

    rollDice(faces) {
        return Math.floor(Math.random() * faces) + 1;
    }

    async handleAttack(targetNameOrId) {
        if (!targetNameOrId) {
            this.ui.log("QUI ATTAQUER ? (ATTACK [Cible])");
            return;
        }

        const zone = this.world.getCurrentZone();
        
        // Try to find target by partial match (ID or name)
        let targetId = zone.pnj_presents.find(id => id.toUpperCase().includes(targetNameOrId));
        
        // If not found by ID, try matching by NPC name
        if (!targetId) {
            targetId = zone.pnj_presents.find(id => {
                const npc = this.world.getNPC(id);
                return npc && npc.nom.toUpperCase().includes(targetNameOrId);
            });
        }

        if (!targetId) {
            this.ui.log(`[ERREUR] : La cible '${targetNameOrId}' n'est pas ici.`);
            return;
        }

        const targetDetails = this.world.getNPC(targetId);
        if (targetDetails.type !== 'ennemi') {
            this.ui.log(`ATTENTION : ${targetDetails.nom} n'est pas hostile, ou vous n'avez pas le bon outil.`);
            return;
        }

        // Init NPC HP if needed
        if (!this.world.npcHealth[targetId]) {
            this.world.npcHealth[targetId] = targetDetails.statistiques.force + targetDetails.statistiques.armure * 5;
        }

        // === CINEMATIC COMBAT SEQUENCE ===
        await this.playCombatSequence(targetId, targetDetails);
    }

    async playCombatSequence(targetId, targetDetails) {
        const stats = this.player.stats;
        const weapon = this.player.equipment.weapon;
        const weaponDamage = weapon && weapon.stats ? weapon.stats.damage : 1;
        const weaponName = weapon ? weapon.nom : "Mains nues";

        // PHASE 1: INTRODUCTION
        this.ui.log(`\n**[COMBAT ENGAGÉ]**`);
        await this.ui.sleep(300);
        this.ui.log(`Cible : ${targetDetails.nom}`);
        await this.ui.sleep(300);
        this.ui.log(`PV Ennemi : ${this.world.npcHealth[targetId]}`);
        await this.ui.sleep(500);

        // PHASE 2: PREPARATION
        this.ui.log(`\n> Vous brandissez : ${weaponName}`);
        await this.ui.sleep(400);
        
        // PHASE 3: ATTACK ROLL
        this.ui.log(`\n[CALCUL D'ATTAQUE]`);
        await this.ui.sleep(300);
        
        const roll = this.rollDice(20);
        this.ui.log(`Jet de dé : ${roll}/20`);
        await this.ui.sleep(400);
        
        const attackValue = stats.strength + roll;
        const defenseValue = targetDetails.statistiques.armure * 2;
        this.ui.log(`Force totale : ${attackValue} (${stats.strength} + ${roll})`);
        await this.ui.sleep(300);
        this.ui.log(`Défense ennemie : ${defenseValue}`);
        await this.ui.sleep(500);

        let damage = 0;

        // PHASE 4: RESOLUTION
        if (roll === 20) {
            // CRITICAL HIT
            this.ui.log(`\n**╔═══════════════════╗**`);
            await this.ui.sleep(200);
            this.ui.log(`**║ COUP CRITIQUE !  ║**`);
            await this.ui.sleep(200);
            this.ui.log(`**╚═══════════════════╝**`);
            await this.ui.sleep(400);
            
            damage = (weaponDamage * 2) + Math.max(0, attackValue - defenseValue);
            
            this.ui.log(`L'armure est ignorée !`);
            await this.ui.sleep(300);
            this.ui.triggerScreenShake();
            
        } else if (attackValue >= defenseValue) {
            // HIT
            this.ui.log(`\n[IMPACT]`);
            await this.ui.sleep(300);
            
            const margin = attackValue - defenseValue;
            damage = weaponDamage + Math.floor(margin / 2);
            
            this.ui.log(`Coup réussi !`);
            await this.ui.sleep(300);
            
        } else {
            // MISS
            this.ui.log(`\n[ÉCHEC]`);
            await this.ui.sleep(300);
            this.ui.log(`${targetDetails.nom} esquive votre attaque !`);
            await this.ui.sleep(500);
            damage = 0;
        }

        // PHASE 5: DAMAGE APPLICATION
        if (damage > 0) {
            this.ui.log(`\n**DÉGÂTS : -${damage} PV**`);
            await this.ui.sleep(400);
            
            this.world.npcHealth[targetId] -= damage;
            this.ui.log(`PV restants : ${this.world.npcHealth[targetId]}`);
            await this.ui.sleep(500);
        }

        // PHASE 6: OUTCOME
        if (this.world.npcHealth[targetId] <= 0) {
            // VICTORY
            this.ui.log(`\n**═══════════════════**`);
            await this.ui.sleep(200);
            this.ui.log(`**   VICTOIRE !     **`);
            await this.ui.sleep(200);
            this.ui.log(`**═══════════════════**`);
            await this.ui.sleep(400);
            
            this.ui.log(`${targetDetails.nom} est neutralisé.`);
            await this.ui.sleep(300);
            
            // Loot
            const creditsLoot = this.rollDice(100) + 50;
            this.player.addCredits(creditsLoot);
            this.ui.log(`\n[BUTIN] +${creditsLoot} crédits`);
            await this.ui.sleep(300);
            this.ui.log(`Total : ${this.player.credits} crédits`);
            await this.ui.sleep(300);

            // Remove from zone
            this.world.removeNPCFromZone(zone.id, targetId);
            delete this.world.npcHealth[targetId];
            
            // Add wreckage if robot/drone
            if (targetDetails.nom.toUpperCase().includes('DRONE') || targetDetails.nom.toUpperCase().includes('DROIDE')) {
                this.world.addItemToZone(zone.id, 'DEBRIS_DRONE');
                this.ui.log(`Les débris du drone gisent au sol.`);
            }
            
            // Check quest progress
            if (this.questManager) {
                this.questManager.checkQuestProgress('kill', targetId);
            }

        } else {
            // COUNTER-ATTACK
            await this.playCounterAttack(targetDetails, stats);
        }
        
        // Update HUD after combat
        this.ui.updateHUD(this.player);
    }

    async playCounterAttack(targetDetails, stats) {
        this.ui.log(`\n**[CONTRE-ATTAQUE]**`);
        await this.ui.sleep(400);
        
        this.ui.log(`${targetDetails.nom} riposte !`);
        await this.ui.sleep(400);
        
        const incomingDamage = Math.max(1, targetDetails.statistiques.force);
        this.ui.log(`Puissance : ${incomingDamage}`);
        await this.ui.sleep(300);
        
        const damageTaken = Math.max(0, incomingDamage - stats.armor);
        
        if (damageTaken > 0) {
            this.ui.log(`\n[IMPACT SUR VOUS]`);
            await this.ui.sleep(300);
            
            // SCREEN SHAKE + GLITCH on player damage
            this.ui.triggerDamageEffect();
            
            this.player.takeDamage(damageTaken);
            this.ui.log(`**DÉGÂTS SUBIS : -${damageTaken} PV**`);
            await this.ui.sleep(300);
            this.ui.log(`(Armure a bloqué ${stats.armor} dégâts)`);
            await this.ui.sleep(400);
            this.ui.log(`Vos PV : ${this.player.hp}/${this.player.maxHp}`);
            await this.ui.sleep(500);
            
            if (this.player.hp <= 0) {
                this.ui.log(`\n**╔═══════════════════╗**`);
                await this.ui.sleep(200);
                this.ui.log(`**║   GAME OVER      ║**`);
                await this.ui.sleep(200);
                this.ui.log(`**╚═══════════════════╝**`);
                await this.ui.sleep(300);
                this.ui.log(`\nVous avez été neutralisé...`);
                await this.ui.sleep(300);
                this.ui.log(`Tapez QUIT pour retourner au menu.`);
            }
        } else {
            this.ui.log(`\n[PROTECTION]`);
            await this.ui.sleep(300);
            this.ui.log(`Votre armure bloque entièrement l'attaque !`);
            await this.ui.sleep(500);
        }
    }
}
