# CYBRPK — Charte Graphique UI
## Document de Référence pour Implémentation

**Version:** 1.0  
**Style:** Neon Brutalist (Hybride Holographic + Street)  
**Date:** Décembre 2024

---

## 1. IDENTITÉ VISUELLE

### 1.1 Concept Directeur

Le style "Neon Brutalist" fusionne deux esthétiques :

- **Holographic Datastream** : Futuriste, lumineux, effets de glow, sophistiqué
- **Brutal Street** : Raw, high-contrast, agressif, sans compromis

**Résultat recherché** : Une interface qui évoque à la fois la high-tech des mégacorporations et l'énergie underground des rues cyberpunk. Clean mais punchy. Lumineux mais dangereux.

### 1.2 Mots-clés Esthétiques

```
À RECHERCHER : brutal, lumineux, contrasté, direct, immersif, tendu, dangereux
À ÉVITER : générique, fade, arrondi, soft, corporate-clean, Material Design
```

---

## 2. PALETTE DE COULEURS

### 2.1 Couleurs Principales (CSS Variables)

```css
:root {
    /* Couleurs primaires */
    --primary: #00ffaa;           /* Cyan-vert lumineux - texte principal, accents positifs */
    --primary-dim: #00aa77;       /* Version atténuée pour bordures secondaires */
    --accent: #ff0050;            /* Rouge vif - accents forts, alertes, énergie */
    --accent-glow: rgba(255, 0, 80, 0.6);  /* Glow du rouge */

    /* Backgrounds */
    --bg-dark: #0a0a0f;           /* Fond principal - presque noir avec teinte bleue */
    --bg-panel: #0d0d14;          /* Panneaux HUD */
    --bg-terminal: #08080c;       /* Zone terminal - plus sombre */

    /* Bordures et séparateurs */
    --border: #1a1a25;            /* Bordures subtiles */
    --border-accent: var(--accent); /* Bordures importantes - 3px rouge */

    /* Texte */
    --text: #c0c0d0;              /* Texte standard */
    --text-dim: #606075;          /* Texte secondaire, labels */
    --text-bright: #ffffff;       /* Texte important, titres */

    /* Couleurs sémantiques */
    --color-hp: linear-gradient(90deg, var(--accent), var(--primary));
    --color-entity: #ffaa00;      /* Entités/NPCs - orange */
    --color-object: #00aaff;      /* Objets - bleu */
    --color-exit: var(--primary); /* Sorties - cyan */
    --color-quest: #ffaa00;       /* Quêtes - orange */
    --color-damage: var(--accent); /* Dégâts - rouge */
    --color-heal: #00ff88;        /* Soins - vert */
}
```

### 2.2 Règles d'Utilisation des Couleurs

| Élément | Couleur | Justification |
|---------|---------|---------------|
| Fond principal | `--bg-dark` | Base sombre pour contraste |
| Texte terminal | `--primary` | Tradition CRT, lisibilité |
| Bordures actives | `--accent` (3px) | Énergie brutale, focus |
| Bordures passives | `--border` (1px) | Structure sans distraction |
| Titres de zone | `--text-bright` | Hiérarchie claire |
| Descriptions | `--text-dim` | Secondaire, atmosphère |
| Actions/Commandes | `--primary` | Affordance, cliquable |
| Alertes/Dégâts | `--accent` | Urgence, danger |

---

## 3. TYPOGRAPHIE

### 3.1 Familles de Polices

```css
/* Import Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=Syncopate:wght@400;700&family=Rajdhani:wght@300;400;500;600;700&family=VT323&display=swap');
```

### 3.2 Hiérarchie Typographique

| Niveau | Police | Taille | Poids | Usage |
|--------|--------|--------|-------|-------|
| Logo | Black Ops One | 36px | normal | Logo "CYBRPK" uniquement |
| H1 - Titre zone | Black Ops One | 22px | normal | Noms de zones |
| H2 - Section HUD | Syncopate | 9-11px | 700 | Titres de sections ("STATUS", "NAVIGATION") |
| Stats valeurs | Black Ops One | 28px | normal | Chiffres des stats (FOR, AGI, etc.) |
| Stats labels | Syncopate | 8px | 700 | Labels sous les stats |
| Terminal output | Share Tech Mono | 15px | normal | Texte principal du terminal |
| Terminal input | Share Tech Mono | 16px | normal | Zone de saisie |
| Labels info | Syncopate | 9px | 700 | "SORTIES DISPONIBLES", "ENTITÉS" |
| Body text | Rajdhani | 14-16px | 400-500 | Texte général si besoin |
| Coordonnées | Share Tech Mono | 11px | normal | [0,2], timestamps |

