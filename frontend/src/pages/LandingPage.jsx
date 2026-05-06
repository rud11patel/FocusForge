// import { Link, Navigate } from "react-router-dom";
// import { useAuth } from "../hooks/useAuth";
// import heroImage from "../assets/landing-hero.png";

// const featureCards = [
//   {
//     title: "Run focused sessions",
//     body: "Plan a block, start the timer, pause when reality interrupts, and keep the backend in charge of session truth.",
//   },
//   {
//     title: "Turn minutes into progress",
//     body: "Convert consistent focus into XP, levels, streaks, and a dashboard that makes your effort visible.",
//   },
//   {
//     title: "Learn your patterns",
//     body: "See weekly momentum, tag breakdowns, best focus windows, and the shape of your discipline over time.",
//   },
// ];

// const proofPoints = [
//   "Session recovery after refresh",
//   "Pause, resume, and abandon flows",
//   "Weekly analytics and streak tracking",
//   "Privacy-aware leaderboard",
// ];

// export function LandingPage() {
//   const { user, loading } = useAuth();

//   if (!loading && user) {
//     return <Navigate to="/dashboard" replace />;
//   }

//   return (
//     <div className="min-h-screen bg-slate-950 text-slate-100">
//       <section className="relative overflow-hidden">
//         <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(2,6,23,0.92)_15%,rgba(2,6,23,0.6)_48%,rgba(15,23,42,0.2)_100%)]" />
//         <img
//           src={heroImage}
//           alt="A premium focus workspace with timer and progress cues"
//           className="h-[720px] w-full object-cover object-center"
//         />
//         <div className="absolute inset-0">
//           <div className="mx-auto flex min-h-[720px] max-w-7xl flex-col px-4 py-6">
//             <header className="flex items-center justify-between">
//               <Link to="/" className="text-sm uppercase tracking-[0.32em] text-forge-200">
//                 FocusForge
//               </Link>
//               <div className="flex items-center gap-3">
//                 <Link
//                   to="/login"
//                   className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
//                 >
//                   Login
//                 </Link>
//                 <Link
//                   to="/register"
//                   className="rounded-full bg-forge-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-forge-300"
//                 >
//                   Start free
//                 </Link>
//               </div>
//             </header>

//             <div className="mt-auto max-w-3xl pb-16 pt-20">
//               <p className="text-sm uppercase tracking-[0.32em] text-forge-200">
//                 Focus tracking for real work
//               </p>
//               <h1 className="mt-6 max-w-2xl font-display text-5xl leading-tight text-white md:text-7xl">
//                 Build a system that rewards focused effort, not just intention.
//               </h1>
//               <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 md:text-xl">
//                 FocusForge helps you run deep-work sessions, recover when your
//                 day gets messy, and turn time spent into visible momentum.
//               </p>
//               <div className="mt-10 flex flex-wrap gap-4">
//                 <Link
//                   to="/register"
//                   className="rounded-full bg-forge-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-forge-300"
//                 >
//                   Create account
//                 </Link>
//                 <Link
//                   to="/login"
//                   className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
//                 >
//                   Explore your workspace
//                 </Link>
//               </div>
//               <div className="mt-12 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
//                 {proofPoints.map((point) => (
//                   <div
//                     key={point}
//                     className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 backdrop-blur-sm"
//                   >
//                     {point}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       <section className="mx-auto max-w-7xl px-4 py-20">
//         <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
//           <div>
//             <p className="text-sm uppercase tracking-[0.28em] text-forge-300">
//               Why it works
//             </p>
//             <h2 className="mt-5 font-display text-4xl leading-tight text-white md:text-5xl">
//               A calmer way to measure discipline.
//             </h2>
//             <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
//               The app opens into a real workspace, not a motivational poster.
//               Plan a session, protect your streak, and let your data show you
//               how focus actually behaves across the week.
//             </p>
//           </div>
//           <div className="grid gap-4 md:grid-cols-3">
//             {featureCards.map((card) => (
//               <div
//                 key={card.title}
//                 className="rounded-3xl border border-white/10 bg-slate-900/70 p-6"
//               >
//                 <p className="text-lg font-semibold text-white">{card.title}</p>
//                 <p className="mt-4 text-sm leading-7 text-slate-300">
//                   {card.body}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       <section className="border-t border-white/10 bg-slate-900/60">
//         <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-16 md:flex-row md:items-end md:justify-between">
//           <div className="max-w-2xl">
//             <p className="text-sm uppercase tracking-[0.28em] text-forge-300">
//               Start now
//             </p>
//             <h2 className="mt-4 font-display text-4xl text-white">
//               Focus with a system that remembers the work.
//             </h2>
//             <p className="mt-4 text-base leading-8 text-slate-300">
//               Create an account, spin up your first task, and let the timer,
//               streaks, and analytics do the nagging for you.
//             </p>
//           </div>
//           <div className="flex flex-wrap gap-4">
//             <Link
//               to="/register"
//               className="rounded-full bg-forge-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-forge-300"
//             >
//               Get started
//             </Link>
//             <Link
//               to="/login"
//               className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
//             >
//               Sign in
//             </Link>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }


