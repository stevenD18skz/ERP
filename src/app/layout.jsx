import PropTypes from "prop-types";
import "@/index.css";
import AppShell from "@/components/layout/AppShell";

export const metadata = {
  title: "ERP Supermarket",
  description: "Panel de administración ERP Supermarket",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

RootLayout.propTypes = {
  children: PropTypes.node,
};
