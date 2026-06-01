import React from 'react'
import ChatClientPage from './chat/ChatClientPage'
import MesReservationsPage from './reservations/MesReservationsPage'
import ClientDashboardPage from './ClientDashboardPage'
import ProfilePage from './ProfilePage'
import { useGetMesAchatsQuery } from '../../store/api/ventesApi'
import { useGetPaiementsMesPaiementsQuery } from '../../store/api/paiementsApi'
import { useGetVisitesMesVisitesQuery } from '../../store/api/visitesApi'

export { ChatClientPage, MesReservationsPage, ClientDashboardPage }

export const MesFavorisPage = () => (
  <div className="p-6 text-on-surface">
    <h1 className="text-3xl font-bold">Mes Favoris</h1>
    <p className="mt-4 text-on-surface-variant italic">En cours de developpement...</p>
  </div>
)

export const MesAchatsPage = () => {
  const { data = [] } = useGetMesAchatsQuery()
  return (
    <div className="p-6 text-on-surface space-y-4">
      <h1 className="text-3xl font-bold">Mes Achats</h1>
      {data.length === 0 ? <p className="text-on-surface-variant">Aucun achat pour le moment.</p> : (
        <div className="grid gap-3">
          {data.map((achat) => (
            <div key={achat.id} className="kbs-card p-4 flex justify-between gap-4">
              <div>
                <p className="font-semibold">{achat.titre_parcelle || achat.reference}</p>
                <p className="text-sm text-on-surface-variant">{achat.statut}</p>
              </div>
              <p className="font-bold">{achat.montant_total} {achat.devise}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const MesPaiementsPage = () => {
  const { data = [] } = useGetPaiementsMesPaiementsQuery()
  return (
    <div className="p-6 text-on-surface space-y-4">
      <h1 className="text-3xl font-bold">Mes Paiements</h1>
      {data.length === 0 ? <p className="text-on-surface-variant">Aucun paiement pour le moment.</p> : (
        <div className="grid gap-3">
          {data.map((paiement) => (
            <div key={paiement.id} className="kbs-card p-4 flex justify-between gap-4">
              <div>
                <p className="font-semibold">{paiement.reference_transaction || `Paiement #${paiement.id}`}</p>
                <p className="text-sm text-on-surface-variant">{paiement.statut}</p>
              </div>
              <p className="font-bold">{paiement.montant} {paiement.devise}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const MesVisitesPage = () => {
  const { data = [] } = useGetVisitesMesVisitesQuery()
  return (
    <div className="p-6 text-on-surface space-y-4">
      <h1 className="text-3xl font-bold">Mes Visites</h1>
      {data.length === 0 ? <p className="text-on-surface-variant">Aucune visite pour le moment.</p> : (
        <div className="grid gap-3">
          {data.map((visite) => (
            <div key={visite.id} className="kbs-card p-4 flex justify-between gap-4">
              <div>
                <p className="font-semibold">{visite.titre_parcelle || visite.ref_parcelle}</p>
                <p className="text-sm text-on-surface-variant">{visite.date_souhaitee} {visite.heure_souhaitee}</p>
              </div>
              <p className="font-semibold">{visite.statut}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const ProfilPage = ProfilePage
