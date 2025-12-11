# 🎮 CYBRPK - Jeu d'Aventure Textuel Cyberpunk

## 📋 Vue d'Ensemble

**CYBRPK** est un jeu d'aventure textuel complet inspiré des RPG cyberpunk, développé en JavaScript vanilla avec une architecture modulaire. Le jeu combine génération procédurale, système de quêtes, combat tactique, et une interface terminal immersive.

---

## ✨ Fonctionnalités Principales

### 🌍 Monde Procédural
- **Génération par SEED** : Chaque partie crée un monde unique et déterministe
- **15+ zones connectées** : Exploration non-linéaire avec minimap dynamique
- **Garantie de jouabilité** : Tous les éléments critiques (NPCs, objets de quête, équipement) sont toujours présents
- **Fog of War** : Seules les zones visitées apparaissent sur la minimap
- **Validation automatique** : Commande DEBUG pour vérifier la génération

### ⚔️ Système de Combat
- **Mécanique D20** : Jets de dés + modificateurs de stats
- **Coups critiques** : Nat 20 = double dégâts
- **Équipement dynamique** : Armes (dégâts) et armures (protection)
- **PV du joueur** : Système de santé avec Game Over
- **Contre-attaques** : Les ennemis ripostent
- **Matching intelligent** : Reconnaissance partielle des noms d'ennemis

### 🎯 Système de Quêtes
- **Quêtes à étapes** : Talk, Obtain, Kill
- **Prérequis** : Certaines quêtes nécessitent d'en terminer d'autres
- **Récompenses** : Crédits et objets
- **Tracking automatique** : Vérification de progression en temps réel
- **Dialogues immersifs** : Effet de frappe pour les conversations

### 🎒 Gestion d'Inventaire
- **Équipement** : 3 slots (Arme, Tête, Corps)
- **Stats dynamiques** : Les équipements modifient FOR, AGI, PIR, ARM
- **Commandes** : EQUIP, UNEQUIP, INV
- **Affichage détaillé** : Équipement actuel + stats effectives + inventaire

### 💾 Sauvegarde/Chargement
- **localStorage** : Persistance entre sessions
- **Sauvegarde de la SEED** : Régénération exacte du monde
- **État complet** : Joueur, quêtes, position, équipement
- **Bouton LOAD** : S'active automatiquement si une sauvegarde existe

### 🎨 Interface Immersive
- **Écran de démarrage** : Boot sequence animée + Title screen avec logo ASCII
- **Menu d'aide** : Guide complet accessible depuis le title screen
- **HUD dynamique** : Avatar (style DOOM), PV, Stats, Minimap
- **Effet de frappe** : Texte qui s'affiche caractère par caractère (descriptions + dialogues)
- **Dégradation de luminosité** : Les anciennes lignes s'estompent progressivement (5 niveaux)
- **Curseur personnalisé** : █ clignotant qui suit la saisie du texte
- **Pas de sélection** : Texte non-sélectionnable (sauf input) pour effet terminal authentique

### ⌨️ Fonctionnalités Terminal
- **Historique de commandes** : ↑/↓ pour naviguer (50 dernières commandes)
- **Autocomplétion** : TAB pour compléter commandes, NPCs, objets, directions
- **Commandes multiples** : Alias (INV/I, ATTACK/KILL, TALK/SPEAK, etc.)
- **Matching partiel** : Reconnaissance intelligente des noms (ex: "GI" trouve "GIBSON")

---

## 🎮 Commandes Disponibles

| Commande | Alias | Description |
|----------|-------|-------------|
| `MOVE [DIR]` | `GO` | Se déplacer (NORD/SUD/EST/OUEST) |
| `LOOK` | - | Observer la zone actuelle |
| `TAKE [OBJET]` | `GET` | Ramasser un objet |
| `INVENTORY` | `INV`, `I` | Afficher inventaire et équipement |
| `EQUIP [OBJET]` | - | Équiper un objet |
| `UNEQUIP [SLOT]` | - | Déséquiper (ARME/TETE/CORPS) |
| `ATTACK [CIBLE]` | `KILL` | Attaquer un ennemi |
| `TALK [NPC]` | `SPEAK` | Parler à un PNJ |
| `QUESTS` | `QUEST`, `Q` | Voir les quêtes actives |
| `HACK [CIBLE]` | - | Pirater (mini-jeu placeholder) |
| `SAVE` | - | Sauvegarder la partie |
| `DEBUG` | - | Vérifier la génération du monde |
| `QUIT` | - | Retour au menu principal |
| `HELP` | - | Liste des commandes |