import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import heroImage from "../assets/landing-hero.png";

const featureCards = [
  {
    title: "Run focused sessions",
    body: "Plan a block, start the timer, pause when reality interrupts, and keep the backend in charge of session truth.",
  },
  {
    title: "Turn minutes into progress",
    body: "Convert consistent focus into XP, levels, streaks, and a dashboard that makes your effort visible.",
  },
  {
    title: "Learn your patterns",
    body: "See weekly momentum, tag breakdowns, best focus windows, and the shape of your discipline over time.",
  },
];

const proofPoints = [
  "Session recovery after refresh",
  "Pause, resume, and abandon flows",
  "Weekly analytics and streak tracking",
  "Privacy-aware leaderboard",
];

export function LandingPage() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="bg-slate-950 text-slate-100">
      {/* HERO */}
      <section className="relative min-h-screen">
        {/* Background image */}
        <img
          src={heroImage}
          alt="A premium focus workspace with timer and progress cues"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(2,6,23,0.92)_15%,rgba(2,6,23,0.6)_48%,rgba(15,23,42,0.2)_100%)]" />

        {/* Content */}
        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6">
          <header className="flex items-center justify-between">
            <Link to="/" className="text-sm uppercase tracking-[0.32em] text-forge-200">
              FocusForge
            </Link>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-forge-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-forge-300"
              >
                Start free
              </Link>
            </div>
          </header>

          <div className="mt-auto max-w-3xl pb-24 pt-20">
            <p className="text-sm uppercase tracking-[0.32em] text-forge-200">
              Focus tracking for real work
            </p>

            <h1 className="mt-6 max-w-2xl font-display text-5xl leading-tight text-white md:text-7xl">
              Build a system that rewards focused effort, not just intention.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 md:text-xl">
              FocusForge helps you run deep-work sessions, recover when your
              day gets messy, and turn time spent into visible momentum.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/register"
                className="rounded-full bg-forge-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-forge-300"
              >
                Create account
              </Link>

              <Link
                to="/login"
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Explore your workspace
              </Link>
            </div>

            <div className="mt-12 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
              {proofPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 backdrop-blur-sm"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-forge-300">
              Why it works
            </p>

            <h2 className="mt-5 font-display text-4xl leading-tight text-white md:text-5xl">
              A calmer way to measure discipline.
            </h2>

            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
              The app opens into a real workspace, not a motivational poster.
              Plan a session, protect your streak, and let your data show you
              how focus actually behaves across the week.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {featureCards.map((card) => (
              <div
                key={card.title}
                className="rounded-3xl border border-white/10 bg-slate-900/70 p-6"
              >
                <p className="text-lg font-semibold text-white">
                  {card.title}
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 bg-slate-900/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-16 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.28em] text-forge-300">
              Start now
            </p>

            <h2 className="mt-4 font-display text-4xl text-white">
              Focus with a system that remembers the work.
            </h2>

            <p className="mt-4 text-base leading-8 text-slate-300">
              Create an account, spin up your first task, and let the timer,
              streaks, and analytics do the nagging for you.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              to="/register"
              className="rounded-full bg-forge-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-forge-300"
            >
              Get started
            </Link>

            <Link
              to="/login"
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

