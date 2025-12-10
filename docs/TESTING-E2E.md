# Tests E2E (Playwright)

## Prerequis
- Node.js 18+ installe localement.
- Acces reseau pour telecharger les dependances npm et les navigateurs Playwright (premiere utilisation uniquement).

## Installation
```bash
npm install
npx playwright install chromium
```

## Execution
```bash
# Mode headless
npm run test:e2e

# Mode visible (debug)
npm run test:e2e:headed
```

## Ce que couvrent les tests actuels
- Boot + LOAD depuis une sauvegarde de test pré-semée, commande `HELP`, puis cycle `SAVE`/`QUIT`/`LOAD` avec vérification des crédits persistés.
- Navigation: autocomplétion des commandes (TAB), lecture des sorties disponibles, déplacement et changement de coordonnées.
- Scénario critique: démarrage de la quête 1 avec Gibson, récupération du datapad, validation de la complétion, équipement d’une armure et vérification du HUD (stat ARMURE > 0), combat contre un drone jusqu’à la victoire.

## Fixtures
- Les tests injectent une sauvegarde déterministe en localStorage (`CRPK_SAVE_DATA`) avant le chargement de la page pour stabiliser le seed, placer Gibson + un ennemi + les objets nécessaires (datapad, crédits, armure, arme) dans la zone de départ. Voir `tests/e2e/basic.spec.js`.

## Details techniques
- Serveur statique: `tests/e2e/server.js` (port 4173) sert `index.html` et les assets locaux.
- Configuration: `playwright.config.js` (baseURL http://localhost:4173, timeout 60s).
- Scenario: `tests/e2e/basic.spec.js` couvre le boot + ecran titre + lancement de partie + commande `HELP` et assertion sur la sortie du log.

## Notes
- Si le boot/typing ralentit la suite, augmenter le timeout du test ou reduire la vitesse de frappe dans lapp pour les runs CI.
- Le serveur est tres simple (pas de compression/etag); suffisant pour des tests UI locaux.