### 🎹 Raccourcis Clavier
- **↑/↓** : Naviguer dans l'historique des commandes
- **TAB** : Autocomplétion intelligente
- **ENTER** : Valider la commande
- **ESC** : Fermer l'écran d'aide

---

## 🗂️ Architecture du Projet

```
CRPK/
├── index.html              # Point d'entrée
├── css/
│   ├── variables.css       # Variables globales + imports de polices
│   ├── base.css            # Reset + effets globaux
│   ├── layout.css          # Grille principale + header
│   ├── terminal.css        # Terminal, output, input
│   ├── hud.css             # HUD, portrait, stats, minimap, audio
│   ├── screens.css         # Écrans titre/aide et overlays
│   ├── animations.css      # Animations et effets de combat
│   └── responsive.css      # Media queries
├── README.md              # Documentation complète
├── js/
│   ├── main.js            # Initialisation
│   ├── modules/
│   │   ├── Game.js        # Contrôleur principal + gestion d'état
│   │   ├── World.js       # Génération procédurale + validation
│   │   ├── Player.js      # État du joueur + équipement
│   │   ├── Combat.js      # Système de combat D20
│   │   ├── QuestManager.js # Gestion des quêtes + dialogues
│   │   ├── Hacking.js     # Mini-jeu hacking (placeholder)
│   │   └── UI.js          # Interface utilisateur + animations
│   └── utils/
│       ├── DataLoader.js  # Chargement JSON
│       ├── SaveManager.js # Sauvegarde/Chargement localStorage
│       └── SeededRandom.js # PRNG déterministe (Mulberry32)
├── data/
│   ├── zones.json         # Templates de zones
│   ├── pnj.json          # Définitions des NPCs
│   ├── items.json        # Objets du jeu
│   └── quests.json       # Quêtes disponibles
└── img/
    ├── face_healthy.png   # Avatar PV > 50%
    ├── face_hurt.png      # Avatar PV 25-50%
    └── face_critical.png  # Avatar PV < 25%
```

---

## 🎯 Quêtes Disponibles

### 1. Premier Boulot
- **Donneur** : Gibson, le Puceur
- **Objectif** : Récupérer un datapad volé dans la ruelle
- **Récompense** : 200 crédits

### 2. Chasse au Corpo
- **Donneur** : Gibson
- **Prérequis** : Premier Boulot
- **Objectif** : Éliminer un agent corporatiste
- **Récompense** : 500 crédits + Pistolet 9mm

---

## 🛠️ Technologies Utilisées

- **JavaScript ES6+** : Modules, async/await, classes
- **HTML5 Canvas** : Minimap et mini-jeu hacking
- **CSS3** : Animations, transitions, flexbox, grid
- **localStorage API** : Persistance des données
- **Google Fonts** : VT323 (police monospace rétro)

---

## 🚀 Lancement du Jeu

1. Ouvrir `index.html` dans un navigateur moderne
2. Attendre la séquence de boot animée
3. Sur l'écran titre :
   - Cliquer sur **START** ou appuyer sur **ENTER** pour nouvelle partie
   - Cliquer sur **LOAD** pour charger une sauvegarde (si disponible)
   - Cliquer sur **HELP** pour voir le guide complet
4. Taper `HELP` en jeu pour voir les commandes

---

## 🎨 Design Principles

### Vocabulaire
- ❌ **Évité** : Termes clichés (néon, nexus, abîme, écho, vestiges, murmures, etc.)
- ✅ **Utilisé** : Langage concret, direct et pragmatique

