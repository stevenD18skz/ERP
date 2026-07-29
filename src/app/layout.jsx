import "@/index.css";
import AppShell from "@/components/layout/AppShell";
import SWRProvider from "@/components/providers/SWRProvider";

export const metadata = {
  title: "Boxes · Everything in one box",
  description: "Boxes — panel de administración para tu tienda",
  icons: {
    icon: "/Boxes_logo_vectorizado.svg",
    shortcut: "/Boxes_logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SWRProvider>
          <AppShell>{children}</AppShell>
        </SWRProvider>
      </body>
    </html>
  );
}
