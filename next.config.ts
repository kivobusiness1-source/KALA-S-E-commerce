import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  allowedDevOrigins: [
    "preview-chat-42d81610-044a-46b2-83e9-e799ebbbc00e.space-z.ai",
    ".space-z.ai",
  ],
};

export default nextConfig;
