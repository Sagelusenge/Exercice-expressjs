import React from 'react'

export const LoginPage = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <h1 className="text-2xl font-bold mb-6">Connexion</h1>
      <form>
        <div className="mb-4">
          <input type="email" placeholder="Email" className="w-full px-4 py-2 border rounded-lg" />
        </div>
        <div className="mb-6">
          <input type="password" placeholder="Mot de passe" className="w-full px-4 py-2 border rounded-lg" />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg">
          Connexion
        </button>
      </form>
    </div>
  </div>
)

export const RegisterPage = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <h1 className="text-2xl font-bold mb-6">Inscription</h1>
      <form>
        <div className="mb-4">
          <input type="text" placeholder="Nom" className="w-full px-4 py-2 border rounded-lg" />
        </div>
        <div className="mb-4">
          <input type="email" placeholder="Email" className="w-full px-4 py-2 border rounded-lg" />
        </div>
        <div className="mb-6">
          <input type="password" placeholder="Mot de passe" className="w-full px-4 py-2 border rounded-lg" />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg">
          S'inscrire
        </button>
      </form>
    </div>
  </div>
)

export const VerifyEmailPage = () => (
  <div className="min-h-screen flex items-center justify-center">
    <p>Vérification d'email</p>
  </div>
)

export const ChangePasswordPage = () => (
  <div className="min-h-screen flex items-center justify-center">
    <p>Changer le mot de passe</p>
  </div>
)
