import Header from "../component/Header";
import Footer from "../component/Footer";
import DocsPortal from "./DocsPortal";
import { buildApiDocsData } from "../../lib/apiDocsDiscovery";

export const dynamic = "force-dynamic";

export default async function ApiDocsPage() {
  const docsData = await buildApiDocsData();

  return (
    <div className="min-h-screen bg-[#f5efe3] text-[#191611]">
      <Header currentPath="/docs" theme="light" />
      <DocsPortal docsData={docsData} />
      <Footer />
    </div>
  );
}
