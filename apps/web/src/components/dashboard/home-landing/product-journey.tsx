"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  BarChart3,
  CalendarDays,
  Lightbulb,
  Target,
  WalletCards,
} from "lucide-react";

import { homeClass } from "./home-styles";

const journeyStates = [
  { label: "Visão financeira", icon: WalletCards },
  { label: "Calendário", icon: CalendarDays },
  { label: "Metas", icon: Target },
  { label: "Insights", icon: Lightbulb },
] as const;

const calendarDays = Array.from({ length: 35 }, (_, index) => index);
const overviewBars = [35, 48, 42, 60, 72, 88] as const;
const insightBars = [42, 58, 49, 72, 66, 86] as const;

export function ProductJourney() {
  const journeyRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const activeStepRef = useRef(0);
  const [activeStep, setActiveStep] = useState(0);

  function selectStep(index: number) {
    activeStepRef.current = index;
    setActiveStep(index);

    const scrollTrigger = timelineRef.current?.scrollTrigger;

    if (!scrollTrigger) {
      return;
    }

    const progress = index / (journeyStates.length - 1);
    const scrollPosition =
      scrollTrigger.start +
      (scrollTrigger.end - scrollTrigger.start) * progress;

    window.scrollTo({ top: scrollPosition, behavior: "smooth" });
  }

  useEffect(() => {
    const root = journeyRef.current;

    if (!root) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add(
        "(min-width: 921px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)",
        () => {
          const panels = gsap.utils.toArray<HTMLElement>(
            "[data-journey-panel]",
            root,
          );
          const steps = gsap.utils.toArray<HTMLElement>(
            "[data-journey-step]",
            root,
          );
          const stage = root.querySelector<HTMLElement>(
            "[data-journey-stage]",
          );

          if (!stage || panels.length < 2) {
            return;
          }

          gsap.set(panels.slice(1), {
            autoAlpha: 0,
            y: 24,
          });
          gsap.set(steps.slice(1), { opacity: 0.38 });

          const timeline = gsap.timeline({
            defaults: { ease: "power2.inOut" },
            scrollTrigger: {
              trigger: root,
              start: "top 12%",
              end: "+=840",
              pin: stage,
              scrub: 0.6,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                const nextStep = Math.min(
                  journeyStates.length - 1,
                  Math.round(self.progress * (journeyStates.length - 1)),
                );

                if (nextStep !== activeStepRef.current) {
                  activeStepRef.current = nextStep;
                  setActiveStep(nextStep);
                }
              },
            },
          });

          timelineRef.current = timeline;

          panels.slice(1).forEach((panel, index) => {
            const previousPanel = panels[index];
            const previousStep = steps[index];
            const nextStep = steps[index + 1];
            const position = index + 0.65;

            timeline
              .to(
                previousPanel,
                { autoAlpha: 0, y: -18, duration: 0.32 },
                position,
              )
              .to(
                panel,
                { autoAlpha: 1, y: 0, duration: 0.42 },
                position + 0.08,
              )
              .to(
                previousStep,
                { opacity: 0.38, duration: 0.22 },
                position,
              )
              .to(nextStep, { opacity: 1, duration: 0.22 }, position + 0.08);
          });

          return () => {
            timelineRef.current = null;
          };
        },
      );
    }, root);

    return () => {
      media.revert();
      context.revert();
    };
  }, []);

  return (
    <div className={homeClass("journey-root")} ref={journeyRef}>
      <div className={homeClass("journey-stage")} data-journey-stage>
        <div
          className={homeClass("journey-step-list")}
          aria-label="Etapas da experiência Finly"
          role="group"
        >
          {journeyStates.map((state, index) => {
            const Icon = state.icon;

            return (
              <button
                aria-controls={`journey-panel-${index}`}
                aria-pressed={activeStep === index}
                className={homeClass("journey-step")}
                data-active={activeStep === index}
                data-journey-step
                key={state.label}
                onClick={() => selectStep(index)}
                type="button"
              >
                <Icon aria-hidden="true" />
                <span>{state.label}</span>
                <i aria-hidden="true">0{index + 1}</i>
              </button>
            );
          })}
        </div>

        <div
          className={homeClass("journey-frame")}
          aria-label="Demonstração visual das áreas do Finly"
        >
          <div className={homeClass("journey-frame-bar")} aria-hidden="true">
            <span className={homeClass("journey-frame-mark")}>F</span>
            <span>Finly</span>
            <i />
            <i />
            <i />
          </div>

          <article
            aria-hidden={activeStep !== 0}
            className={homeClass("journey-panel", "journey-overview")}
            data-active={activeStep === 0}
            data-journey-panel="0"
            id="journey-panel-0"
          >
            <div className={homeClass("journey-panel-heading")}>
              <span>Resumo de agosto</span>
              <WalletCards />
            </div>
            <div className={homeClass("journey-balance")}>
              <span>Saldo atual</span>
              <strong>R$ 12.480,00</strong>
              <small>+8,4% neste mês</small>
            </div>
            <div className={homeClass("journey-stat-grid")}>
              <span><small>Entradas</small><strong>R$ 8.420</strong></span>
              <span><small>Saídas</small><strong>R$ 4.180</strong></span>
            </div>
            <div className={homeClass("journey-chart")}>
              {overviewBars.map((height, index) => (
                <i key={`${height}-${index}`} style={{ height: `${height}%` }} />
              ))}
            </div>
          </article>

          <article
            aria-hidden={activeStep !== 1}
            className={homeClass("journey-panel", "journey-calendar")}
            data-active={activeStep === 1}
            data-journey-panel="1"
            id="journey-panel-1"
          >
            <div className={homeClass("journey-panel-heading")}>
              <span>Agosto de 2026</span>
              <CalendarDays />
            </div>
            <div className={homeClass("journey-weekdays")}>
              {["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => (
                <span key={`${day}-${index}`}>{day}</span>
              ))}
            </div>
            <div className={homeClass("journey-calendar-grid")}>
              {calendarDays.map((day) => (
                <span
                  className={homeClass(
                    day === 15 && "is-today",
                    [5, 11, 18, 24, 29].includes(day) && "has-event",
                  )}
                  key={day}
                >
                  {day > 4 ? day - 4 : ""}
                </span>
              ))}
            </div>
            <div className={homeClass("journey-calendar-note")}>
              <i aria-hidden="true" /> 3 compromissos financeiros esta semana
            </div>
          </article>

          <article
            aria-hidden={activeStep !== 2}
            className={homeClass("journey-panel", "journey-goals")}
            data-active={activeStep === 2}
            data-journey-panel="2"
            id="journey-panel-2"
          >
            <div className={homeClass("journey-panel-heading")}>
              <span>Metas em andamento</span>
              <Target />
            </div>
            <div className={homeClass("journey-goal-highlight")}>
              <span>Reserva de tranquilidade</span>
              <strong>72%</strong>
              <div><i /></div>
              <small>R$ 14.400 de R$ 20.000</small>
            </div>
            <div className={homeClass("journey-goal-row")}>
              <span>Nova viagem</span><strong>48%</strong>
            </div>
            <div className={homeClass("journey-goal-row")}>
              <span>Curso profissional</span><strong>31%</strong>
            </div>
          </article>

          <article
            aria-hidden={activeStep !== 3}
            className={homeClass("journey-panel", "journey-insights")}
            data-active={activeStep === 3}
            data-journey-panel="3"
            id="journey-panel-3"
          >
            <div className={homeClass("journey-panel-heading")}>
              <span>Leituras do seu mês</span>
              <BarChart3 />
            </div>
            <div className={homeClass("journey-insight-callout")}>
              <Lightbulb />
              <span><small>Bom ritmo</small><strong>Você poupou 14% a mais.</strong></span>
            </div>
            <div className={homeClass("journey-insight-chart")}>
              {insightBars.map((height, index) => (
                <i key={`${height}-${index}`} style={{ height: `${height}%` }} />
              ))}
            </div>
            <div className={homeClass("journey-insight-footer")}>
              <span>Gastos essenciais</span><strong>Dentro do planejado</strong>
            </div>
          </article>
        </div>

        <p className={homeClass("journey-hint")}>
          Role para percorrer o produto
          <span aria-hidden="true" />
        </p>
      </div>
    </div>
  );
}
