import HomeClient from './component/HomeClient';
import Loading from './loading';
import { Suspense } from 'react';

async function getSites() {
  const res = await fetch('http://localhost:3000/api/sites');
  if (!res.ok) {
    return [];
  }
  return res.json();
}

export default async function Home() {
  const sites = await getSites();

  return (
    <Suspense fallback={<Loading />}>
      <HomeClient sites={sites} />
    </Suspense>
  );
}