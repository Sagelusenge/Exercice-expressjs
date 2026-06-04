# DESIGN.md — KBS Real Estate - Design System v2.0

> **Document destiné aux développeurs mobile**. Design system "Warm Industrial" avec glassmorphisme et profondeur tonale.

---

## 1) Vue d'ensemble

### 1.1 Philosophie de Design
- **Esthétique**: Warm Industrial + Glassmorphism + Minimalism
- **Objectif**: Équilibrer les besoins utilitaires de la gestion immobilière (maintenance, facturation) avec une atmosphère premium et hospitalière
- **Personnalité de marque**: Autoritaire mais accueillant, utilisant des tons terre profonds et la lumière éthérée pour créer un sentiment de calme et d'ordre
- **Public**: Deux flux distincts
  - **Admin Flow** (Techniciens/Managers): Densité moyenne, plus de données
  - **Tenant Flow** (Locataires): Densité confortable, plus d'espace blanc

### 1.2 Mouvements Visuels
- **Glassmorphism**: Surface semi-transparentes avec backdrop blur au lieu de conteneurs plats durs
- **Tonal Layering**: Hiérarchie visuelle par couches de tonalité plutôt que par ombres drop
- **Backdrop Blur**: 20px-32px pour éléments flottants (navigation, modales, cartes de propriétés)

---

## 2) Système de Couleurs - "Luminous Management"

### 2.1 Palette Complète

#### Surfaces & Arrière-plans
```
Background (Canvas)           #131311  (Obsidian - Ultra foncé)
Surface                       #131311
Surface Dim                   #131311
Surface Bright                #3a3937

Surface Variant               #353532
Surface Container Lowest      #0e0e0c
Surface Container Low         #1c1c19
Surface Container             #20201d  (Standard)
Surface Container High        #2a2a28
Surface Container Highest     #353532
```

#### Texte & Contrastes
```
On-Surface (Texte principal)        #e5e2de  (Blanc 90%)
On-Surface-Variant (Secondaire)     #d1c5b6  (Blanc 80%)
On-Background                       #e5e2de
Outline (Bordures)                  #9a8f82
Outline-Variant (Bordures secondaires) #4d463a
Inverse-Surface                     #e5e2de
Inverse-On-Surface                  #31302e
```

#### Primaire - Or Doux (Accent Principal)
```
Primary                       #fffaff
Primary-Container             #ffda9f  (Or doux - UTILISATION PRINCIPALE)
On-Primary                    #422d02  (Texte sombre sur or)
On-Primary-Container         #795e2e  (Texte sur conteneur or)
Inverse-Primary              #755a2b
Primary-Fixed                #ffdeaa
Primary-Fixed-Dim            #e5c188  (Or chaud - lueur)
On-Primary-Fixed             #271900
On-Primary-Fixed-Variant     #5b4315
Surface-Tint                 #e5c188  (Or chaud)
```

#### Secondaire - Olive Profond
```
Secondary                     #d0c6ab
On-Secondary                  #36301d
Secondary-Container           #504934  (Olive - Conteneurs secondaires)
On-Secondary-Container        #c2b89d
Secondary-Fixed               #ede2c6
Secondary-Fixed-Dim           #d0c6ab
On-Secondary-Fixed            #201b0a
On-Secondary-Fixed-Variant    #4d4632
```

#### Tertiaire - Mouche Charbon
```
Tertiary                      #fffaff
On-Tertiary                   #333028
Tertiary-Container            #e4dfd2
On-Tertiary-Container         #656258
Tertiary-Fixed                #e8e2d6
Tertiary-Fixed-Dim            #cbc6ba
On-Tertiary-Fixed             #1d1c14
On-Tertiary-Fixed-Variant     #49473e
```

#### États & Feedback
```
Error                         #ffb4ab  (Terracotta brûlée)
On-Error                      #690005
Error-Container               #93000a
On-Error-Container            #ffdad6

Success (Sage vert doux)      À définir selon design
Info (Bleu ardoise atténué)   À définir selon design
```

