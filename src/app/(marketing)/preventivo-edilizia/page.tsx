import { Metadata } from 'next';
import { CategoryPage } from '../_components/CategoryPage';
import { categories } from '@/lib/category-config';

const config = categories.find(c => c.slug === 'preventivo-edilizia')!;

export const metadata: Metadata = config.metadata;

export default function Page() {
  return <CategoryPage config={config} />;
}
