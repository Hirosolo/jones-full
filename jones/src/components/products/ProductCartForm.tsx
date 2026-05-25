import { ProductComponentType } from "src/types/shared";
import { useCurrencyFormatter } from "@Contexts/UIContext";

export default function ProductCartForm({
  product,
}: {
  product: ProductComponentType;
}) {
  const format = useCurrencyFormatter();

  return (
    <section className="product-cart-form" aria-label="Purchase information">
      <div className="product-cart-form__notice">
        <p className="product-cart-form__notice-title">Payment Gateway Notice</p>
        <p className="product-cart-form__notice-copy">
          The payment gateway of jones.com is under maintenance. You will be
          redirected to jones.shop to choose product options and complete your
          payment.
        </p>
      </div>

    </section>
  );
}
