export type BlockType =
  | "hero"
  | "stats"
  | "trust"
  | "categories"
  | "products"
  | "mid_banner"
  | "quotes"
  | "promo"
  | "text"
  | "image"
  | "cta"
  | "media_press"
  | "spacer";

export type CmsBlock = {
  id: string;
  type: BlockType;
  enabled: boolean;
  order: number;
  data: Record<string, unknown>;
};

export type PostStatus = "draft" | "publish";

export type CmsPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  status: PostStatus;
  date: string;
  categories: string[];
  /** Cover image path under storefront public (e.g. /images/blog/slug.jpg). */
  coverImage?: string;
  metaTitle?: string;
  metaDescription?: string;
};

export type CmsPage = {
  id: string;
  slug: string;
  title: string;
  body: string;
  status: PostStatus;
  date: string;
  categories?: string[];
  coverImage?: string;
  metaTitle?: string;
  metaDescription?: string;
};

export type CmsMedia = {
  id: string;
  url: string;
  alt: string;
  date: string;
};

export type ProductStatus = "draft" | "publish";

export type ProductAvailability = "InStock" | "OutOfStock" | "PreOrder";

export type CmsProduct = {
  id: string;
  slug: string;
  status: ProductStatus;
  /** Show in storefront featured / special section. */
  featured?: boolean;
  name: string;
  summary: string;
  /** Long HTML for PDP (optional). */
  bodyHtml?: string;
  priceToman: number;
  badge?: string;
  image: string;
  imageAlt: string;
  rating: number;
  reviewCount: number;
  metaTitle: string;
  metaDescription: string;
  ogTitle?: string;
  ogDescription?: string;
  keywords: string[];
  schemaCategory: string;
  brandName: string;
  gtin?: string;
  mpn: string;
  priceValidUntil: string;
  availability: ProductAvailability;
  bestRating: number;
  worstRating: number;
  reviewBody: string;
  reviewAuthor: string;
  reviewRatingValue: number;
};
