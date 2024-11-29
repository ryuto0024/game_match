import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: process.env.DOMAINS ? process.env.DOMAINS.split(",") : [],
  },
};

export default nextConfig;