### 3.3 Règles Typographiques

```css
/* Letter-spacing par police */
.logo { letter-spacing: -1px; }           /* Black Ops One : serré */
.section-title { letter-spacing: 3px; }   /* Syncopate : très espacé */
.terminal { letter-spacing: 0; }          /* Share Tech Mono : normal */
.label { letter-spacing: 2px; }           /* Labels : espacé */

/* Text-transform */
.section-title { text-transform: uppercase; }
.label { text-transform: uppercase; }
.terminal-output { text-transform: none; }  /* Préserver la casse */

/* Line-height */
.terminal-output { line-height: 1.8; }
.description { line-height: 1.6; }
.stats { line-height: 1; }
```

---

## 4. LAYOUT ET STRUCTURE

### 4.1 Grille Principale (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│                        HEADER                                │
│  [LOGO]              [LOCATION]              [CREDITS]       │
├─────────────────────────────────────────────┬───────────────┤
│                                             │               │
│                                             │    STATUS     │
│                                             │   (Portrait)  │
│                                             │      HP       │
│               TERMINAL                      │    Stats      │
│                                             ├───────────────┤
│            (Output zone)                    │  NAVIGATION   │
│                                             │   (Minimap)   │
│                                             ├───────────────┤
│                                             │  ÉQUIPEMENT   │
│                                             │    Slots      │
├─────────────────────────────────────────────┤   Inventaire  │
│              [SUGGESTIONS]                  ├───────────────┤
├─────────────────────────────────────────────┤   MISSION     │
│  ▶ [INPUT________________________]█         │   (Quest)     │
└─────────────────────────────────────────────┴───────────────┘
```

### 4.2 CSS Grid Implementation

```css
.game-container {
    display: grid;
    grid-template-columns: 1fr 300px;
    grid-template-rows: auto 1fr;
    gap: 3px;                          /* Gap coloré en --accent */
    background: var(--accent);         /* Le gap DEVIENT la bordure rouge */
    max-width: 1400px;
    margin: 0 auto;
    padding: 15px;
    min-height: 100vh;
}

.header {
    grid-column: 1 / -1;               /* Header full-width */
}

.terminal {
    /* Colonne gauche, row 2 */
}

.hud {
    display: flex;
    flex-direction: column;
    gap: 3px;                          /* Même gap rouge entre sections */
}
```

### 4.3 Layout Mobile (< 900px)

```css
@media (max-width: 900px) {
    .game-container {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto 1fr;
    }

    .hud {
        order: 2;                      /* HUD passe AU-DESSUS du terminal */
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 3px;
    }

    .hud-section:first-child {
        grid-column: 1 / -1;           /* Status full-width */
    }

    .terminal {
        order: 3;
        min-height: 50vh;
    }

    .stats-grid {
        grid-template-columns: repeat(4, 1fr);  /* Stats en ligne */
    }
}

@media (max-width: 500px) {
    .hud {
        grid-template-columns: 1fr;    /* HUD en colonne */
    }
}
```

---

## 5. COMPOSANTS UI

### 5.1 Header

```css
.header {
    background: var(--bg-panel);
    padding: 15px 25px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
}

