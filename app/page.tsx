'use client';

import RestaurantSearch from './components/RestaurantSearch';

export const dynamic = 'force-static';
export const revalidate = false;

export default function Home() {
  return (
    <main className="min-h-screen p-4">
      <RestaurantSearch />
    </main>
  );
}
