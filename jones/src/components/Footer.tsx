import Link from "next/link";
import NextImage from "next/image";
import { useEffect, useState } from "react";
import { BiMap, BiPhone, BiTime } from "react-icons/bi";
import { HiOutlineMail } from "react-icons/hi";
import { FaPaperPlane } from "react-icons/fa";

import SocialIcons from "./common/SocialButtons";
import Dropdown from "./formControls/Dropdown";
import Modal from "./Modal";
import Logo from "./common/Logo";

import {
  CurrencyType,
  DialogType,
  useCurrencyState,
  useDialog,
} from "@Contexts/UIContext";

import paymentImage from "@Images/payment.png";
import Form from "./common/Form";
import { toast } from "react-toastify";
import { type FooterContent } from "@Data/defaultContent";
import { FOOTER_SEED } from "@Data/footerSeed";

function normalizeFooter(cmsFooter: any): FooterContent {
  const fallback = FOOTER_SEED;
  const footer = cmsFooter && typeof cmsFooter === "object" ? cmsFooter : {};

  return {
    title: String(footer.title || fallback.title),
    description: String(footer.description || fallback.description),
    copyright: String(footer.copyright || fallback.copyright),
    contact: {
      address: String(footer.contact?.address || fallback.contact.address),
      phone: String(footer.contact?.phone || fallback.contact.phone),
      email: String(footer.contact?.email || fallback.contact.email),
      hours: String(footer.contact?.hours || fallback.contact.hours),
    },
    aboutLinks: Array.isArray(footer.aboutLinks) ? footer.aboutLinks : fallback.aboutLinks,
    quickLinks: Array.isArray(footer.quickLinks) ? footer.quickLinks : fallback.quickLinks,
    newsletter: {
      title: String(footer.newsletter?.title || fallback.newsletter.title),
      description: String(footer.newsletter?.description || fallback.newsletter.description),
      disclaimer: String(footer.newsletter?.disclaimer || fallback.newsletter.disclaimer),
    },
    socialLinks: Array.isArray(footer.socialLinks) ? footer.socialLinks : fallback.socialLinks,
    gutter: {
      termsLinks: Array.isArray(footer.gutter?.termsLinks) ? footer.gutter.termsLinks : fallback.gutter.termsLinks,
      copy: String(footer.gutter?.copy || fallback.gutter.copy),
      languageLabel: String(footer.gutter?.languageLabel || fallback.gutter.languageLabel),
      currencyLabelPrefix: String(footer.gutter?.currencyLabelPrefix || fallback.gutter.currencyLabelPrefix),
    },
  };
}