/* Ligne dégradée en bas du header */
.header::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--accent), var(--primary), var(--accent));
}
```

**Logo avec effet dual-color :**
```css
.logo {
    font-family: 'Black Ops One', cursive;
    font-size: 36px;
    background: linear-gradient(135deg, var(--primary) 0%, #00ffff 50%, var(--primary) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 20px rgba(0, 255, 170, 0.5));
}

/* Overlay rouge sur la moitié supérieure */
.logo::after {
    content: 'CYBRPK';
    position: absolute;
    top: 0;
    left: 0;
    background: linear-gradient(135deg, var(--accent) 0%, #ff4488 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
}
```

### 5.2 Terminal

**Structure :**
```html
<main class="terminal">
    <div class="terminal-header">
        <div class="status-dot"></div>
        <span class="terminal-title">TERMINAL ACTIF</span>
        <span class="terminal-coords">[0,2]</span>
    </div>
    <div class="output">
        <!-- Contenu généré -->
    </div>
    <div class="suggestions">
        <!-- Suggestions cliquables -->
    </div>
    <div class="input-area">
        <span class="prompt">▶</span>
        <input type="text" class="input">
        <div class="cursor"></div>
    </div>
</main>
```

**Zone de header avec indicateur :**
```css
.terminal-header {
    padding: 10px 20px;
    background: rgba(0, 255, 170, 0.05);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 10px;
}

.status-dot {
    width: 8px;
    height: 8px;
    background: var(--primary);
    box-shadow: 0 0 10px var(--primary);
    animation: pulse 2s ease-in-out infinite;
}
```

**Zone d'output :**
```css
.output {
    flex: 1;
    padding: 25px;
    overflow-y: auto;
    font-family: 'Share Tech Mono', monospace;
    font-size: 15px;
    line-height: 1.8;
}
```

**Zone d'input avec bordure accent :**
```css
.input-area {
    padding: 15px 20px;
    background: rgba(0, 0, 0, 0.5);
    border-top: 2px solid var(--accent);  /* Bordure rouge importante */
    display: flex;
    align-items: center;
    gap: 12px;
}

.prompt {
    font-family: 'Black Ops One', cursive;
    font-size: 20px;
    color: var(--accent);
    text-shadow: 0 0 10px var(--accent-glow);
}

.cursor {
    width: 10px;
    height: 20px;
    background: var(--primary);
    animation: blink 1s step-end infinite;
    box-shadow: 0 0 10px var(--primary);
}
```

### 5.3 Affichage des Zones

**Header de zone :**
```css
.zone-header {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid var(--accent);  /* Ligne rouge */
}

.zone-icon {
    width: 40px;
    height: 40px;
    background: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    clip-path: polygon(10% 0, 100% 0, 90% 100%, 0 100%);  /* Forme angulaire */
}

.zone-title {
    font-family: 'Black Ops One', cursive;
    font-size: 22px;
    color: var(--text-bright);
    text-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
}

.zone-sector {
    font-family: 'Syncopate', sans-serif;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--accent);
    background: rgba(255, 0, 80, 0.1);
    padding: 4px 12px;
    margin-left: auto;
}
```

**Descriptions :**
```css
.description {
    color: var(--text-dim);
    margin-bottom: 25px;
    padding-left: 15px;
    border-left: 2px solid var(--border);  /* Ligne verticale subtile */
}
```

**Blocs d'information (sorties, entités, objets) :**
```css
.info-label {
    font-family: 'Syncopate', sans-serif;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--text-dim);
    margin-bottom: 5px;
}

/* Sorties - cyan, cliquables */
.exits span {
    display: inline-block;
    padding: 3px 10px;
    background: rgba(0, 255, 170, 0.1);
    border: 1px solid rgba(0, 255, 170, 0.3);
    color: var(--primary);
    margin-right: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.exits span:hover {
    background: rgba(0, 255, 170, 0.2);
    box-shadow: 0 0 15px rgba(0, 255, 170, 0.3);
}

/* Entités - orange avec bordure gauche */
.entities span {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 5px 12px;
    background: rgba(255, 170, 0, 0.1);
    border-left: 3px solid #ffaa00;
    color: #ffaa00;
}

/* Objets - bleu avec bordure gauche */
.objects span {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 5px 12px;
    background: rgba(0, 170, 255, 0.1);
    border-left: 3px solid #00aaff;
    color: #00aaff;
}
```

### 5.4 Suggestions/Autocomplétion

```css
.suggestions {
    padding: 10px 20px;
    background: rgba(255, 0, 80, 0.05);
    border-top: 1px solid var(--border);
    font-family: 'Share Tech Mono', monospace;
    font-size: 12px;
}

.suggestion-item {
    display: inline-block;
    padding: 3px 10px;
    background: rgba(0, 0, 0, 0.3);
    margin: 3px;
    color: var(--primary);
    cursor: pointer;
    transition: all 0.2s;
}

.suggestion-item:hover {
    background: var(--primary);
    color: var(--bg-dark);
}
```

### 5.5 Sections HUD

**Conteneur de section :**
```css
.hud-section {
    background: var(--bg-terminal);
    padding: 20px;
    position: relative;
}

/* Ligne accent sur le côté gauche */
.hud-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
    background: linear-gradient(180deg, var(--accent), transparent);
}

.section-title {
    font-family: 'Syncopate', sans-serif;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 3px;
    color: var(--accent);
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
}

