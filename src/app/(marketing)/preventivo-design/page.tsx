import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CategoryPage } from '../_components/CategoryPage';
import { categories } from '@/lib/category-config';

const config = categories.find(c => c.slug === 'preventivo-design');

export const metadata: Metadata = config?.metadata ?? {};

export default function Page() {
  if (!config) notFound();
  return <CategoryPage config={config} />;
}