export default function Footer() {
  const { currency, setCurrency } = useCurrencyState();
  const { currentDialog, setDialog } = useDialog();
  const visible = currentDialog == DialogType.MODAL_LANG_CURRENCY;
  const [footerContent, setFooterContent] = useState<FooterContent>(FOOTER_SEED);

  useEffect(() => {
    let cancelled = false;

    async function loadFooter() {
      try {
        const response = await fetch(`/api/shop/cms/site-content/?_=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });
        const data = await response.json().catch(() => ({}));
        if (!cancelled) {
          setFooterContent(normalizeFooter(data?.footer));
        }
      } catch {
        if (!cancelled) {
          setFooterContent(FOOTER_SEED);
        }
      }
    }

    loadFooter();
    return () => {
      cancelled = true;
    };
  }, []);

  const aboutLinks = footerContent.aboutLinks.filter(link => link?.visible !== false);
  const quickLinks = footerContent.quickLinks.filter(link => link?.visible !== false);
  const termsLinks = footerContent.gutter.termsLinks.filter(link => link?.visible !== false);
  const emailHref = `mailto:${footerContent.contact.email}?subject=I%20Need%20Support`;
  const phoneHref = `tel:${footerContent.contact.phone.replace(/[^\d+]/g, "")}`;
  const newsletterDisclaimer = footerContent.newsletter.disclaimer;
  const privacyLink = footerContent.gutter.termsLinks.find(link => link.label.toLowerCase() === "privacy")?.link || "/privacy";

  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__col">
          <div className="footer__logo">
            <Logo />
          </div>
          <h3 className="footer__sub-heading">Contact</h3>
          <address>
            <p className="footer__contact">
              <BiMap className="footer__contact-icon" />
              <span className="footer__contact-info">
                {footerContent.contact.address.split(",").map((part, idx) => (
                  <span key={idx}>
                    {idx > 0 ? <><br />{part.trim()}</> : part.trim()}
                  </span>
                ))}
              </span>
            </p>
            <p className="footer__contact">
              <BiPhone className="footer__contact-icon" />
              <span className="footer__contact-info">
                <a className="footer__contact-link" href={phoneHref}>
                  {footerContent.contact.phone}
                </a>
              </span>
            </p>
            <p className="footer__contact">
              <HiOutlineMail className="footer__contact-icon" />
              <span className="footer__contact-info">
                <a className="footer__contact-link" href={emailHref}>{footerContent.contact.email}</a>
              </span>
            </p>
            <p className="footer__contact">
              <BiTime className="footer__contact-icon" />
              <span className="footer__contact-info">
                {footerContent.contact.hours}
              </span>
            </p>
            <hr className="footer__hr" />
            <p className="footer__sub-heading">Connect With Us</p>
            <div className="footer__social-buttons">
              <SocialIcons size="md" links={footerContent.socialLinks} />
            </div>
          </address>
        </div>
        <div className="footer__col">
          <h3 className="footer__heading">about</h3>
          <ul>
            {aboutLinks.map((item, index) => (
              <li className="footer__link" key={`about-${index}`}>
                <Link href={item.link || "/"}>
                  <a target={item.target || "_self"} rel={item.rel || "noopener noreferrer"}>{item.label}</a>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer__col">
          <h3 className="footer__heading">quick links</h3>
          <ul>
            {quickLinks.map((item, index) => (
              <li className="footer__link" key={`quick-${index}`}>
                <Link href={item.link || "/"}>
                  <a target={item.target || "_self"} rel={item.rel || "noopener noreferrer"}>{item.label}</a>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer__col">
          <div className="newsletter">
            <h3 className="footer__heading">{footerContent.newsletter.title}</h3>
            <p className="newsletter__info">
              {footerContent.newsletter.description}
            </p>
            <Form
              afterSubmit={() => {
                toast(
                  "Thank you for joining our newsletter to receive special offers.",
                  { type: "success" }
                );
              }}
              action="/api/newsletter"
            >
              <div className="newsletter__input input input--red input--bottom">
                <input
                  id="newsletter_input"
                  className="input__box"
                  type="email"
                  name="email"
                  inputMode="email"
                  placeholder="YOUR EMAIL"
                  required
                  spellCheck="false"
                />
                <label
                  htmlFor="newsletter_input"
                  className="input__placeholder"
                >
                  YOUR EMAIL
                </label>
                <button
                  aria-label="add email to newsletter"
                  className="input__submit"
                  type="submit"
                >
                  <FaPaperPlane className="input__submit-icon" />
                </button>
              </div>
              <p className="newsletter__disclaimer">
                {newsletterDisclaimer.replace(/Privacy Policy/i, "").trim()}
                {" "}
                <Link href={privacyLink}>
                  <a>Privacy Policy</a>
                </Link>
              </p>
            </Form>
            <hr className="footer__hr" />
            <div className="footer__payments">
              <NextImage
                src={paymentImage}
                alt=""
                className="footer__payments-image"
                width={paymentImage.width}
                height={paymentImage.height}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="gutter">
        <div className="gutter__container">
          <div className="gutter__terms">
            {termsLinks.map((item, index) => (
              <span key={`term-${index}`}>
                {index > 0 && <span className="gutter__terms-space"></span>}
                <Link href={item.link || "/"}>
                  <a className="gutter__terms-link" target={item.target || "_self"} rel={item.rel || "noopener noreferrer"}>{item.label}</a>
                </Link>
              </span>
            ))}
          </div>
          <div className="gutter__copy">
            &copy;&nbsp;{new Date().getFullYear()}&nbsp;{footerContent.gutter.copy}
          </div>
          <div className="gutter__lang-currency language-currency">
            <button
              onClick={() => setDialog(DialogType.MODAL_LANG_CURRENCY)}
              className="language-currency__btn"
            >
              {footerContent.gutter.languageLabel} <span className="language-currency__sep">|</span>{" "}
              {`${footerContent.gutter.currencyLabelPrefix} ${currency}`}
            </button>
          </div>
        </div>
      </div>

      <Modal
        title="Select Language / Currency"
        onClose={() => setDialog(null)}
        size="sm"
        visible={visible}
      >
        <Dropdown
          onOptionSelect={(value) => {
            setCurrency(value.toUpperCase() as CurrencyType);
            setDialog(null);
          }}
          label={`Select Currency (${currency.toUpperCase()})`}
          options={{
            usd: CurrencyType.USD,
            cad: CurrencyType.CAD,
            gbp: CurrencyType.GBP,
            eur: CurrencyType.EUR,
            jmd: CurrencyType.JMD,
          }}
          icons={{
            usd: (
              <NextImage
                src="https://flagcdn.com/24x18/us.png"
                width="24"
                height="18"
                alt=""
              />
            ),
            cad: (
              <NextImage
                src="https://flagcdn.com/24x18/ca.png"
                width="24"
                height="18"
                alt=""
              />
            ),
            gbp: (
              <NextImage
                src="https://flagcdn.com/24x18/gb.png"
                width="24"
                height="18"
                alt=""
              />
            ),
            eur: (
              <NextImage
                src="https://flagcdn.com/24x18/eu.png"
                width="24"
                height="18"
                alt=""
              />
            ),
            jmd: (
              <NextImage
                src="https://flagcdn.com/24x18/jm.png"
                width="24"
                height="18"
                alt=""
              />
            ),
          }}
        />
      </Modal>
    </footer>
  );
}
