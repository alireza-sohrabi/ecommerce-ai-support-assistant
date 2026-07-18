import './global.css';

export const metadata = {
  title: 'E-commerce AI Support Assistant',
  description: 'A grounded AI assistant for e-commerce support teams.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
