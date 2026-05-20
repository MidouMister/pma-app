# Production System Refactor — Plan

> **Date:** 2026-05-19
> **Status:** En attente d'approbation

---

## Contexte & Objectif

Le système de production actuel est basé sur une mauvaise compréhension métier. Ce plan corrige la sémantique et ajoute le **prévisionnel annuel**.

### Problème actuel

- Le `Product` a un `taux` planifié qu'on saisit manuellement → **faux** : l'objectif est toujours 100%
- Le `Product.taux` est un "objectif" fixe → **faux** : c'est un agrégateur auto-calculé (somme des productions mensuelles)
- Pas de système de prévisionnel → **manquant** : le planning annuel de production n'existe pas
- L'alerte compare le réel au "taux planifié" du Product → **faux** : l'alerte doit comparer le réel au prévisionnel du mois

### Nouveau modèle métier

```
Phase (montantHT = budget du contrat)
├── Product (1 par phase) — agrégateur auto-calculé
│   ├── taux = SUM(Production.taux) — jamais saisi manuellement
│   └── montantProd = phase.montantHT × (taux / 100)
├── Production (N par phase) — réel mensuel
│   ├── taux = % réalisé CE mois (pas cumulatif)
│   ├── mntProd = phase.montantHT × (taux / 100)
│   └── month/year = mois de référence
└── ProductionForecast (N par phase) — prévisionnel mensuel
    ├── taux = % prévu CE mois
    ├── mntProd = phase.montantHT × (taux / 100)
    └── month/year = mois de référence
```

---

## Règles métier clarifiées

| Règle | Description |
|-------|-------------|
| **PROD-01** | Chaque Phase a au plus un Product (agrégateur). Créé automatiquement au premier enregistrement de Production |
| **PROD-02** | `Product.taux` = `SUM(Production.taux)` — auto-calculé à chaque ajout/modification/suppression de Production. **Jamais saisi manuellement** |
| **PROD-03** | `Product.montantProd` = `Phase.montantHT × (Product.taux / 100)` — auto-calculé |
| **PROD-04** | `Production.taux` = pourcentage réalisé **ce mois-ci** (pas cumulatif). Valeur entre 0 et 100 |
| **PROD-05** | `Production.mntProd` = `Phase.montantHT × (taux / 100)` — auto-calculé |
| **PROD-06** | Un seul `Production` par phase par mois (contrainte `@@unique([phaseId, month, year])`) |
| **PROD-07** | Le prévisionnel est établi **par phase, par mois** — en début d'année par OWNER/ADMIN |
| **PROD-08** | La somme des taux prévisionnels **n'a pas besoin** de totaliser 100% (phases multi-années) |
| **PROD-09** | Le prévisionnel d'un mois futur **peut être modifié** en cours d'année |
| **PROD-10** | `alertThreshold` s'applique : si `Production.taux < ProductionForecast.taux × (threshold / 100)` → alerte OWNER |
| **PROD-11** | Phases multi-années : on fait un prévisionnel par année (ex: 2026 : 60%, 2027 : 40%) |

---

## Phase 1 — Schema Prisma

### Modifications au modèle `Product`

```prisma
model Product {
  id          String       @id @default(uuid())
  taux        Float        @default(0)    // SUM des Productions — auto-calculé
  montantProd Float        @default(0)    // phase.montantHT × (taux/100) — auto-calculé
  Phase       Phase        @relation(fields: [phaseId], references: [id])
  phaseId     String       @unique
  Productions Production[] @relation("ProductProductions")

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([phaseId])
}
```

**Changements :**
- Suppression du champ `date` (inutile pour un agrégateur)
- Ajout de `@default(0)` sur `taux` et `montantProd`
- Ajout de `createdAt` / `updatedAt`

### Modifications au modèle `Production`

```prisma
model Production {
  id        String   @id @default(uuid())
  taux      Float               // % réalisé ce mois (0-100)
  mntProd   Float               // phase.montantHT × (taux/100) — auto-calculé
  month     Int                 // 1-12
  year      Int                 // ex: 2026
  phaseId   String
  Phase     Phase    @relation(fields: [phaseId], references: [id])
  Product   Product  @relation("ProductProductions", fields: [productId], references: [id], onDelete: Cascade)
  productId String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([phaseId, month, year])
  @@index([productId])
  @@index([phaseId])
}
```

