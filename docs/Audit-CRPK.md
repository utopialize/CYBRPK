# Audit CRPK (CyberPunk Runner Protocol Kit)

## 1. Synthese Globale (Note: B-)
- Modulaire et full client-side conforme (localStorage, aucune dependance externe), mais absence de garde-fous sur la coherence de donnees et lUI.
- Bloquant gameplay: quete 2 cible un PNJ inexistant -> progression impossible.
- Risques UX/perf: log HTML non filtre et sans limite (bloat DOM, injection potentielle), aleatoire non unifie (seed non respecte en combat/hack).

## 2. Analyse Architecturale (Note: C+)
- SoC partielle: Game orchestre mais appelle directement UI a chaque etape; pas de couche evenementielle ni de store centralise pour GAME_STATE.
- Dependance globale (window.SaveManager) et passage par references nues (player/world) sans invariants ni DTO entre modules.
- Modules clairs (World, Player, Combat, QuestManager, UI) mais contrats implicites et peu de garde-fous (validations, schemas, versioning).

## 3. Analyse Systemes Clefs (Note: C)
- Generation: SeededRandom pour le monde, ensureQuestCompletability couvre Gibson/loot mais ne valide pas la presence de lNPC de quete 2 (AGENT_CORPO absent), donc monde non terminable.
- Combat/Hacking: utilisent Math.random (non seed), deconnectant la reproductibilite du seed global.
- UI/DOM: log() injecte innerHTML sur linput utilisateur et aucune retention policy -> accumulation et risque XSS; typing effect non court-circuitable (peut accumuler des awaits si spam commandes).
- Persistance: save/load JSON brut sans validation de schema ni compatibilite de version; restauration du monde/joueur sans checks.

## 4. Recommandations Immediates (Priorite 1)
1) Fix quete 2: ajouter PNJ AGENT_CORPO (type ennemi) et garantir son placement, ou re-pointer la cible sur un ennemi existant (data/pnj.json, data/quests.json, World.ensureQuestCompletability).
2) Securiser et borner le log: filtrer ou escapade des entrees joueur (pas de innerHTML direct), limiter le nombre de lignes (prune FIFO) pour eviter le bloat DOM (UI.log/processInput).
3) De-corriger les globals/etat: injecter SaveManager/UI plutot que window.*, introduire un petit facade state (getters/setters) pour player/world afin de controler lacces et faciliter les tests.

## 5. Optimisations Possibles (Priorite 2)
1) Unifier laleatoire via SeededRandom pour combat/hacking/loot afin de rendre le seed deterministe et debuggable.
2) Ajouter validation/schema et versioning du save (avec fallback ou reset partiel si data invalide).
3) Debouncer ou limiter les effets UI (typing, HUD/minimap refresh) pour eviter les files dawait en cas de spam commande.

## 6. Ameliorations Potentielles (Priorite 3)
- Tests de coherence data (quete cible existante/generable) + unitaires simples World/QuestManager.
- Support des quetes a compteur (champ count ignore aujourd hui) et dialogues conditionnels.
- Ajouter les alias INV/I dans le resolver pour alignement UX avec README et UI.
- Isoler la narration/FX (log visuel) de la logique Combat/Hacking pour pouvoir faire tourner le moteur sans DOM (tests/headless).
- Preparer un mode headless/PWA en abstrahant les IO (input/output service) afin de reutiliser le moteur sur mobile ou offline packaging.
