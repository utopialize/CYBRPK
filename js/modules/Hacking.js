export class Hacking {
    constructor(ui, player) {
        this.ui = ui;
        this.player = player;
        this.active = false;
        this.ctx = ui.getCanvasContext();
        this.canvas = ui.getCanvas();
    }

    startHack(targetNameOrId, onSuccessCallback) {
        if (!targetNameOrId) {
            this.ui.log("QUOI PIRATER ? (HACK [Système])");
            return;
        }

        this.ui.log(`Tentative de piratage du système ${targetNameOrId}...`);
        this.ui.setHackingMode(true);
        this.active = true;

        this.runMinigame(targetNameOrId, onSuccessCallback);
    }

    runMinigame(targetId, onSuccess) {
        if (!this.ctx) return;

        // Visuals
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#0a0';
        this.ctx.font = "20px Courier New";
        this.ctx.fillText("HACKING IN PROGRESS...", 50, 50);

        // Simulation
        // In a real game, this would be an interactive loop
        setTimeout(() => {
            const success = Math.random() > 0.3;
            this.finishHack(success, 'DATAPAD_KEY', onSuccess);
        }, 3000);
    }

    finishHack(success, lootId, onSuccess) {
        this.active = false;
        this.ui.setHackingMode(false);
        this.ui.clearInput();

        if (success) {
            this.ui.log(`\n**PIRATAGE RÉUSSI !** Accès au système ${lootId} accordé.`);
            this.player.addItem(lootId);
            if (onSuccess) onSuccess();
        } else {
            this.ui.log("\n[ALERTE SYSTÈME] : Le piratage a échoué. Retour au terminal.");
        }
    }
}
