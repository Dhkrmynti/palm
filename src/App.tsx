import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { demoForest, demoPond, demoRounds, demoStatus, usePoll, type Forest, type Pond, type RoundRow, type Status } from "./lib/api";
import { useFeed } from "./lib/feed";
import { prefersReducedMotion } from "./lib/motion";
import { restoreWallet } from "./lib/wallet";
import { Closing, Journey, TopBar } from "./sections/Frame";
import { Hero } from "./sections/Hero";
import { FireLine, Ticker } from "./sections/Story";
import { Treeline } from "./sections/Treeline";
import { Board } from "./sections/Board";
import { Haze, Ledger, Mill } from "./sections/Mill";
import { PlotDrawer, PlotSection } from "./sections/Plot";
import { BurnToast, ShareCard } from "./ui/ShareCard";

gsap.registerPlugin(ScrollTrigger);

/**
 * The page is one walk down the island: from orbit over the map, down to the fire line, across the
 * plantation, through the mill and its weighbridge office, into the haze, to the land office, and out
 * to the last tree at night. Every place has its own ground; the edges between them are drawn.
 */
export function App() {
  const { data: status, error } = usePoll<Status>("/api/status", 4000, demoStatus);
  const live = !!status?.tokenAddress;
  const { data: pond } = usePoll<Pond>(live ? "/api/pond?limit=50" : null, 3000, demoPond);
  const { data: forest } = usePoll<Forest>(live ? "/api/forest" : null, 3000, demoForest);
  const { data: rounds } = usePoll<RoundRow[]>(live ? "/api/rounds" : null, 20000, demoRounds);
  const feed = useFeed(pond, rounds, forest, live);

  useEffect(restoreWallet, []);

  // Scenes measure where they start once; when fonts or live rows change the height above them,
  // measure again so nothing starts in the wrong place.
  useEffect(() => {
    ScrollTrigger.config({ ignoreMobileResize: true });
    let t = 0;
    const again = () => {
      clearTimeout(t);
      t = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    };
    document.fonts?.ready.then(again);
    window.addEventListener("load", again);
    const heights = new Map<Element, number>();
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const h = Math.round(e.contentRect.height);
        if (heights.get(e.target) !== h) {
          heights.set(e.target, h);
          again();
        }
      }
    });
    document.querySelectorAll(".place").forEach((el) => ro.observe(el));
    return () => {
      clearTimeout(t);
      window.removeEventListener("load", again);
      ro.disconnect();
    };
  }, []);

  // Coming down from orbit: as the hero scrolls away the map zooms toward the fire front and the
  // readouts lift off, so the next thing you see is the treeline at ground level.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.6 } });
      tl.to(".hero__map", { scale: 1.5, yPercent: 12, transformOrigin: "40% 60%", ease: "none" }, 0)
        .to(".hero__map", { opacity: 0.25, ease: "power1.in" }, 0)
        .to(".hero__copy, .meter", { y: -120, opacity: 0, ease: "power1.in" }, 0)
        .to(".hero__hud, .radio", { opacity: 0, ease: "none" }, 0);
      gsap.fromTo(".treeline svg", { yPercent: 18 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".treeline", start: "top bottom", end: "bottom 60%", scrub: 0.6 } });
      // the bar slides away while you walk down and comes back the moment you scroll up
      ScrollTrigger.create({
        start: 240,
        end: "max",
        onUpdate: (s) => gsap.to(".bar", { yPercent: s.direction === 1 ? -110 : 0, duration: 0.35, ease: "power2.out", overwrite: true }),
        onLeaveBack: () => gsap.to(".bar", { yPercent: 0, duration: 0.35, overwrite: true }),
      });
      gsap.fromTo(".progress", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
    });
    return () => ctx.revert();
  }, []);

  // Smooth scroll that ScrollTrigger reads from; off for reduced motion.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    const anchors = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a || a.getAttribute("href") === "#") return;
      const el = document.querySelector(a.getAttribute("href")!);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el as HTMLElement, { offset: a.getAttribute("href") === "#top" ? 0 : -20 });
    };
    document.addEventListener("click", anchors);
    return () => {
      document.removeEventListener("click", anchors);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="site">
      <TopBar status={status} />
      <span className="progress" aria-hidden="true" />
      <Journey />
      {error && !status ? <p className="offline num">The island's feed is offline for a moment.</p> : null}
      <Hero status={status} pond={pond} forest={forest} feed={feed} />
      <Treeline pct={live && forest ? (forest.burned / Math.max(1, forest.total)) * 100 : 0} />
      <Ticker forest={forest} live={live} />
      <main>
        <FireLine status={status} forest={forest} />
        <Board status={status} pond={pond} />
        <Mill status={status} />
        <Ledger rounds={rounds} live={live} />
        <Haze status={status} />
        <PlotSection />
      </main>
      <Closing status={status} orenAddr={live && pond?.house ? pond.house.addr : undefined} />
      <PlotDrawer />
      <ShareCard />
      <BurnToast forest={live ? forest : null} />
    </div>
  );
}
