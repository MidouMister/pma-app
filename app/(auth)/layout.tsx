"use client"

import { motion } from "framer-motion"
import {
  CheckmarkCircle01Icon,
  BarChartIcon,
  UserGroupIcon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

const FEATURES = [
  {
    icon: BarChartIcon,
    title: "Suivi en temps réel",
    description:
      "Visualisez l'avancement de vos projets avec des tableaux de bord interactifs",
  },
  {
    icon: UserGroupIcon,
    title: "Collaboration d'équipe",
    description:
      "Travaillez ensemble avec des outils de communication intégrés",
  },
  {
    icon: Calendar03Icon,
    title: "Planification intelligente",
    description: "Organisez vos phases et tâches avec des diagrammes de Gantt",
  },
]

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel - Marketing/Branding */}
      <div className="relative hidden w-1/2 flex-col justify-between lg:flex">
        {/* Background - Light mode: rich primary gradient, Dark mode: deep dark with primary accents */}
        <div className="absolute inset-0 bg-linear-to-br from-primary via-primary/95 to-primary/80 dark:from-background dark:via-primary/10 dark:to-primary/5" />

        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1/4 -left-1/4 h-[500px] w-[500px] rounded-full bg-white/10 blur-3xl dark:bg-primary/20"
          />
          <motion.div
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.3, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-1/4 -bottom-1/4 h-[600px] w-[600px] rounded-full bg-white/10 blur-3xl dark:bg-primary/15"
          />
        </div>

        {/* Geometric pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary-foreground)/0.06)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary-foreground)/0.06)_1px,transparent_1px)] bg-size-[32px_32px] dark:bg-[linear-gradient(to_right,hsl(var(--primary)/0.08)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.08)_1px,transparent_1px)]" />

        {/* Floating geometric shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ rotate: [0, 90, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-12 right-12 h-24 w-24 rounded-lg border border-white/10 dark:border-primary/20"
          />
          <motion.div
            animate={{ rotate: [0, -90, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-24 left-12 h-16 w-16 rounded-full border border-white/10 dark:border-primary/20"
          />
          <motion.div
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 right-24 h-8 w-8 rounded-md bg-white/5 dark:bg-primary/10"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm dark:bg-primary/20">
              <span className="text-xl font-bold text-white dark:text-primary-foreground">
                PMA
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white dark:text-foreground">
                PMA
              </h2>
              <p className="text-sm text-white/70 dark:text-muted-foreground">
                Gestion de projets
              </p>
            </div>
          </motion.div>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-8 px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h1 className="text-4xl leading-tight font-bold text-white dark:text-foreground">
              Gérez vos projets
              <br />
              avec{" "}
              <span className="text-white/80 dark:text-primary">
                efficacité
              </span>
            </h1>
            <p className="mt-4 max-w-md text-lg text-white/70 dark:text-muted-foreground">
              La plateforme complète pour planifier, suivre et livrer vos
              projets de construction et BTP.
            </p>
          </motion.div>

          <div className="space-y-6">
            {FEATURES.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                className="flex items-start gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm dark:bg-primary/20">
                  <HugeiconsIcon
                    icon={feature.icon}
                    className="h-5 w-5 text-white dark:text-primary-foreground"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-white dark:text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-sm text-white/70 dark:text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="relative z-10 flex items-center gap-2 p-12 text-sm text-white/60 dark:text-muted-foreground"
        >
          <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-4 w-4" />
          <span>Sécurisé et conforme aux normes algériennes</span>
        </motion.div>
      </div>

      {/* Right panel - Form */}
      <div className="flex w-full items-center justify-center bg-background p-4 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-center lg:hidden">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-xl shadow-primary/20">
              <span className="text-2xl font-bold tracking-tight text-primary-foreground">
                PMA
              </span>
            </div>
          </div>

          {children}
        </motion.div>
      </div>
    </div>
  )
}