/* Ligne qui s'étend après le titre */
.section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--accent), transparent);
}
```

### 5.6 Portrait du Joueur

**Structure avec cadre animé :**
```html
<div class="portrait-container">
    <div class="portrait-frame">
        <div class="portrait-corner-bl"></div>
        <div class="portrait-corner-br"></div>
        <div class="portrait">
            <!-- Image ou emoji placeholder -->
            <span class="portrait-label">RUNNER</span>
        </div>
    </div>
</div>
```

```css
.portrait-frame {
    position: relative;
    padding: 8px;
}

/* Coins animés - 4 éléments positionnés */
.portrait-frame::before,
.portrait-frame::after,
.portrait-corner-bl,
.portrait-corner-br {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border: 2px solid var(--primary);
}

.portrait-frame::before { top: 0; left: 0; border-right: none; border-bottom: none; }
.portrait-frame::after { top: 0; right: 0; border-left: none; border-bottom: none; }
.portrait-corner-bl { bottom: 0; left: 0; border-right: none; border-top: none; }
.portrait-corner-br { bottom: 0; right: 0; border-left: none; border-top: none; }

/* Animation de pulse avec changement de couleur */
@keyframes cornerPulse {
    0%, 100% { 
        border-color: var(--primary);
        filter: drop-shadow(0 0 5px var(--primary));
    }
    50% { 
        border-color: var(--accent);
        filter: drop-shadow(0 0 10px var(--accent));
    }
}

.portrait-frame::before { animation: cornerPulse 2s ease-in-out infinite; }
.portrait-frame::after { animation: cornerPulse 2s ease-in-out infinite 0.5s; }
.portrait-corner-bl { animation: cornerPulse 2s ease-in-out infinite 1s; }
.portrait-corner-br { animation: cornerPulse 2s ease-in-out infinite 1.5s; }

.portrait {
    width: 100px;
    height: 100px;
    background: linear-gradient(135deg, #1a2a20 0%, #0d1510 100%);
    border: 3px solid var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
}

/* Effet de shine qui traverse */
.portrait::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    animation: portraitShine 3s ease-in-out infinite;
}

.portrait-label {
    position: absolute;
    bottom: -1px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--accent);
    color: #fff;
    font-family: 'Syncopate', sans-serif;
    font-size: 7px;
    font-weight: 700;
    padding: 2px 12px;
    letter-spacing: 2px;
}
```

### 5.7 Barre de PV

```css
.hp-bar-outer {
    height: 12px;
    background: #111;
    position: relative;
    clip-path: polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%);  /* Angles coupés */
}

.hp-bar-inner {
    height: 100%;
    width: 75%;  /* Valeur dynamique */
    background: linear-gradient(90deg, var(--accent), var(--primary));
    position: relative;
    transition: width 0.5s ease;
    clip-path: polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%);
}

/* Reflet sur la barre */
.hp-bar-inner::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(180deg, rgba(255,255,255,0.2), transparent);
}

/* Glow derrière la barre */
.hp-bar-glow {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 75%;  /* Même valeur que hp-bar-inner */
    background: linear-gradient(90deg, var(--accent), var(--primary));
    filter: blur(8px);
    opacity: 0.5;
}
```

### 5.8 Grille de Stats

```css
.stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 3px;
    background: var(--accent);  /* Gap coloré */
}

.stat {
    background: var(--bg-dark);
    padding: 12px;
    text-align: center;
    position: relative;
}

.stat::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--primary);
    opacity: 0.3;
}

.stat-value {
    font-family: 'Black Ops One', cursive;
    font-size: 28px;
    color: var(--text-bright);
    line-height: 1;
    text-shadow: 0 0 20px rgba(255,255,255,0.2);
}

.stat-label {
    font-family: 'Syncopate', sans-serif;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--primary);
    margin-top: 5px;
}
```

### 5.9 Minimap

```css
.minimap {
    aspect-ratio: 1;
    background: #0a0a0f;
    border: 2px solid var(--accent);
    position: relative;
    overflow: hidden;
}

/* Grille de fond */
.minimap-grid {
    position: absolute;
    inset: 0;
    background-image: 
        linear-gradient(rgba(0, 255, 170, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 255, 170, 0.05) 1px, transparent 1px);
    background-size: 20% 20%;
}

/* Vignette sombre sur les bords */
.minimap-vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle, transparent 30%, rgba(0,0,0,0.8) 100%);
    pointer-events: none;
}

/* Nodes de la map */
.minimap-node {
    position: absolute;
    width: 14%;
    height: 14%;
    background: rgba(0, 255, 170, 0.2);
    border: 2px solid var(--primary-dim);
    transition: all 0.3s ease;
}

