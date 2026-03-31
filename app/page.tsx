import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  FolderKanban,
  BarChart3,
  Users,
  ShieldCheck,
  Clock,
  Building2,
} from "lucide-react"

const FEATURES = [
  {
    icon: FolderKanban,
    title: "Gestion de projets",
    description:
      "Suivez vos projets de A à Z avec des tableaux de bord financiers, des diagrammes de Gantt et des Kanban boards intégrés.",
  },
  {
    icon: BarChart3,
    title: "Suivi de production",
    description:
      "Comparez le planifié vs le réel en temps réel. Alertes automatiques en cas de sous-performance.",
  },
  {
    icon: Users,
    title: "Multi-unités",
    description:
      "Gérez plusieurs agences ou chantiers sous une même entreprise, chacun avec son équipe et ses projets.",
  },
  {
    icon: ShieldCheck,
    title: "Contrôle d'accès",
    description:
      "Chaque rôle ne voit que ce qui le concerne. OWNER, ADMIN, USER — les permissions sont appliquées côté serveur.",
  },
  {
    icon: Clock,
    title: "Suivi du temps",
    description:
      "Chronomètre intégré et saisie manuelle. Rapports hebdomadaires par utilisateur et par projet.",
  },
  {
    icon: Building2,
    title: "CRM Clients",
    description:
      "Gérez vos clients par unité, liez-les à vos projets et suivez la valeur totale des contrats.",
  },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Building2 className="size-6 text-primary" />
            <span className="text-lg font-semibold tracking-tight">PMA</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/company/sign-in">
              <Button variant="ghost">Se connecter</Button>
            </Link>
            <Link href="/company/sign-up">
              <Button>Commencer gratuitement</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="flex max-w-3xl flex-col items-center gap-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Pilotez vos projets de construction{" "}
            <span className="text-primary">en toute confiance</span>
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            PMA remplace vos fichiers Excel éparpillés par une plateforme
            unifiée : planification Gantt, suivi financier, Kanban, production
            et CRM — le tout avec un contrôle d&apos;accès par rôle.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/company/sign-up">
              <Button size="lg" className="min-w-[200px]">
                Essai gratuit — 2 mois
              </Button>
            </Link>
            <Link href="/company/sign-in">
              <Button variant="outline" size="lg" className="min-w-[200px]">
                Se connecter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Tout ce dont vous avez besoin
            </h2>
            <p className="mt-2 text-muted-foreground">
              Une vue complète sur chaque projet, du devis à la livraison
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col gap-3 rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Des plans qui évoluent avec vous
            </h2>
            <p className="mt-2 text-muted-foreground">
              Commencez gratuitement, passez à la vitesse supérieure quand vous
              êtes prêt
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Starter */}
            <div className="flex flex-col rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Starter</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Pour découvrir PMA
              </p>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-bold">0 DA</span>
                <span className="text-sm text-muted-foreground"> / 2 mois</span>
              </div>
              <ul className="flex flex-1 flex-col gap-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> 1 unité
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> 5 projets
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> 10 membres
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> 20 tâches / projet
                </li>
              </ul>
            </div>

            {/* Pro */}
            <div className="relative flex flex-col rounded-xl border-2 border-primary bg-card p-6 shadow-md">
              <div className="absolute -top-3 left-4 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                Populaire
              </div>
              <h3 className="text-lg font-semibold">Pro</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Pour les équipes en croissance
              </p>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-bold">49 000 DA</span>
                <span className="text-sm text-muted-foreground"> / an</span>
              </div>
              <ul className="flex flex-1 flex-col gap-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> 5 unités
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> 30 projets
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> 50 membres
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> 200 tâches / projet
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Support email
                </li>
              </ul>
            </div>

            {/* Premium */}
            <div className="flex flex-col rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Premium</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Pour les grandes entreprises
              </p>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-bold">99 000 DA</span>
                <span className="text-sm text-muted-foreground"> / an</span>
              </div>
              <ul className="flex flex-1 flex-col gap-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Unités illimitées
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Projets illimités
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Membres illimités
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Tâches illimitées
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Support dédié
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30 px-6 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight">
            Prêt à centraliser vos projets ?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Créez votre compte en 2 minutes — aucune carte bancaire requise
          </p>
          <Link href="/company/sign-up" className="mt-6 inline-block">
            <Button size="lg">Créer mon compte</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} PMA — Gestion de projets pour le BTP en
        Algérie
      </footer>
    </div>
  )
}
