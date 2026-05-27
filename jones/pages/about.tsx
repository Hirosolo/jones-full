import SEO from "@Components/common/SEO";

export default function AboutPage() {
  return (
    <div className="page about-page">
      <SEO title="About Us" />
      <main className="page__container about-page__container">
        <section className="about-page__hero">
          <p className="about-page__eyebrow">Who we are</p>
          <h1 className="about-page__title">About Us</h1>
          <p className="about-page__lead">
            We are an independent shop built around sharp curation, clear service,
            and a clean shopping experience that feels at home on our site.
          </p>
        </section>

        <section className="about-page__panel about-page__story">
          <h2>Our Story</h2>
          <p>
            Founded by enthusiasts, we started with a simple idea: quality,
            honesty, and a focus on customers. Over time we&apos;ve grown while
            keeping that original mission at heart.
          </p>
          <p>
            The design language of our store is intentionally bold and minimal,
            so our content pages follow the same rhythm: dark surfaces, strong
            headlines, clean spacing, and warm accent details.
          </p>
        </section>

        <section className="about-page__highlights" aria-label="Store highlights">
          <article className="about-page__card">
            <h2>Curated</h2>
            <p>Products and content selected with a focused, editorial feel.</p>
          </article>
          <article className="about-page__card">
            <h2>Responsive</h2>
            <p>Support and communication designed to stay clear and fast.</p>
          </article>
          <article className="about-page__card">
            <h2>Consistent</h2>
            <p>A visual system that stays aligned with the rest of the website.</p>
          </article>
        </section>

        <section className="about-page__panel about-page__contact">
          <h2>Contact</h2>
          <p>
            If you&apos;d like to reach out, use our contact page or email us at
            <a href="mailto:hello@example.com"> hello@example.com</a>.
          </p>
        </section>
      </main>
    </div>
  );
}
