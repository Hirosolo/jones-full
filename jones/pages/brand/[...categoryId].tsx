import type { GetStaticPaths, GetStaticProps } from "next";

import { buildProductListingHref, getPathString } from "src/utils";

export default function BrandRedirectPage() {
  return null;
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const [brand = "all"] = (params?.categoryId as string[]) || [];

  return {
    redirect: {
      destination: buildProductListingHref({ brand: getPathString(brand) }),
      permanent: false,
    },
  };
};