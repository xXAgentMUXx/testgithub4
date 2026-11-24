export const metadata = {
  title: "Atelier Garrigue (Next.js) – site d'exemple",
  description: "Site d'exemple pour tester l'installation automatique du formulaire BEUP via GitHub."
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: 'Georgia, serif', margin: 0 }}>{children}
        <script src="/testgithub4/beup-form-connector.js" defer data-beup-endpoint="https://shamanistic-keely-mincingly.ngrok-free.dev/api/public/site-integrations/beup_pub_bgw-6qG5YhZz_7AyeeHBemdpsKYTmGp4/submit"/>
      </body>
    </html>
  );
}