.minimap-node.current {
    background: var(--accent);
    border-color: var(--accent);
    box-shadow: 0 0 20px var(--accent-glow);
    animation: currentPulse 1.5s ease-in-out infinite;
}

.minimap-node.visited {
    background: rgba(0, 255, 170, 0.4);
    border-color: var(--primary);
}

.minimap-node.fog {
    background: rgba(50, 50, 70, 0.3);
    border-color: #333;
}

@keyframes currentPulse {
    0%, 100% { 
        transform: scale(1);
        box-shadow: 0 0 20px var(--accent-glow);
    }
    50% { 
        transform: scale(1.1);
        box-shadow: 0 0 30px var(--accent-glow), 0 0 50px var(--accent-glow);
    }
}
```

### 5.10 Slots d'Équipement

```css
.equipment-slot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: rgba(0, 0, 0, 0.3);
    border-left: 3px solid var(--border);
    transition: all 0.2s;
}

.equipment-slot:hover {
    background: rgba(0, 255, 170, 0.05);
    border-left-color: var(--primary);
}

.equipment-slot.equipped {
    border-left-color: var(--accent);  /* Rouge si équipé */
}

.slot-label {
    font-family: 'Syncopate', sans-serif;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--text-dim);
}

.slot-value {
    font-family: 'Share Tech Mono', monospace;
    font-size: 12px;
    color: var(--primary);
}

.slot-empty {
    color: var(--text-dim);
    font-style: italic;
}
```

---

## 6. EFFETS ET ANIMATIONS

### 6.1 Effets Globaux (Body)

```css
/* Noise overlay subtil */
body::before {
    content: '';
    position: fixed;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    opacity: 0.03;
    pointer-events: none;
    z-index: 9999;
}

/* Scanlines animées */
body::after {
    content: '';
    position: fixed;
    inset: 0;
    background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 255, 170, 0.008) 2px,
        rgba(0, 255, 170, 0.008) 4px
    );
    pointer-events: none;
    z-index: 9998;
    animation: scanlines 10s linear infinite;
}

@keyframes scanlines {
    0% { transform: translateY(0); }
    100% { transform: translateY(100px); }
}
```

### 6.2 Animations Réutilisables

```css
/* Pulse générique */
@keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.9); }
}

/* Blink pour curseur */
@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
}

/* Shine traversant */
@keyframes shine {
    0% { left: -100%; }
    50%, 100% { left: 200%; }
}

/* Glitch pour événements spéciaux */
@keyframes glitch {
    0% { transform: translate(0); filter: hue-rotate(0deg); }
    20% { transform: translate(-5px, 3px); filter: hue-rotate(90deg); }
    40% { transform: translate(3px, -2px); filter: hue-rotate(180deg); }
    60% { transform: translate(-2px, 5px); filter: hue-rotate(270deg); }
    80% { transform: translate(4px, -3px); filter: hue-rotate(360deg); }
    100% { transform: translate(0); filter: hue-rotate(0deg); }
}

/* Screen shake pour combat */
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}

/* Fade in pour lignes de terminal */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
```

### 6.3 Déclencheurs d'Effets

| Événement | Animation | Durée | Cible |
|-----------|-----------|-------|-------|
| Nouveau texte terminal | `fadeIn` | 0.3s | `.output-line` |
| Dégâts reçus | `shake` | 0.5s | `.game-container` |
| Coup critique | `glitch` | 0.3s | `.game-container` |
| Soin/Buff | `pulse` (vert) | 0.5s | `.portrait` |
| Nouvelle quête | `pulse` (orange) | 1s | `.quest-tracker` |
| Hover bouton | scale + glow | 0.2s | élément ciblé |

---

## 7. ICÔNES ET SYMBOLES

### 7.1 Caractères Spéciaux Recommandés

```
Prompt input    : ▶
Sorties         : →
Entités/NPCs    : ◆ ou 👤
Objets          : ◇ ou emoji contextuel
Quête active    : ▸
Crédits         : ◈
Status actif    : ●
Status inactif  : ○
Séparateur      : •
Coordonnées     : [ ]
```

### 7.2 Émojis Contextuels (Zones et Objets)

Utiliser des émojis pour renforcer visuellement le contexte :

```
Zones     : 🎮 (arcade), 🏚️ (ruine), 🏭 (usine), 🌃 (rue), 🏥 (clinique)
Armes     : 🔫 (pistolet), ⚔️ (lame), 💉 (seringue)
Armures   : 🦺 (gilet), 🪖 (casque)
Items     : 💾 (data), 🔑 (clé), 💊 (med)
NPCs      : 👤 (générique), 🤖 (robot), 👁️ (corpo)
Ennemis   : ☠️ (danger), 🔴 (hostile)
```

---

## 8. RESPONSIVE DESIGN

### 8.1 Breakpoints

```css
/* Desktop large */
@media (min-width: 1200px) {
    .game-container { max-width: 1400px; }
}

