import { ReactNode } from "react";
import { useRouter } from "next/router";

import Header from "../header";
import Footer from "../Footer";
import HeroBanner from "../HeroBanner";
import { ScrollUpButton } from "../ScrollUpButton";
import FeaturesSection from "../FeaturesSection";

import { DialogType, useDialog } from "@Contexts/UIContext";

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hideHeroBanner = router.asPath.startsWith("/articles/");

  useDialog(
    (isVisible) => {
      document.body.style.overflow = isVisible ? "hidden" : "auto";
    },
    [
      DialogType.SIDEBAR_DIALOG,
      DialogType.SEARCH_BOX,
      DialogType.MODAL_ANNOUNCEMENT,
      DialogType.MODAL_LANG_CURRENCY,
      DialogType.MODAL_PRODUCT_VIEW,
    ]
  );

  return (
    <>
      <Header />
      {!hideHeroBanner && <HeroBanner />}
      <main>{children}</main>
      <FeaturesSection />
      <Footer />
      <ScrollUpButton />
    </>
  );
}
