import Header from "../component/Header";
import Footer from "../component/Footer";
import DocsPortal from "./DocsPortal";
import { getApiDocsData } from "../../lib/api-registry";

export default async function ApiDocsPage() {
  const docsData = getApiDocsData();

  return (
    <div className="min-h-screen bg-[#f5efe3] text-[#191611]">
      <Header currentPath="/docs" theme="light" />
      <DocsPortal docsData={docsData} />
      <Footer />
    </div>
  );
}
