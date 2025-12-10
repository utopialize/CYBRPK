# Audit UX / Gameplay — CRPK (CyberPunk Runner Protocol Kit)

## 1. Synthese Globale UX/Gameplay (Note: B-)
- Immersion cyber-terminal bien posée (boot, title, HUD) mais le vocabulaire ONI-Shell/Opérateur/Agent reste peu exploité en jeu et dans le log principal.
- Lisibilité correcte (HUD clair, minimap lisible) mais l’absence de fade réel sur les logs rend la promesse de “dégradation de luminosité” non tenue.
- Rythme ralenti par l’effet de frappe et les séquences de combat très verbeuses; bonne dramaturgie mais friction en exploration rapide.
- Boucle exploration → quête → récompense → équipement → combat fonctionnelle mais fragile (quête 2 injouable) et l’équipement n’est pas toujours mis en avant immédiatement via l’UI.

## 2. Analyse de l’Interface et du Lore (ONI-Shell) (Note: C+)
- Terminologie ONI-Shell/Ghost Link peu présente: écrans boot/title/HUD parlent “CYBRPK” mais le log ne justifie pas qu’il est le flux capteur de l’Agent; pas d’adresse explicite à l’“Opérateur”.
- Focus visuel: prompt et dernière ligne lisibles, HUD contrasté; pas de vraie gradation d’intensité des logs (classe `.log-line` non utilisée) donc l’effet annoncé n’est pas visible.
- HUD: PV/credits/minimap visibles en un coup d’œil; l’inventaire intégré est intuitif, mais l’état de position (coords) reste discret et non relié au lore (secteur ONI).
- Autocomplétion: commandes/directions/PNJ/objets pris en compte; pas de suggestions de quêtes actives ni d’indices contextuels; la Tab nécessite parfois un clic sur suggestion (friction).

## 3. Analyse du Rythme et des Systemes d’Action (Note: C+)
- Effet de frappe: 10–25 ms/caractère sur description/dialogue; acceptable pour l’intro mais répétitif, sans “skip/fast-forward”, ce qui casse le flow en combat/exploration.
- Combats/hacking: séquences textuelles riches (jets de dés, écrans “VICTOIRE”), mais longues; l’usage de Math.random non lié au seed casse la cohérence roguelike.
- Progression: la boucle fonctionne sur la quête 1, mais l’équipement gagné n’est pas immédiatement mis en exergue (pas de highlight dans le HUD ni de rappel d’usage). Quête 2 bloquée (cible absente) casse la rejouabilité.

## 4. Recommandations de Design (3 points)
1) Ajouter un mode “fast text” (toggle ou touche) pour court-circuiter l’effet de frappe et accélérer les séquences de combat/hacking; réduire le nombre de lignes par action pour les combats communs.
2) Rendre l’inventaire/hud réactif aux gains d’équipement: highlight temporaire sur slot mis à jour, toast court “Nouvel équipement disponible” et suggestion d’`EQUIP [nom]`.
3) Étendre l’autocomplétion aux quêtes actives et aux cibles contextuelles (objectifs en cours), et offrir la complétion directe sans clic (Tab → première suggestion) pour réduire la friction.

## 5. Recommandations d’Amelioration du Lore (3 points)
1) Cohérence terminologique: préfixer le log d’un marqueur “AGENT FEED” / “ONI-Shell uplink” et adresser le joueur comme “Opérateur” dans les messages système et le boot.
2) Justifier la minimap et les coords comme télémétrie de l’Agent; afficher le secteur `[x,y]` dans le header avec un label “Link: Ghost Channel”.
3) Pour un futur fast-travel/JUMP, l’ancrer comme “Saut neuronal” avec coût (décalage de perception, risque de désync) et message de confirmation dans le ton ONI.
