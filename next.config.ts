import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["unpdf", "mammoth", "pdfkit"],
  typedRoutes: true,
  experimental: {
    serverActions: {
      // CV and document uploads go through server actions; the Next.js
      // default 1 MB body limit would reject them.
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;
