# Complete Milestone 6

This plan addresses the remaining UI and data layers for Milestone 6: Project Documents, Gantt Marker forms, and properly updating the completed tasks based on previous UI integrations.

## User Review Required

> [!IMPORTANT]
> The PRD does not include a `ProjectDocument` model in `schema.prisma`. In order to keep track of uploaded documents, display their size/type, and manage deletes effectively, we need to introduce a new `ProjectDocument` model. Please review this addition to the schema.

## Proposed Changes

### Prisma Schema Update

#### [MODIFY] schema.prisma

Add a new model for project documents linked to `Project` and `Company`.

```prisma
model ProjectDocument {
  id        String   @id @default(uuid())
  name      String
  url       String
  size      Int
  type      String
  projectId String
  Project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  companyId String
  Company   Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([projectId])
  @@index([companyId])
}
```

_We will run `pnpm prisma generate` and `pnpm prisma db push` (or `migrate`) to apply this._

---

### Project Documents Tab

#### [NEW] actions/document.ts

- Server actions `createDocument()`, `deleteDocument()` enforcing that a user only modifies documents in their `companyId` and `projectId` (checking `isMutationAllowed`).
- Add cache tags for document lists,e.g., `projectDocumentsTag`.

#### [MODIFY] components/project/project-documents.tsx

- Integrate `@uploadthing/react` to upload files to the `projectDocument` endpoint.
- Replace the current dummy UI with real state fetching the list of documents via `lib/queries.ts` (e.g. `getProjectDocuments()`).
- In `onClientUploadComplete`, trigger the `createDocument` server action to store the `ProjectDocument` in the DB.

#### [MODIFY] lib/queries.ts & lib/cache.ts

- Add `getProjectDocuments()` tied to `projectDocumentsTag(projectId)` under `use cache`.

---

### Gantt Marker UI

#### [NEW] components/project/gantt-marker-dialog.tsx

- Create the UI form needed per section 6.8 of `tasks.md`. It will allow users to create and edit `GanttMarker` entries (label, date, className).
- This dialog will use the shared `<FormModal>` component to align with PRD v3.2.0 infrastructure.

---

### Tasks Tracking

#### [MODIFY] docs/tasks.md

- Mark `6.3`, `6.6`, `6.7` as **DONE** since the UI and server action bindings for Phase, SubPhase start dates and budgets are already fully implemented.
- Mark `6.8` and `6.9` as IN PROGRESS/DONE as we finish this plan.

## Open Questions

None at this time.

## Verification Plan

### Automated Tests

- `pnpm typecheck` and `pnpm lint` to ensure no schema regressions.

### Manual Verification

1. Upload a file in "Documents" tab; verify it appears in the list.
2. Verify delete file action works.
3. Open Gantt Marker form to confirm it functions seamlessly with the modal infrastructure.
