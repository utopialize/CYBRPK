👻 Protocole "Ghost Link" : Plan d'Implémentation
=================================================

Le but est de transformer l'expérience de l'utilisateur qui tape des commandes en celle d'un **Opérateur** contrôlant un **Agent** (le Runner) via une **Interface Neuronale (ONI-Shell)**.

I. Étape 1 : Séquence de Boot (Établissement du Lien)
-----------------------------------------------------

L'écran de *boot* existant (`image_cf21db.jpg`) doit être renommé et son contenu mis à jour pour simuler la connexion cérébrale.

| **Élément** | **Action à Mener** | **Nouvelles Valeurs / Texte** |
| --- | --- | --- |
| **Nom du Système** | Mise à jour du titre initial. | `CYBRPK ONI-SHELL V2.077` |
| **Séquence de Messages** | Remplacer la terminologie "Système" par "Lien Neuronal". | 1\. `PROTOCOLE D'ACCÈS NEURONAL INITIÉ...` |
|  |  | 2\. `CALIBRATION ONI-SHELL... CHARGEMENT DES PILOTES...` |
|  |  | 3\. `TENTATIVE DE LIAISON AVEC LE RÉSEAU NOIR...` |
|  | **Message de Fin** | `SYNCHRONISATION TERMINÉE. LIAISON PRÊTE. PRESS ENTER TO LOAD INTERFACE` |
| **Module(s) concerné(s)** | `UI.js` (fonction `displayBootSequence`) |  |

II. Étape 2 : Écran Titre (Menu de Connexion de l'Opérateur)
------------------------------------------------------------

L'écran titre (`image_cf1ed2.jpg`) devient le **Menu de Connexion de l'Opérateur** pour choisir la session d'Agent.

| **Élément** | **Action à Mener** | **Nouvelle Terminologie** |
| --- | --- | --- |
| **Titre/Sous-Titre** | Ajouter le contexte de l'Interface Neuronale. | `CYBRPK: Cyber Runner Protocol Kit` (Glow) |
|  |  | **`INTERFACE NEURONALE ONI-SHELL V2.0`** |
| **Option "New Game"** | Renommer la commande de début. | **`► INITIATION D'UN NOUVEAU LIEN (New Agent)`** |
| **Option "Load Game"** | Renommer la commande de chargement. | **`► REPRISE DE LIEN PERSISTANT (Load Last Session)`** |
| **Commande d'Entrée** | S'assurer que le prompt final est lié à l'Opérateur. | `Opérateur, veuillez choisir ou saisir une commande.` |
| **Module(s) concerné(s)** | `index.html` (pour le texte) et `Game.js` (pour les commandes `START`/`LOAD`). |  |

III. Étape 3 : Écran de Jeu (Flux de Données de l'Agent)
--------------------------------------------------------

L'interface principale (`image_cf1eb3.jpg` et `image_dda731.jpg`) est le flux de données en temps réel de l'Agent vers l'Opérateur.

| **Élément** | **Action à Mener** | **Nouvelle Terminologie / Rôle** |
| --- | --- | --- |
| **Log Principal** | Justification de l'**Effet de Frappe** et de la **Dégradation de Luminosité**. | Représente le **FLUX DE DONNÉES EN TEMPS RÉEL** de l'Agent (le plus récent est clair, l'historique s'estompe en mémoire tampon). |
| **Barre Supérieure** | `SECTEUR` devient le lieu de l'Agent. Les crédits restent la ressource du Runner. | **`SECTEUR: RUELLLE HUMIDE [0,0]`** |
| **`STATUS AGENT` (HUD)** | L'avatar et les barres représentent l'état du *corps* de l'Agent. | **`INTÉGRITÉ SYSTÈME`** (PV) : État du corps de l'Agent. |
| **Stats (FOR/AGI/HACK)** | Les stats représentent la qualité du *Calibrage* ou des *Implants* de l'Agent. | Statistique conservée, mais justification dans le lore. |
| **Audio Link** | Renommer le lecteur audio. | **`LIEN NEURONAL AUDIO`** (Bruit de fond du réseau). |
| **Commande `QUIT`** | Justification de la déconnexion. | `QUIT` simule une **DÉCONNEXION D'URGENCE**. Le log affiche un message de perte de signal. |
| **Combat/Hacking** | Justification des commandes d'action (Voir Section IV). | Utilisation du préfixe **`[PROTOCOLE]`** dans les messages système. |
| **Module(s) concerné(s)** | `UI.js`, `Game.js`, `Combat.js`, `Hacking.js`. |  |

IV. Terminologie pour les Actions (Exemples de Messages)
--------------------------------------------------------

Ces changements doivent être appliqués dans les messages système dans `Combat.js` et `Hacking.js`.

| **Action** | **Ancien Message** | **Nouveau Message Immersif (Exemple)** |
| --- | --- | --- |
| **Mouvement** | `MOVE NORD` | `[PROTOCOLE D'ORIENTATION] Activation du déplacement NORD...` |
| **Attaque** | `[COMBAT ENGAGÉ]` | `[PROTOCOLE D'ENGAGEMENT ACTIVÉ]` |
| **Hacking** | `Lancement du mini-jeu...` | `[SHELL INJECTION EN COURS] L'Opérateur prend le contrôle direct.` |
| **Dégâts subis** | `IMPACT SUR VOUS` | `[FLUX CORROMPU] DONNÉES DE DÉGÂTS REÇUES PAR L'AGENT` |

En suivant ce plan, vous vous assurez que chaque élément visuel et interactif a désormais une justification forte et cohérente avec le lore du **Protocole "Ghost Link"**.