**Changements :**
- Remplacement de `date: DateTime` par `month: Int` + `year: Int` (plus précis)
- Ajout de `@@unique([phaseId, month, year])` (un seul enregistrement par mois par phase)
- Ajout de `createdAt` / `updatedAt`

### Nouveau modèle `ProductionForecast`

```prisma
model ProductionForecast {
  id      String @id @default(uuid())
  taux    Float            // % prévu ce mois (0-100)
  mntProd Float            // phase.montantHT × (taux/100) — auto-calculé
  month   Int              // 1-12
  year    Int              // ex: 2026
  phaseId String
  Phase   Phase  @relation(fields: [phaseId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([phaseId, month, year])
  @@index([phaseId])
  @@index([year])
}
```

### Modifications au modèle `Phase`

Ajouter la relation :

```prisma
model Phase {
  // ... existant
  ProductionForecasts ProductionForecast[]
}
```

---

## Phase 2 — Server Actions (`actions/production.ts`)

### Fonctions à refactorer

| Fonction | Changement |
|----------|------------|
| `createProduct()` | **Supprimer** — Product est créé automatiquement lors du premier `createProduction` |
| `updateProduct()` | **Supprimer** — Product n'est plus saisi manuellement |
| `deleteProduct()` | **Garder** — permet de reset toute la production d'une phase |
| `createProduction()` | Refactorer : accepte `{ phaseId, taux, month, year }`. Auto-crée le Product si absent. Recalcule `Product.taux` = SUM. Compare avec forecast pour alerte |
| `updateProduction()` | Refactorer : recalcule `Product.taux` après update |
| `deleteProduction()` | Refactorer : recalcule `Product.taux` après suppression |
| `getPhaseProduction()` | Garder tel quel |
| `getUnitProductions()` | Adapter aux nouveaux champs `month/year` |

### Nouvelles fonctions

| Fonction | Description |
|----------|-------------|
| `createProductionForecast(data)` | OWNER/ADMIN saisit le prévisionnel : `{ phaseId, taux, month, year }`. `mntProd` auto-calculé |
| `updateProductionForecast(id, data)` | Modifier un prévisionnel futur |
| `deleteProductionForecast(id)` | Supprimer un prévisionnel |
| `getPhaseForecasts(phaseId)` | Retourne tous les prévisionnels d'une phase |
| `getUnitForecasts(unitId, year)` | Retourne tous les prévisionnels de l'unité pour une année |
| `bulkCreateForecasts(data[])` | Saisir les 12 mois d'un coup pour une phase |

### Helper : recalcul automatique du Product

```typescript
async function recalculateProduct(phaseId: string): Promise<void> {
  const productions = await prisma.production.findMany({
    where: { phaseId },
    select: { taux: true },
  })
  const totalTaux = productions.reduce((sum, p) => sum + p.taux, 0)
  const phase = await prisma.phase.findUnique({
    where: { id: phaseId },
    select: { montantHT: true },
  })
  const montantProd = (phase?.montantHT ?? 0) * (totalTaux / 100)

  await prisma.product.upsert({
    where: { phaseId },
    create: { phaseId, taux: totalTaux, montantProd },
    update: { taux: totalTaux, montantProd },
  })
}
```

### Logique d'alerte révisée

```typescript
// Après createProduction / updateProduction :
const forecast = await prisma.productionForecast.findUnique({
  where: { phaseId_month_year: { phaseId, month, year } },
})
if (forecast && taux < forecast.taux * (threshold / 100)) {
  await createNotification({
    companyId,
    unitId,
    type: 'PRODUCTION',
    message: `Phase "${phaseName}" : taux réel (${taux}%) < prévisionnel (${forecast.taux}%) pour ${monthName} ${year}`,
    targetRole: 'OWNER',
  })
}
```

---

## Phase 3 — Cache Tags

### Nouveau tag

```typescript
// lib/cache.ts
export const unitForecastsTag = (id: string) => `unit:${id}:forecasts`
```

### Invalidation

| Action | Tags invalidés |
|--------|---------------|
| `createProduction()` | `phaseProductionTag(phaseId)`, `unitProductionsTag(unitId)` |
| `createProductionForecast()` | `unitForecastsTag(unitId)`, `phaseProductionTag(phaseId)` |
| `updateProductionForecast()` | `unitForecastsTag(unitId)`, `phaseProductionTag(phaseId)` |
| `deleteProductionForecast()` | `unitForecastsTag(unitId)`, `phaseProductionTag(phaseId)` |
| `bulkCreateForecasts()` | `unitForecastsTag(unitId)` |

