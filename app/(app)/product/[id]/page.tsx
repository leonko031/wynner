import { ProductDetailRouter } from "./product-detail-router";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ProductDetailRouter id={id} />;
}