### Esthétique
- **Terminal authentique** : Vert phosphorescent (#00FF41), scanlines, glow effects
- **Feedback visuel** : Dégradation de luminosité, curseur clignotant qui suit le texte
- **Immersion maximale** : Effet de frappe, historique de commandes, autocomplétion
- **Pas de sélection** : Interface non-sélectionnable comme un vrai terminal

### UX
- **Guidage progressif** : Menu d'aide, messages d'erreur clairs, autocomplétion
- **Feedback constant** : HUD mis à jour en temps réel, avatar dynamique
- **Accessibilité** : Raccourcis clavier, matching partiel des noms

---

## 📊 Statistiques du Projet

- **Lignes de code** : ~3500+ lignes
- **Modules JavaScript** : 10 fichiers
- **Fichiers de données** : 4 JSON
- **Commandes** : 14 commandes principales + 8 alias
- **Zones générées** : 15-16 par partie
- **Vitesse de frappe** : 15ms (descriptions) / 25ms (dialogues)
- **Niveaux de fade** : 5 niveaux de dégradation de luminosité
- **Historique** : 50 commandes mémorisées

---

## 🎮 Guide de Jeu

### Démarrage
1. Parlez à **Gibson** dans la zone de départ (`TALK GIBSON`)
2. Acceptez la première quête
3. Explorez le monde (`MOVE NORD/SUD/EST/OUEST`)
4. Consultez la minimap et le HUD pour vous orienter

### Combat
1. Trouvez un ennemi (`LOOK` pour voir les entités)
2. Attaquez (`ATTACK DROIDE` ou `ATTACK DRONE`)
3. Équipez des armes pour plus de dégâts
4. Équipez des armures pour réduire les dégâts reçus
5. Surveillez vos PV sur le HUD

### Progression
1. Complétez les quêtes pour gagner des crédits
2. Ramassez des objets (`TAKE [OBJET]`)
3. Équipez-vous (`EQUIP [OBJET]`)
4. Sauvegardez régulièrement (`SAVE`)

---

## 🔮 Améliorations Futures Possibles

- [ ] Plus de quêtes et d'arcs narratifs
- [ ] Mini-jeu hacking interactif complet
- [ ] Système de compétences et progression XP
- [ ] Commerce avec marchands
- [ ] Factions et réputation
- [ ] Boss fights avec mécaniques spéciales
- [ ] Musique et effets sonores
- [ ] Mode multijoueur (partage de SEED)
- [ ] Crafting et amélioration d'équipement
- [ ] Événements aléatoires

---

## 📝 Notes de Développement

### Génération Procédurale
- **Algorithme** : Random Walk pour créer un graphe de zones connectées
- **PRNG** : Mulberry32 (déterministe, même SEED = même monde)
- **Validation** : `ensureQuestCompletability()` garantit la présence de tous les éléments critiques
- **Éléments garantis** : Gibson (quest giver), ennemis, datapad, armes, armures

### Performance
- Pas de framework lourd (vanilla JS)
- Animations CSS hardware-accelerated
- Pas de re-render inutile
- Gestion efficace de l'historique (limite 50)

### Compatibilité
- Navigateurs modernes (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+)
- Pas de dépendances externes
- Fonctionne en local (pas de serveur requis)
- localStorage requis pour la sauvegarde

### Accessibilité
- Texte lisible (VT323, taille 1.2rem)
- Contraste élevé (vert sur noir)
- Raccourcis clavier
- Messages d'erreur explicites
- Guide intégré

---

## 🐛 Dépannage

### Le curseur ne suit pas le texte
- Vérifiez que JavaScript est activé
- Rechargez la page (F5)

### La sauvegarde ne fonctionne pas
- Vérifiez que localStorage n'est pas désactivé
- Vérifiez l'espace disponible (quota localStorage)

### Le monde semble impossible à compléter
- Utilisez la commande `DEBUG` pour vérifier
- Si "Monde jouable: NON", tapez `QUIT` puis `START` pour régénérer

### L'autocomplétion ne fonctionne pas
- Assurez-vous d'être dans la zone de saisie
- Tapez au moins 1-2 caractères avant TAB

---

## 👨‍💻 Crédits

Développé avec ❤️ en utilisant :
- Architecture modulaire ES6
- Génération procédurale déterministe
- Design inspiré des terminaux Unix/DOS et VT100
- Esthétique cyberpunk années 80-90
- Mécanique de combat inspirée de D&D

---

## 📜 Licence

Projet éducatif et démonstratif.

---

**Version** : 1.0.0  
**Date** : Décembre 2024  
**Statut** : ✅ Complet et jouable  
**Dernière mise à jour** : 10 décembre 2024
