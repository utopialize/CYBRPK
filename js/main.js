import { Game } from './modules/Game.js';
import { SaveManager } from './utils/SaveManager.js';

// Expose SaveManager globally for UI
window.SaveManager = SaveManager;

window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();

    const inputField = document.getElementById('command-input');
    
    if (inputField) {
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const input = inputField.value.trim();
                inputField.value = '';
                if (input) {
                    game.processInput(input);
                }
            }
        });
        inputField.focus();
    }
});
