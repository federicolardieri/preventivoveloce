import { Metadata } from 'next';
import { CategoryPage } from '../_components/CategoryPage';
import { categories } from '@/lib/category-config';

const slug = 'preventivo-design';
const config = categories.find(c => c.slug === slug);

export const metadata: Metadata = {
  ...config?.metadata,
  alternates: { canonical: `/${slug}` },
};

export default function Page() {
  return <CategoryPage slug={slug} />;
}