### 2.2 Modèle d'Utilisation des Couleurs

#### Flux Admin (Technicians/Managers)
```
Fond page                 #131311 (Obsidian)
Cartes                    #20201d avec bordure 1px white 15%
CTA Principal             #ffda9f (Or) avec texte #422d02
État actif/Focus          #ffda9f + lueur 15px blur 20% opacity
Texte primaire            #e5e2de (Blanc 90%)
Texte secondaire          #d1c5b6 (Blanc 80%) ou 70% opacity white
```

#### Flux Tenant (Lifestyle)
```
Fond page                 #131311 (Obsidian)
Cartes Glassmorphic       40% opacity #504934 + 20-32px backdrop blur
Bordures cartes           1px white 15% opacity
CTA Principal             #ffda9f (Or) avec texte #422d02
État actif/Focus          #ffda9f + lueur 15px blur 20% opacity
Texte primaire            #e5e2de (Blanc 90%)
Texte secondaire          70% opacity white
```

#### Statut & Indicateurs
```
Urgent (Admin)            Or (#ffda9f) - Priorité haute
Routine (Admin)           Olive (#504934) - Priorité normale
Pending (Technician)      Or (#ffda9f) avec label PENDING
In Progress               Or (#ffda9f) avec label IN PROGRESS
Completed                 Sage vert (À définir)
Erreur                    Terracotta (#ffb4ab)
```

---

## 3) Typographie

### 3.1 Police
- **Font Family**: **Inter** (exclusivement)
- **Fallback**: sans-serif
- **Justification**: Optimale pour la lisibilité sur vues de données denses (journaux de maintenance) et vues lifestyle (tableaux de bord tenants)

### 3.2 Hiérarchie Typographique

```yaml
Headline-XL:
  Font Size: 32px
  Font Weight: 600 (Semi-bold)
  Line Height: 40px
  Letter Spacing: -0.02em
  Usage: Titres principaux de pages
  
Headline-LG:
  Font Size: 24px
  Font Weight: 600
  Line Height: 32px
  Usage: Titres de section
  
Headline-MD:
  Font Size: 20px
  Font Weight: 500 (Medium)
  Line Height: 28px
  Usage: Sous-titres, titres de cartes

Body-LG:
  Font Size: 16px
  Font Weight: 400 (Regular)
  Line Height: 24px
  Usage: Texte principal (lisibilité sur fond foncé)
  
Body-MD:
  Font Size: 14px
  Font Weight: 400
  Line Height: 20px
  Usage: Texte secondaire, descriptions

Label-LG:
  Font Size: 12px
  Font Weight: 600 (Semi-bold)
  Line Height: 16px
  Letter Spacing: 0.05em
  Usage: Tags, métadonnées, statuts (PENDING, IN PROGRESS)
  
Label-SM:
  Font Size: 10px
  Font Weight: 500 (Medium)
  Line Height: 14px
  Usage: Labels flottants, annotations
```

### 3.3 Règles Typographiques

