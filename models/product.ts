export interface Product {
  jobId: string | null;
  url: string | null;
  title: string | null | undefined;
  brand: string | null | undefined;
  image: string | null | undefined;
  price: number | null | undefined;
  currency: string | null | undefined;
  specifications: string | null | undefined;
  highlights: string | null | undefined;
  estimator: string | null | undefined;
  shipping_price: number | string | null | undefined;
  model: string[] | string | undefined;
  description_images: any;
  description: string | null | undefined;
  measurements: any;
}
