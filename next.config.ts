import type { NextConfig } from "next";
import { CMS_UPLOAD_SERVER_ACTION_BODY_SIZE_LIMIT } from "./src/lib/cms-upload";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    serverActions: {
      bodySizeLimit: CMS_UPLOAD_SERVER_ACTION_BODY_SIZE_LIMIT,
    },
  },
};

export default nextConfig;