/* Desktop standard */
@media (min-width: 901px) and (max-width: 1199px) {
    .game-container { max-width: 1100px; }
    .hud { width: 280px; }
}

/* Tablet / Desktop étroit */
@media (max-width: 900px) {
    /* HUD passe au-dessus du terminal */
    /* Voir section 4.3 pour détails */
}

/* Mobile */
@media (max-width: 500px) {
    /* HUD en colonne unique */
    /* Stats 2x2 */
    /* Portrait réduit */
}
```

### 8.2 Adaptations Mobiles Clés

1. **Header** : Stack vertical, centré
2. **HUD** : Grille 2 colonnes, puis 1 colonne
3. **Terminal** : Min-height 50vh, après le HUD
4. **Portrait** : Réduction à 70x70px
5. **Stats** : Grille 4 colonnes (compact) puis 2x2
6. **Font-sizes** : Réduire de ~2px sur mobile

---

## 9. BONNES PRATIQUES D'IMPLÉMENTATION

### 9.1 Structure HTML Sémantique

```html
<div class="game-container">
    <header class="header">...</header>
    <main class="terminal">...</main>
    <aside class="hud">
        <section class="hud-section">...</section>
    </aside>
</div>
```

### 9.2 Performance CSS

- Utiliser `transform` et `opacity` pour les animations (GPU-accelerated)
- Éviter les `box-shadow` animés sur de grandes surfaces
- Limiter les `filter` animés aux petits éléments
- Utiliser `will-change` avec parcimonie

### 9.3 Accessibilité

- Contraste texte/fond > 4.5:1 (WCAG AA)
- Focus visible sur les éléments interactifs
- Pas d'animation si `prefers-reduced-motion`
- Labels explicites pour les inputs

```css
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
```

### 9.4 Conventions de Nommage CSS

```
.component                 /* Composant principal */
.component-element         /* Élément enfant */
.component--modifier       /* Variante */
.is-state                  /* État temporaire */

Exemples :
.terminal
.terminal-header
.terminal-output
.terminal--combat          /* Mode combat */
.is-active
.is-disabled
```

---

## 10. CHECKLIST D'IMPLÉMENTATION

### Phase 1 : Structure de base
- [ ] Variables CSS définies dans `:root`
- [ ] Layout grid principal
- [ ] Header avec logo
- [ ] Terminal (header, output, input)
- [ ] HUD (sections vides)

### Phase 2 : Composants HUD
- [ ] Portrait avec cadre animé
- [ ] Barre de PV
- [ ] Grille de stats
- [ ] Minimap avec nodes
- [ ] Slots d'équipement

### Phase 3 : Contenu Terminal
- [ ] Affichage zone (header, description)
- [ ] Sorties cliquables
- [ ] Entités avec style
- [ ] Objets avec style
- [ ] Suggestions/autocomplétion

### Phase 4 : Effets et Polish
- [ ] Noise overlay
- [ ] Scanlines animées
- [ ] Animations de transition
- [ ] Effets de combat (shake, glitch)
- [ ] Hover states

### Phase 5 : Responsive
- [ ] Breakpoint 900px (tablet)
- [ ] Breakpoint 500px (mobile)
- [ ] Test sur vrais appareils

---

## 11. FICHIER DE RÉFÉRENCE CSS COMPLET

Un fichier CSS complet implémentant cette charte est disponible dans le mockup HTML associé. Ce fichier peut être utilisé comme base de départ et adapté selon les besoins.

**Points d'attention pour l'agent IA :**

1. Toujours utiliser les variables CSS définies (ne pas hardcoder les couleurs)
2. Respecter la hiérarchie typographique strictement
3. Le gap de 3px avec background `--accent` crée les séparateurs rouges
4. Les animations doivent rester subtiles (pas de bounce, pas de elastic)
5. Privilégier les transitions CSS aux animations JavaScript quand possible
6. Tester le responsive à chaque modification

---

*Document généré pour CYBRPK — Décembre 2024*
