import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["unpdf", "mammoth", "pdfkit"],
  typedRoutes: true,
};

export default nextConfig;
