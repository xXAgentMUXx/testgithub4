'use client';

import { useState } from 'react';

// Formulaire de contact EXISTANT du site (sert à tester « Connecter un formulaire déjà présent »).
export default function ContactForm() {
  const [values, setValues] = useState({ name: '', email: '', phone: '', message: '' });
  const [sent, setSent] = useState(false);

  const onChange = (e) => setValues({ ...values, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    // Après l'installation de l'adaptateur BEUP, appelez ici : await submitBeupForm(values);
    setSent(true);
  };

  if (sent) return <p>Merci, votre message a bien été envoyé.</p>;
  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10, maxWidth: 420 }}>
      <input name="name" placeholder="Nom et prénom" value={values.name} onChange={onChange} required />
      <input name="email" type="email" placeholder="Email" value={values.email} onChange={onChange} />
      <input name="phone" placeholder="Téléphone" value={values.phone} onChange={onChange} />
      <textarea name="message" placeholder="Votre message" value={values.message} onChange={onChange} />
      <button type="submit">Envoyer</button>
    </form>
  );
}
