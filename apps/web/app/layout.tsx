import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { GlobalProviders } from "~/providers/global";
import { cn } from "~/lib/utils";
import Script from "next/script";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
});
const geistHeading = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-heading",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "My Form",
  description: "Build and share forms in minutes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn("dark", geistSans.variable, geistHeading.variable, geistMono.variable)}
      suppressHydrationWarning
    >
      <head>
        <Script id="strip-bis-skin-checked" strategy="beforeInteractive">
          {`
            (function() {
              const removeAttributes = () => {
                document.querySelectorAll('[bis_skin_checked]').forEach(el => el.removeAttribute('bis_skin_checked'));
              };
              removeAttributes();
              const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                  if (mutation.type === 'attributes' && mutation.attributeName === 'bis_skin_checked') {
                    mutation.target.removeAttribute('bis_skin_checked');
                  } else if (mutation.addedNodes) {
                    mutation.addedNodes.forEach((node) => {
                      if (node.nodeType === 1) {
                        if (node.hasAttribute('bis_skin_checked')) {
                          node.removeAttribute('bis_skin_checked');
                        }
                        node.querySelectorAll('[bis_skin_checked]').forEach((el) => el.removeAttribute('bis_skin_checked'));
                      }
                    });
                  }
                });
              });
              observer.observe(document.documentElement, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['bis_skin_checked']
              });
            })();
          `}
        </Script>
      </head>
      <body suppressHydrationWarning>
        <GlobalProviders>{children}</GlobalProviders>
      </body>
    </html>
  );
}
