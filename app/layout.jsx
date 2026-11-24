export const metadata = {
  title: "Atelier Garrigue (Next.js) – site d'exemple",
  description: "Site d'exemple pour tester l'installation automatique du formulaire BEUP via GitHub."
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: 'Georgia, serif', margin: 0 }}>{children}
      </body>
    </html>
  );
}
