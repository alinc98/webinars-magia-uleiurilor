# Webinarii + mini-CRM — Magia Uleiurilor Esențiale

Aplicație separată de `magia-uleiurilor.ro`: landing page-uri de webinar generate din
bază de date, plus panou de administrare cu CRM propriu.

- **Brief funcțional:** [`brief-webinar-crm-magia-uleiurilor.md`](./brief-webinar-crm-magia-uleiurilor.md)
- **Plan de implementare:** [`PLAN.md`](./PLAN.md)

## Stack

Next.js 16 (App Router) · Tailwind CSS v4 · shadcn/ui · Supabase (Postgres, Auth,
Storage) · Resend · Vercel · GitHub Actions pentru job-uri programate.

Fără ORM: schema e SQL versionat în `supabase/migrations/`, interogările merg prin
`supabase-js` cu `service_role`, pe server. Vezi §1 din `PLAN.md`.

## Local

```bash
pnpm install
cp .env.example .env.local   # completează din proiectul Supabase de dev
pnpm dev
```

## Comenzi

| Comandă          | Ce face                                             |
| ---------------- | --------------------------------------------------- |
| `pnpm dev`       | server de dezvoltare                                |
| `pnpm build`     | build de producție                                  |
| `pnpm typecheck` | `tsc --noEmit`                                      |
| `pnpm lint`      | ESLint                                              |
| `pnpm db:types`  | regenerează `lib/database.types.ts` din schema live |

## Reguli care nu se încalcă

1. `SUPABASE_SERVICE_ROLE_KEY` nu ajunge niciodată într-o componentă `"use client"`.
2. RLS activat pe toate tabelele, fără politici. Vezi §1 din `PLAN.md`.
3. Formularele publice nu scriu direct în bază — trec prin `/api/*`.
