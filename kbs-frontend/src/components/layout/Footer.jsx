import React from 'react'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">À propos</h3>
            <p className="text-gray-400">
              Plateforme de gestion immobilière complète
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Liens</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/" className="hover:text-white">Accueil</a></li>
              <li><a href="/parcelles" className="hover:text-white">Parcelles</a></li>
              <li><a href="/contact" className="hover:text-white">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <p className="text-gray-400">Email: info@kbs.com</p>
            <p className="text-gray-400">Tel: +1 234 567 8900</p>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
          <p>&copy; 2024 KBS. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