- **Headlines**: Espacement des lettres serré + poids semi-bold pour créer un ancrage visuel fort
- **Corps de texte**: Standardisé à 16px pour la lisibilité sur fonds sombres
- **Labels**: Petites majuscules ou espacement accru pour les tags de statut technician (PENDING, IN PROGRESS)
- **Contraste**: Utiliser blanc pur (#FFFFFF) ou `#e5e2de` pour texte primaire et 70% opacity white pour texte secondaire
- **Focus States**: S'assurer que tous les textes interactifs ont une teinte d'or visible

---

## 4) Espacement & Layout

### 4.1 Système d'Espacement
```yaml
base:      4px
xs:        8px    (0.5rem)
sm:        12px   (0.75rem)
md:        16px   (1rem)  [GUTTER standard]
lg:        24px   (1.5rem)
xl:        32px   (2rem)
margin-mobile: 20px  [Marges latérales sur mobile]
```

### 4.2 Grille Mobile-First
- **Type**: Grille fluide, 4 colonnes sur mobile
- **Gutters**: 16px entre les colonnes
- **Marges latérales**: 20px sur mobile
- **Rythme vertical**: Multiples de 8px (xs, sm, md, lg) pour structure disciplinée

### 4.3 Densité

#### Admin Flow
- **Densité**: Moyenne
- **Utilisation**: Plus de données visibles, plus compacte
- **Espacement vertical**: 12-16px entre éléments

#### Tenant Flow
- **Densité**: Confortable
- **Utilisation**: Plus d'espace blanc, sensation "lifestyle"
- **Espacement vertical**: 20-24px entre éléments

---

## 5) Élévation & Profondeur (Tonal Layering)

### 5.1 Modèle d'Élévation

#### Couche 1 - Base
```
Couleur: #131311 (Obsidian)
Utilisation: Fond de page, canvas principal
Élévation: 0
```

#### Couche 2 - Surface
```
Couleur: #20201d (Surface Container)
Border: 1px white opacity 10%
Utilisation: Cartes solides, conteneurs données (Admin flow)
Élévation: 1
```

#### Couche 3 - Verre (Élevée)
```
Couleur: 40% opacity #504934 (Secondary Container)
Backdrop Blur: 20px-32px
Border: 1px white opacity 15%
Utilisation: Navigation flottante, modales, cartes de propriétés (Tenant flow)
Élévation: 2
```

#### Couche 4 - Lueur Interactive
```
Couleur: #ffda9f (Or doux)
Effet: Outer glow blur 15px, opacity 20%
Utilisation: États actifs, notifications urgentes, boutons CTA en hover
Élévation: 3 (attire l'attention)
```

### 5.2 Règles de Profondeur
- Hiérarchie par tonalité plutôt que par ombres drop traditionnelles
- Backdrop blur crée la profondeur perceptuelle sans ajouter de complexité visuelle
- Lueurs or guident l'attention utilisateur vers les actions prioritaires

---

## 6) Arrondis (Rounded Corners)

```yaml
sm:      0.25rem (4px)       - Petits boutons, éléments discrets
DEFAULT: 0.5rem  (8px)       - Standart pour plupart des éléments
md:      0.75rem (12px)      - Légère arrondi supplémentaire
lg:      1rem    (16px)      - Boutons & inputs (style "Pill")
xl:      1.5rem  (24px)      - Cartes & conteneurs (STANDARD)
full:    9999px              - Forme circulaire
```

### 6.1 Utilisation par Type

- **Cartes & Conteneurs**: `radius-xl` (24px) pour la plupart des blocs de contenu
- **Éléments Héros ou Modales**: `radius-3xl` (32px) pour sensation douce moderne
- **Boutons & Inputs**: `radius-lg` (16px) style "Pill" pour distinctif
- **Badges & Tags**: `radius-full` (circulaire) ou `radius-lg` selon le contexte

---

## 7) Composants UI

### 7.1 Boutons

#### Primary Button
```
Background:   #ffda9f (Or doux)
Text Color:   #422d02 (Texte sombre)
Padding:      md vertical, lg horizontal (16px y, 24px x)
Border Radius: radius-lg (16px)
Hover State:  Lueur 15px blur 20% opacity or + réduction 5% brightness
Focus State:  Ring 2px #e5c188 (Or plus clair)
```

#### Secondary Button (Glassmorphic)
```
Background:   40% opacity #504934 + 20px backdrop blur
Border:       1px white 20% opacity
Text Color:   #e5e2de (Blanc)
Padding:      md vertical, lg horizontal
Border Radius: radius-lg (16px)
Hover State:  Augmentation opacity background à 50%
Focus State:  Ring 2px #ffda9f (Or)
```

#### Tertiary Button (Text Only)
```
Background:   Transparent
Text Color:   #ffda9f (Or)
Border:       Aucune ou bottom border 2px or
Icon:         Flèche ou icône or
Hover State:  Texte #e5c188, underline plus visible
Focus State:  Ring 2px #ffda9f
```

### 7.2 Cartes

**Règles générales:**
- Border: 1px white opacity 15%
- Border Radius: 24px (radius-xl)
- Padding: md/lg selon contexte

#### Admin Flow - Cartes Solides
```
Background:   #20201d (Surface Container)
Border:       1px white 15% opacity
Content:      Plus dense, données visibles
Spacing:      12-16px vertical
Hover:        Léger augmentation brightness + transition smooth
```

#### Tenant Flow - Cartes Glassmorphic
```
Background:   40% opacity #504934 + backdrop blur 20-32px
Border:       1px white 15% opacity
Content:      Plus d'espace blanc
Spacing:      20-24px vertical
Hover:        Blur augmente à 32px + opacity augmente à 45%
```

### 7.3 Champs de Saisie (Input Fields)

```
Background:   Semi-transparent (#1c1c19 ou inférieur)
Border:       1px bottom border #9a8f82 (Outline color)
Border-Focus: 1px bottom border #ffda9f (Or) + outline-none
Label:        Float above field en label-sm, #d1c5b6
Placeholder:  #9a8f82 70% opacity
Text Color:   #e5e2de
Padding:      sm/md selon densité
Border Radius: Pas d'arrondi (bottom border only) ou xs
```

### 7.4 Status Chips & Tags

#### Technician Flow
```
Style:        Pastille avec icône colorée + label haute-contraste
Couleur fond:  #20201d (Surface Container)
Icône:        Or (#ffda9f) pour "URGENT", Olive (#504934) pour "ROUTINE"
Texte:        label-lg, couleur matches icône
Bordure:      1px white 15% opacity
```

#### Tenant Flow
```
Style:        Pastille glassmorphic plus grande
Background:   40% opacity couleur statut + backdrop blur 10px
Icône:        Plus grande, or ou couleur sage
Texte:        label-md, #e5e2de
Bordure:      1px white 15% opacity
```

### 7.5 Indicateur de Lueur (Glow Indicator)

```
Style:        Petit point or avec animation de pulsation
Couleur:      #ffda9f (Or doux)
Blur:         10px (pulsating)
Utilisation:  Messages non lus, nouvelles demandes de maintenance
Animation:    Pulse 2s infinite (opacity 0.4 → 1.0)
Position:     Typiquement badge sur icône ou en coin de card
```

### 7.6 Navigation Inférieure (Bottom Navigation)

```
Style:        Barre glassmorphic haute-blur (30-40px backdrop blur)
Background:   40% opacity #504934 + backdrop blur
Border:       1px white 10% opacity (top border)
Icônes actives:  #ffda9f (Or) + lueur subtle
Icônes inactives: #d1c5b6 (Blanc 80%) ou 50% opacity white
Padding:      Confortable (md à lg)
Border Radius: radius-lg ou full (haut)
Height:       60-70px sur mobile
Position:     Fixed bottom avec safe area
```

---

## 8) Accessibilité

### 8.1 Contraste
- **Fond sombre** (`#131311`): Privilégier `#e5e2de` (blanc 90%) ou blanc pur
- **Cartes** (`#20201d`): Utiliser texte blanc pour maximum de contraste
- **Texte secondaire**: 70% opacity white acceptable pour labels/metadata
- **Toujours tester**: WCAG AA minimum (4.5:1 pour texte, 3:1 pour interface)

### 8.2 Focus States
- Tous les éléments interactifs doivent avoir un focus visible
- Préféré: Ring `2px solid #ffda9f` (Or) pour distinction claire
- Alternative: Bottom border épaissie ou background change
- **Ne jamais**: `outline: none` sans remplacement

### 8.3 Labels & ARIA
- Inputs: Labels flottantes ou associées via `aria-label`
- Boutons icônes: `aria-label` descriptif (ex: "Ouvrir le chat", "Menu")
- Icônes de statut: `aria-label` pour screen readers
- Cartes interactives: Role approprié (`button`, `link`, ou `article`)

### 8.4 Séquence de Tabulation
- Respecter flux logique haut-bas, gauche-droite
- Éléments fixes (chat, bottom nav) accessibles mais pas en flux principal
- Grouper connexes (formulaires, listes) pour navigation cohérente

---

## 9) Utilisation Rapide - Checklists

### Admin Flow Implementation
```
✓ Fond: #131311
✓ Cartes solides: #20201d + border 1px white 15%
✓ CTA: #ffda9f avec lueur au hover
✓ Texte principal: #e5e2de
✓ Texte secondaire: 70% opacity white
✓ Status dots: Or (urgent) / Olive (routine)
✓ Densité: Moyenne (12-16px spacing vertical)
✓ Dense data acceptable: Priorité lisibilité
```

### Tenant Flow Implementation
```
✓ Fond: #131311
✓ Cartes glassmorphic: 40% opacity #504934 + 20-32px blur
✓ CTA: #ffda9f avec lueur au hover
✓ Texte principal: #e5e2de
✓ Texte secondaire: 70% opacity white
✓ Glasmorphic chips: Larger, softer appearance
✓ Densité: Confortable (20-24px spacing vertical)
✓ Whitespace: Privilégier pour feeling lifestyle
```

---

## 10) Notes Techniques pour Développeurs Mobile

### Performance
- **Backdrop Blur**: Peut être coûteux sur mobile; tester sur devices bas-gamme
- **Animations**: Pulse & transitions lisses (transform plutôt que animate)
- **Optimisation**: Utiliser CSS tokens ou variables pour cohérence couleur

### Responsive
- **Mobile-First**: Design d'abord sur petit écran
- **Breakpoints**: Adapter spacing et typography au screen size
- **Bottom Navigation**: Considérer safe area bottom sur devices avec notch
- **Chat Widget**: Respecter espace bottom nav (add padding-bottom au main)

### Testing
- **Contrast Test**: WebAIM Contrast Checker pour tous les textes
- **Device Test**: iPhone 12/13, Samsung Galaxy A12 minimum
- **Orientation**: Portrait & landscape
- **Accessibility**: VoiceOver (iOS) & TalkBack (Android)

---

## 11) Ressources & Références

### Color Values Export (Pour code)
- Considérer une `theme.ts` ou `colors.json` avec toutes les couleurs centralisées
- Utiliser CSS variables `--color-primary`, `--color-surface`, etc.
- Documenter usage par variable pour éviter confusion

### Design Tokens
```
--color-surface: #131311
--color-surface-container: #20201d
--color-primary: #ffda9f
--color-primary-dim: #e5c188
--color-on-surface: #e5e2de
--color-on-surface-variant: #d1c5b6
--color-outline: #9a8f82

--spacing-base: 4px
--spacing-xs: 8px
--spacing-md: 16px
--spacing-lg: 24px

--radius-sm: 4px
--radius-lg: 16px
--radius-xl: 24px

--font-family: 'Inter', sans-serif
--font-size-body-lg: 16px
--font-size-headline-lg: 24px
```

### Typography Stack
```css
/* Headlines */
font-family: 'Inter', sans-serif;
font-weight: 600;
font-size: 24px;
line-height: 32px;

/* Body */
font-family: 'Inter', sans-serif;
font-weight: 400;
font-size: 16px;
line-height: 24px;
```

---

## 12) Évolution & Maintenance

- **Version**: 2.0 (Luminous Management - Updated)
- **Dernière mise à jour**: Juin 2024
- **Prochaine révision**: Post-MVP, après feedback utilisateurs
- **Notes**: S'assurer que tous les designers/devs utilisent cette source unique de vérité

