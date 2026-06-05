import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Facebook, Instagram, Mail, Phone, Share2 } from "lucide-react";
import toast from "react-hot-toast";

const Footer = () => {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [socialOpen, setSocialOpen] = useState(false);

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      toast.error("Veuillez saisir votre email");
      return;
    }
    toast.success("Merci pour votre inscription a la newsletter !");
    setNewsletterEmail("");
  };

  return (
    <footer className="bg-primary-container text-on-primary-container">
      <div className="kbs-container py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <img src="/kbs-logo.png" alt="KBS Building" className="h-12 w-12 rounded-full object-contain" />
              <span className="font-montserrat text-xl font-bold text-white">KBS Building</span>
            </div>
            <p className="max-w-xs text-label-md leading-relaxed text-on-primary-container/75">
              Des standards immobiliers plus clairs, plus rapides et plus fiables en RDC.
            </p>
          </div>

          <div>
            <h4 className="mb-5 text-label-md font-semibold uppercase tracking-wider text-white/90">Liens rapides</h4>
            <ul className="space-y-3">
              {[
                { label: "Accueil", path: "/" },
                { label: "Parcelles", path: "/parcelles" },
                { label: "A propos", path: "/" },
                { label: "Contact", path: "/" },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="text-label-md text-on-primary-container transition hover:text-secondary-container">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-label-md font-semibold uppercase tracking-wider text-white/90">Legal</h4>
            <ul className="space-y-3">
              {["Politique de confidentialite", "Conditions d'utilisation"].map((label) => (
                <li key={label}>
                  <Link to="/" className="text-label-md text-on-primary-container transition hover:text-secondary-container">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-label-md font-semibold uppercase tracking-wider text-white/90">Newsletter</h4>
            <p className="mb-4 text-label-md text-on-primary-container/75">
              Recevez les nouvelles annonces de parcelles.
            </p>
            <form onSubmit={handleNewsletter} className="flex gap-2">
              <input
                type="email"
                placeholder="Votre email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-label-md text-white outline-none placeholder:text-white/45 focus:border-secondary-container"
              />
              <button
                type="submit"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-on-secondary transition hover:bg-secondary-container hover:text-on-secondary-container"
                aria-label="S'inscrire a la newsletter"
              >
                <ArrowRight size={17} />
              </button>
            </form>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
          <button
            type="button"
            onClick={() => setSocialOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-label-md font-semibold text-white transition hover:bg-white/15"
          >
            <Share2 size={16} />
            Reseaux sociaux
          </button>
          {socialOpen && (
            <div className="flex items-center gap-2 animate-fade-in">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-secondary hover:text-on-secondary" aria-label="Facebook">
                <Facebook size={18} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-secondary hover:text-on-secondary" aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href="https://wa.me/243810000000" target="_blank" rel="noreferrer" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-secondary hover:text-on-secondary" aria-label="WhatsApp">
                <Phone size={18} />
              </a>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
          <p className="text-label-sm text-on-primary-container/60">
            Copyright {new Date().getFullYear()} KBS Real Estate Management. Tous droits reserves.
          </p>
          <div className="flex items-center gap-4 text-on-primary-container/70">
            <a href="mailto:contact@kbs-immobilier.com" className="transition hover:text-secondary-container" aria-label="Envoyer un email">
              <Mail size={16} />
            </a>
            <a href="tel:+243810000000" className="transition hover:text-secondary-container" aria-label="Nous appeler">
              <Phone size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
