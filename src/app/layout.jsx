import PropTypes from "prop-types";
import "@/index.css";
import Layout from "@/components/Layout";

export const metadata = {
  title: "ERP Supermarket",
  description: "Panel de administración ERP Supermarket",
  icons: {
    icon: "/vite.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}

RootLayout.propTypes = {
  children: PropTypes.node,
};
