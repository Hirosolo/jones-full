import { useState } from "react";

import type { FaqContent } from "src/data/defaultContent";

interface FaqSectionProps {
  content: FaqContent;
}

export default function FaqSection({ content }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!content.enabled) return null;

  return (
    <section className="faq-section">
      <div className="faq-section__container">
        <header className="faq-section__header">
          <h2 className="faq-section__title">{content.title}</h2>
        </header>

        <div className="faq-section__list">
          {content.items.map((item, index) => {
            const isOpen = openIndex === index;
            const panelId = `faq-panel-${index}`;
            const buttonId = `faq-button-${index}`;

            return (
              <article key={item.question} className={`faq-section__item ${isOpen ? "faq-section__item--open" : ""}`}>
                <button
                  id={buttonId}
                  type="button"
                  className={`faq-section__question ${isOpen ? "faq-section__question--open" : ""}`}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span>{item.question}</span>
                  <span className="faq-section__icon" aria-hidden="true">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  aria-hidden={!isOpen}
                  className={`faq-section__answer ${isOpen ? "faq-section__answer--open" : ""}`}
                >
                  <div className="faq-section__answer-inner">
                    <p>{item.answer}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}