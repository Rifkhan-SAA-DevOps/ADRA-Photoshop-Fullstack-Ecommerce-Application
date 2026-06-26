import { motion } from 'framer-motion';

export default function PageHero({ title, subtitle }) {
  return (
    <section className="section-padding overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(236,72,153,.24),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,.22),transparent_38%)] py-20">
      <div className="container-max">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-pink-300">ADRA Studio</p>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">{title}</h1>
          <p className="mt-6 text-lg leading-8 text-white/60">{subtitle}</p>
        </motion.div>
      </div>
    </section>
  );
}
