import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const ServicesHeader: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const title = titleRef.current;
    const subtitle = subtitleRef.current;
    const container = containerRef.current;
    if (!title || !subtitle || !container) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      gsap.set([title, subtitle], { opacity: 1, y: 0 });
      return;
    }

    gsap.set([title, subtitle], { opacity: 0, y: 30 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top 80%",
        once: true,
      },
    });

    tl.to(title, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power2.out",
    })
    .to(subtitle, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: "power2.out",
    }, "-=0.45");

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        backgroundColor: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: "100vh",
        padding: "160px 24px",
        width: "100%",
        position: "relative",
        zIndex: 2,
      }}
    >
      <h2
        ref={titleRef}
        style={{
          fontFamily: "var(--font-title)",
          fontSize: "clamp(2.2rem, 6vw, 4.5rem)",
          fontWeight: 500,
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
          textTransform: "uppercase",
          color: "#fff",
          margin: "0 0 clamp(32px, 6vw, 48px)",
          maxWidth: 1000,
        }}
      >
        Non vendiamo servizi.
        <br />
        <span style={{ color: "var(--color-gold)" }}>Risolviamo problemi.</span>
      </h2>
      <p
        ref={subtitleRef}
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "clamp(0.95rem, 2vw, 1.15rem)",
          fontWeight: 400,
          lineHeight: 1.6,
          color: "rgba(255, 255, 255, 0.7)",
          maxWidth: 640,
          margin: 0,
        }}
      >
        Ogni imprenditore ha una situazione diversa. Scegli l&apos;obiettivo che ti riguarda, pensiamo noi al resto.
      </p>
    </div>
  );
};

export default ServicesHeader;
