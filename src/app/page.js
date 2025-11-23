import HomeClient from "./component/HomeClient";
import Loading from "./loading";
import { Suspense } from "react";

export default async function Home() {
  return (
    <Suspense fallback={<Loading to="Home" />}>
      <HomeClient />
    </Suspense>
  );
}
