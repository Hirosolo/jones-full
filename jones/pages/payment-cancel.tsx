import SEO from "@Components/common/SEO";

export default function PaymentCancel() {
  return (
    <div className="page">
      <div className="page__container">
        <SEO title="Payment Cancelled" noindex />
        <h1 className="main-heading">Payment Cancelled</h1>
        <section>
          <p>
            Forgot to add something to your cart? Shop around then come back to
            pay!
          </p>
        </section>
      </div>
    </div>
  );
}
