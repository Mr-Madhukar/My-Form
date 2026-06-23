import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  allowedDevOrigins: ["10.59.51.3", "localhost", "127.0.0.1"],
  async rewrites() {
    const apiTarget = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    return [
      {
        source: "/trpc/:path*",
        destination: `${apiTarget}/trpc/:path*`,
      },
      {
        source: "/auth/:path*",
        destination: `${apiTarget}/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
