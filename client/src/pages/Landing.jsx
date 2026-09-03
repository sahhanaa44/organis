import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import {
  HeartPulse,
  ScanSearch,
  Users,
  ShieldCheck,
  Building2,
  Activity,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import AnimatedNumber from "../components/AnimatedNumber.jsx";
import WorkflowDiagram from "../components/WorkflowDiagram.jsx";

const WORKFLOW_STAGES = [
  { label: "Donor", description: "Registered donor with verified consent.", icon: Users },
  { label: "Organ", description: "Procured organ logged with viability window.", icon: HeartPulse },
  { label: "AI Analysis", description: "Compatibility engine scores eligible candidates.", icon: ScanSearch },
  { label: "Compatible Recipients", description: "Ranked, explainable candidate shortlist.", icon: Activity },
  { label: "Human Review", description: "Clinical and allocation staff review the ranking.", icon: ShieldCheck },
  { label: "Allocation", description: "Coordinated transplant scheduling begins.", icon: Building2 },
];

function useScrollActiveIndex(total) {
  const [active, setActive] = useState(-1);
  useEffect(() => {
    const onScroll = () => {
      const section = document.getElementById("workflow-section");
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const progress = Math.min(Math.max((window.innerHeight * 0.7 - rect.top) / rect.height, 0), 1);
      setActive(Math.floor(progress * total));
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [total]);
  return active;
}

export default function Landing() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0.3]);
  const heroY = useTransform(scrollYProgress, [0, 0.08], [0, 40]);
  const activeIndex = useScrollActiveIndex(WORKFLOW_STAGES.length);

  return (
    <div>
      {/* HERO */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-forest-100/60 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-[28rem] w-[28rem] rounded-full bg-sage-100/50 blur-3xl" />
        </div>

        <motion.div style={{ opacity: heroOpacity, y: heroY }} className="container-editorial relative">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/70 px-4 py-1.5 text-xs text-stone-600 backdrop-blur-sm"
          >
            <Sparkles size={13} className="text-forest-600" />
            Decision-support, not decision-making — every match is human-reviewed
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="max-w-4xl text-[2.75rem] leading-[1.05] tracking-tightest text-ink sm:text-6xl md:text-7xl"
          >
            Every organ has a destination.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
            className="mt-7 max-w-xl text-lg leading-relaxed text-stone-600"
          >
            An AI-assisted platform for compatibility analysis, transparent matching and coordinated organ
            allocation.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link to="/login" className="btn-primary">
              Get started <ArrowRight size={16} />
            </Link>
            <Link to="/assistant" className="btn-secondary">
              Ask the Organis Assistant
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow-section" className="border-t border-stone-200 bg-paper py-28">
        <div className="container-editorial">
          <div className="mb-16 max-w-2xl">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-forest-600">The pipeline</p>
            <h2 className="text-3xl sm:text-4xl">From donor to allocation, every step explained.</h2>
          </div>
          <div className="grid gap-16 md:grid-cols-2">
            <WorkflowDiagram stages={WORKFLOW_STAGES} activeIndex={activeIndex} />
            <div className="hidden md:block">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="sticky top-32 card p-8"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Currently viewing</p>
                <p className="mt-2 font-serif text-2xl text-ink">
                  {WORKFLOW_STAGES[Math.max(activeIndex, 0)]?.label}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">
                  {WORKFLOW_STAGES[Math.max(activeIndex, 0)]?.description}
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-28">
        <div className="container-editorial">
          <div className="mb-16 max-w-2xl">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-forest-600">How it works</p>
            <h2 className="text-3xl sm:text-4xl">Three roles, one coordinated system.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Users,
                title: "Donors register",
                body: "Donors record medical details and consent. Organs become available for analysis the moment they're logged.",
              },
              {
                icon: ScanSearch,
                title: "AI analyzes compatibility",
                body: "The matching engine scores every eligible recipient against blood, organ, medical, urgency, waiting time and distance factors.",
              },
              {
                icon: ShieldCheck,
                title: "Hospitals review & allocate",
                body: "Clinical teams review the ranked shortlist and make the final allocation decision — the AI never allocates autonomously.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="card p-8"
              >
                <item.icon size={22} strokeWidth={1.5} className="text-forest-600" />
                <h3 className="mt-5 text-xl">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI MATCHING */}
      <section id="matching" className="border-t border-stone-200 bg-forest-900 py-28 text-warmwhite">
        <div className="container-editorial grid gap-16 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-forest-300">AI matching</p>
            <h2 className="text-3xl text-warmwhite sm:text-4xl">Explainable, not opaque.</h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-forest-100/80">
              Every compatibility score decomposes into the exact factors that produced it — blood compatibility,
              organ match, medical history, urgency, waiting time and distance — each with a configurable weight.
            </p>
            <Link to="/assistant" className="mt-8 inline-flex items-center gap-2 text-sm text-warmwhite link-underline">
              Learn how scoring works <ArrowRight size={14} />
            </Link>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm"
          >
            <p className="font-serif text-5xl text-warmwhite">92.4%</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-forest-300">Compatibility</p>
            <div className="mt-6 space-y-4">
              {[
                ["Blood compatibility", 30],
                ["Organ compatibility", 25],
                ["Medical compatibility", 18],
                ["Urgency", 9],
                ["Waiting time", 7],
                ["Distance", 3],
              ].map(([label, pct], i) => (
                <div key={label}>
                  <div className="mb-1.5 flex justify-between text-xs text-forest-100/70">
                    <span>{label}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct * 2.6}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
                      className="h-full rounded-full bg-forest-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRANSPARENCY + HOSPITAL COORDINATION */}
      <section id="transparency" className="py-28">
        <div className="container-editorial grid gap-10 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="card p-10"
          >
            <ShieldCheck size={24} strokeWidth={1.5} className="text-forest-600" />
            <h3 className="mt-5 text-2xl">Transparency by design</h3>
            <p className="mt-4 text-sm leading-relaxed text-stone-600">
              Every match, review and allocation decision is written to an immutable audit log. Donors and
              recipients can see exactly where they stand in the process, and hospitals can see exactly why a
              candidate was ranked where they were.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="card p-10"
          >
            <Building2 size={24} strokeWidth={1.5} className="text-forest-600" />
            <h3 className="mt-5 text-2xl">Built for hospital coordination</h3>
            <p className="mt-4 text-sm leading-relaxed text-stone-600">
              Hospital teams get a single coordinated workspace: available organs, ranked candidates, transplant
              scheduling and case status — all backed by the same explainable matching engine.
            </p>
          </motion.div>
        </div>
      </section>

      {/* STATISTICS */}
      <section className="border-t border-stone-200 bg-paper py-28">
        <div className="container-editorial">
          <div className="mb-16 max-w-2xl">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-forest-600">Platform statistics</p>
            <h2 className="text-3xl sm:text-4xl">A growing, coordinated network.</h2>
          </div>
          <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
            {[
              { value: 15, label: "Registered donors" },
              { value: 25, label: "Active recipients" },
              { value: 8, label: "Partner hospitals" },
              { value: 20, label: "Organs tracked" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-serif text-4xl text-forest-700 sm:text-5xl">
                  <AnimatedNumber value={stat.value} />
                </p>
                <p className="mt-2 text-sm text-stone-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HUMAN OVERSIGHT */}
      <section className="py-28">
        <div className="container-editorial">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl rounded-2xl border border-sage-200 bg-sage-50 p-10 text-center"
          >
            <ShieldCheck size={26} strokeWidth={1.5} className="mx-auto text-forest-700" />
            <h3 className="mt-5 text-2xl">Human oversight, always.</h3>
            <p className="mt-4 text-sm leading-relaxed text-forest-800">
              AI recommendations are decision-support outputs only and must be reviewed by qualified clinical and
              authorized allocation personnel. Organis never allocates an organ autonomously.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-stone-200 py-32">
        <div className="container-editorial text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-2xl text-4xl sm:text-5xl"
          >
            Coordinated, explainable, human-reviewed allocation.
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-10"
          >
            <Link to="/login" className="btn-primary">
              Get started <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
