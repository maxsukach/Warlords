import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    allowedDevOrigins: [
      "9000-firebase-warlordsnextjs-1766877686696.cluster-zti5ytzhlffjjqj6bp4giuli3u.cloudworkstations.dev",
      "9002-firebase-warlordsnextjs-1766877686696.cluster-zti5ytzhlffjjqj6bp4giuli3u.cloudworkstations.dev"
    ],
  },
};

export default nextConfig;
