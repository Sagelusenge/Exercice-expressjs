import React from 'react'
import ChatClientPage from '../client/chat/ChatClientPage'
import ProfilePage from '../client/ProfilePage'

export const LocataireDashboardPage = () => (
  <div className="text-on-surface">
    <h1 className="text-3xl font-bold">Dashboard Locataire</h1>
  </div>
)

export const MesFacturesPage = () => (
  <div className="text-on-surface">
    <h1 className="text-3xl font-bold">Mes Factures</h1>
  </div>
)

export const MesPaiementsLoyerPage = () => (
  <div className="text-on-surface">
    <h1 className="text-3xl font-bold">Mes Paiements de Loyer</h1>
  </div>
)

export const MonProfilLocatairePage = ProfilePage

export const ChatLocatairePage = ChatClientPage
