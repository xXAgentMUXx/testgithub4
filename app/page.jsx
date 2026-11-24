import ContactForm from './ContactForm';

export default function HomePage() {
  return (
    <main style={{ maxWidth: 760, margin: '40px auto', padding: '0 20px' }}>
      <h1>Atelier Garrigue</h1>
      <p>Menuiserie sur mesure : cuisines, escaliers, placards. Site fictif de démonstration (Next.js).</p>
      <h2>Contact</h2>
      <ContactForm />
    </main>
  );
}