---

## Phase 4 — Composants UI

### 4.1 Production Tab (projet) — Refactorer

**Fichier :** `components/project/production/production-tab.tsx`

**Avant :** Affiche un formulaire pour créer le Product manuellement
**Après :** Affiche directement le formulaire d'entrée de production mensuelle. Le Product n'est plus visible/éditable.

Structure :
1. **En-tête** : Taux cumulé (Product.taux) + Montant réalisé (Product.montantProd) — lecture seule
2. **Graphique** : Courbe prévisionnelle vs courbe réelle par mois
3. **Tableau** : Lignes mensuelles avec colonnes : Mois, Prévisionnel (%), Réel (%), Écart, Montant réalisé
4. **Bouton** : "Ajouter une production" → formulaire avec sélection du mois

### 4.2 Production Entry Form — Refactorer

**Fichier :** `components/project/production/production-entry-form.tsx`

**Changements :**
- Remplacer date picker par sélecteurs **Mois** + **Année**
- Afficher le prévisionnel du mois sélectionné (lecture seule, à titre indicatif)
- Validation : empêcher doublon mois/année pour la même phase

### 4.3 Product Form — Supprimer

**Fichier :** `components/project/production/product-form.tsx`

**Action :** Supprimer ce composant. Le Product est désormais auto-géré.

### 4.4 Production Charts — Refactorer

**Fichier :** `components/project/production/production-charts.tsx`

**Avant :** Comparaison taux planifié (Product.taux) vs réel
**Après :** Courbe prévisionnelle (forecast) vs courbe réelle (production) par mois. L'axe X = mois, les deux courbes superposées.

### 4.5 Forecast Form (nouveau)

**Fichier :** `components/project/production/forecast-form.tsx`

Formulaire pour saisir/modifier le prévisionnel annuel d'une phase :
- Sélecteur d'année
- Grille de 12 mois avec un champ taux (%) par mois
- Bouton "Enregistrer tout" → `bulkCreateForecasts()`
- Affichage du total prévu pour l'année sélectionnée

### 4.6 Unit Productions Page — Refactorer

**Page :** `app/(dashboard)/unite/[unitId]/productions/page.tsx`

**Changements :**
- **Stat cards** : Montant total prévu (prévisionnel de l'année), Montant total réalisé, Nombre de phases en retard
- **Tableau** : Toutes les productions de l'unité **par phase** (pas cumulatif), avec filtres par projet, par mois, par année
- **Colonnes** : Projet, Phase, Mois, Prévisionnel (%), Réel (%), Écart (%), Montant réalisé
- Phases sous-performantes en rouge

---

## Phase 5 — Vérification

1. `pnpm prisma validate` — schéma valide
2. `pnpm typecheck` — pas d'erreurs TypeScript
3. `pnpm lint` — pas d'erreurs ESLint
4. Test manuel : créer un prévisionnel, saisir des productions, vérifier le recalcul automatique du Product
5. Vérifier l'alerte : saisir un réel < prévisionnel × seuil → notification OWNER
6. Vérifier les graphiques : courbe forecast vs réel

---

## Résumé des fichiers impactés

| Fichier | Action |
|---------|--------|
| `prisma/schema.prisma` | MODIFY — Product, Production, nouveau ProductionForecast |
| `actions/production.ts` | MODIFY — refactorer + nouvelles fonctions forecast |
| `lib/cache.ts` | MODIFY — ajouter `unitForecastsTag` |
| `lib/validators.ts` | MODIFY — nouveaux schémas Zod |
| `lib/queries.ts` | MODIFY — nouvelle query `getUnitForecasts` |
| `components/project/production/production-tab.tsx` | MODIFY — supprimer Product form, ajouter forecast |
| `components/project/production/production-entry-form.tsx` | MODIFY — mois/année au lieu de date |
| `components/project/production/product-form.tsx` | DELETE |
| `components/project/production/production-charts.tsx` | MODIFY — forecast vs réel |
| `components/project/production/forecast-form.tsx` | NEW |
| `components/production/production-table.tsx` | MODIFY — adapter colonnes |
| `app/(dashboard)/unite/[unitId]/productions/page.tsx` | MODIFY — adapter stat cards + filtres |
| `docs/PRD.md` | MODIFY — §10.9, §13, §14, §19 |
| `AGENTS.md` | MODIFY — ajouter règles production |
