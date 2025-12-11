export class QuestManager {
    constructor(questsData, player, world, ui) {
        this.quests = questsData;
        this.player = player;
        this.world = world;
        this.ui = ui;
    }

    getQuest(questId) {
        return this.quests.find(q => q.id === questId);
    }

    isQuestActive(questId) {
        return this.player.activeQuests.some(q => q.questId === questId);
    }

    isQuestCompleted(questId) {
        return this.player.completedQuests.includes(questId);
    }

    canStartQuest(questId) {
        const quest = this.getQuest(questId);
        if (!quest) return false;
        if (this.isQuestActive(questId) || this.isQuestCompleted(questId)) return false;
        
        // Check prerequisites
        if (quest.prerequis) {
            return quest.prerequis.every(preq => this.isQuestCompleted(preq));
        }
        return true;
    }

    startQuest(questId) {
        if (!this.canStartQuest(questId)) return false;
        
        this.player.activeQuests.push({
            questId: questId,
            currentStep: 0
        });
        
        const quest = this.getQuest(questId);
        this.ui.log(`\n**[NOUVELLE QUÊTE]** ${quest.titre}`);
        this.ui.log(quest.description);
        
        return true;
    }

    advanceQuest(questId) {
        const activeQuest = this.player.activeQuests.find(q => q.questId === questId);
        if (!activeQuest) return false;

        const quest = this.getQuest(questId);
        activeQuest.currentStep++;

        // Check if the new step is an "obtain" type and player already has the item
        if (activeQuest.currentStep < quest.etapes.length) {
            const currentStep = quest.etapes[activeQuest.currentStep];
            if (currentStep.type === 'obtain' && currentStep.cible) {
                // Check if player already has the required item
                if (this.player.hasItem(currentStep.cible)) {
                    this.ui.log(`\n**[OBJECTIF DÉJÀ ACCOMPLI]** ${currentStep.description}`);
                    // Auto-advance since item is already in inventory
                    return this.advanceQuest(questId);
                }
                // Special check for DATAPAD_BROKEN as alternative
                if (questId === 'QUEST_01_FIRST_RUN' && currentStep.cible === 'DATAPAD_KEY' && this.player.hasItem('DATAPAD_BROKEN')) {
                    this.ui.log(`\n**[OBJECTIF DÉJÀ ACCOMPLI]** ${currentStep.description}`);
                    return this.advanceQuest(questId);
                }
            }
        }

        // Check if quest is complete
        if (activeQuest.currentStep >= quest.etapes.length) {
            this.completeQuest(questId);
        }

        return true;
    }

    completeQuest(questId) {
        // Remove from active
        this.player.activeQuests = this.player.activeQuests.filter(q => q.questId !== questId);
        
        // Add to completed
        this.player.completedQuests.push(questId);
        
        const quest = this.getQuest(questId);
        this.ui.log(`\n**[QUÊTE TERMINÉE]** ${quest.titre}`);
        
        let rewardModifier = 1.0;

        // Custom Logic for Quest 1 (Datapad)
        if (questId === 'QUEST_01_FIRST_RUN') {
             if (this.player.inventory.includes('DATAPAD_BROKEN')) {
                 rewardModifier = 0.5;
                 this.ui.log(`Gibson examine le datapad en miettes. "Bon sang, c'est inutilisable... Je te paie la moitié pour l'effort."`);
                 // Remove broken
                 const idx = this.player.inventory.indexOf('DATAPAD_BROKEN');
                 if (idx !== -1) this.player.inventory.splice(idx, 1);
             } else if (this.player.inventory.includes('DATAPAD_KEY')) {
                 // Remove intact
                 const idx = this.player.inventory.indexOf('DATAPAD_KEY');
                 if (idx !== -1) this.player.inventory.splice(idx, 1);
             }
        } else {
            // Generic Item Removal
            quest.etapes.forEach(step => {
                if (step.type === 'obtain' && step.cible) {
                    const index = this.player.inventory.indexOf(step.cible);
                    if (index !== -1) {
                        this.player.inventory.splice(index, 1);
                        this.ui.log(`[${step.cible} retiré de l'inventaire]`);
                    }
                }
            });
        }
        
        // Give rewards
        if (quest.recompenses.credits > 0) {
            const amount = Math.floor(quest.recompenses.credits * rewardModifier);
            this.player.addCredits(amount);
            this.ui.log(`Récompense : ${amount} crédits`);
        }
        
        if (quest.recompenses.items && quest.recompenses.items.length > 0) {
            quest.recompenses.items.forEach(itemId => {
                this.player.addItem(itemId);
                const item = this.world.getItem(itemId);
                this.ui.log(`Récompense : ${item ? item.nom : itemId}`);
            });
        }
    }

    async handleTalk(npcId) {
        const npc = this.world.getNPC(npcId);
        if (!npc) {
            this.ui.log("Cette personne ne veut pas parler.");
            return;
        }

        // Check for active quest steps involving this NPC
        let handled = false;
        
        for (const activeQuest of this.player.activeQuests) {
            const quest = this.getQuest(activeQuest.questId);
            const step = quest.etapes[activeQuest.currentStep];
            
            if (step.type === 'talk' && step.cible === npcId) {
                this.ui.log(`\n**${npc.nom}** :`);
                await this.ui.logTyped(`"${step.dialogue}"`, 25);
                this.advanceQuest(activeQuest.questId);
                handled = true;
                break;
            }
        }

        // Check for new quests from this NPC
        if (!handled) {
            const availableQuests = this.quests.filter(q => 
                q.donneur === npcId && this.canStartQuest(q.id)
            );

            if (availableQuests.length > 0) {
                const quest = availableQuests[0];
                this.ui.log(`\n**${npc.nom}** :`);
                await this.ui.logTyped(`"${quest.etapes[0].dialogue}"`, 25);
                this.startQuest(quest.id);
                this.advanceQuest(quest.id); // Auto-advance first step
                handled = true;
            }
        }

        // Default dialogue
        if (!handled) {
            this.ui.log(`\n**${npc.nom}** :`);
            await this.ui.logTyped(`"${npc.dialogue_initial}"`, 25);
        }
    }

    checkQuestProgress(eventType, target) {
        // Check if any active quest step is completed by this event
        for (const activeQuest of this.player.activeQuests) {
            const quest = this.getQuest(activeQuest.questId);
            const step = quest.etapes[activeQuest.currentStep];
            
            if (step.type === eventType) {
                 let match = false;
                 if (step.cible === target) match = true;
                 
                 // Special check for Datapad quest (accept broken version)
                 if (quest.id === 'QUEST_01_FIRST_RUN' && step.cible === 'DATAPAD_KEY' && target === 'DATAPAD_BROKEN') {
                     match = true;
                 }

                 if (match) {
                     this.ui.log(`\n**[OBJECTIF ACCOMPLI]** ${step.description}`);
                     this.advanceQuest(activeQuest.questId);
                 }
            }
        }
    }

    getActiveQuestsSummary() {
        if (this.player.activeQuests.length === 0) {
            return "Aucune quête active.";
        }

        let summary = "\n**[QUÊTES ACTIVES]**\n";
        this.player.activeQuests.forEach(aq => {
            const quest = this.getQuest(aq.questId);
            const step = quest.etapes[aq.currentStep];
            summary += `\n- ${quest.titre}\n`;
            summary += `  Objectif : ${step.description}\n`;
        });

        return summary;
    }
}
