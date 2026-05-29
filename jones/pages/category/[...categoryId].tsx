import type { GetStaticPaths, GetStaticProps } from "next";

import { buildProductListingHref, getPathString } from "src/utils";

export default function CategoryRedirectPage() {
  return null;
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const [category = "all"] = (params?.categoryId as string[]) || [];

  return {
    redirect: {
      destination: buildProductListingHref({ category: getPathString(category) }),
      permanent: false,
    },
  };
};
