import React from 'react';
import { useGetReservationsMesReservationsQuery, useAnnulerReservationMutation } from '../../../store/api/reservationsApi';
import { MapPin, Calendar, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const MesReservationsPage = () => {
  const { data: reservations, isLoading, error } = useGetReservationsMesReservationsQuery(undefined, {
    pollingInterval: 5000,
    refetchOnMountOrArgChange: true,
  });
  const [annulerReservation, { isLoading: isAnnuling }] = useAnnulerReservationMutation();

  const handleAnnuler = async (id) => {
    if (window.confirm('Voulez-vous vraiment annuler cette réservation ?')) {
      try {
        await annulerReservation(id).unwrap();
        toast.success('Réservation annulée');
      } catch (err) {
        toast.error('Erreur lors de l\'annulation');
      }
    }
  };

  if (isLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  if (error) {
    return <div className="p-6 text-error">Erreur: {error.message || 'Erreur de chargement'}</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Mes Réservations</h1>
        <p className="text-on-surface-variant text-sm">Suivez l'état de vos réservations de parcelles.</p>
      </div>

      <div className="bg-surface-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        {!reservations || reservations.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant">
            <p className="font-inter text-body-md">Vous n'avez aucune réservation en cours.</p>
          </div>
        ) : (
          <>
          <div className="grid gap-3 p-3 md:hidden">
            {reservations.map((row) => (
              <div key={row.id} className="rounded-lg border border-outline-variant bg-surface p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-primary">{row.ref_parcelle}</p>
                    <p className="mt-1 flex items-center gap-1 text-sm text-on-surface-variant">
                      <MapPin size={12} /> {row.ville}, {row.commune}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">{row.statut}</span>
                </div>
                <p className="text-sm text-on-surface-variant">
                  Reservee le {format(new Date(row.created_at), 'dd MMM yyyy', { locale: fr })}
                </p>
                {['EN_ATTENTE', 'EN_COURS'].includes(row.statut) && (
                  <button
                    onClick={() => handleAnnuler(row.id)}
                    disabled={isAnnuling}
                    className="mt-4 w-full rounded-lg border border-error/30 px-4 py-2 text-error disabled:opacity-50"
                  >
                    Annuler
                  </button>
                )}
              </div>
            ))}
          </div>
          <table className="hidden w-full md:table">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Parcelle</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Date de réservation</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Expire le</th>
                <th className="px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase">Statut</th>
                <th className="px-4 py-3 text-right text-label-sm font-semibold text-on-surface-variant uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((row) => (
                <tr key={row.id} className="border-b border-outline-variant hover:bg-surface-low">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-primary">{row.ref_parcelle}</span>
                      <span className="text-xs text-on-surface-variant flex items-center gap-1">
                        <MapPin size={10} /> {row.ville}, {row.commune}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm flex items-center gap-2">
                      <Calendar size={14} className="text-on-surface-variant" />
                      {format(new Date(row.created_at), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {row.date_expiration ? (
                      <span className="text-sm font-medium text-error flex items-center gap-2">
                        <Clock size={14} />
                        {format(new Date(row.date_expiration), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    ) : <span className="text-on-surface-variant italic">Pas d'expiration</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                      row.statut === 'CONFIRMEE' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : row.statut === 'ANNULEE'
                        ? 'bg-red-100 text-red-700'
                        : row.statut === 'EN_COURS'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {row.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end">
                      {['EN_ATTENTE', 'EN_COURS'].includes(row.statut) && (
                        <button
                          onClick={() => handleAnnuler(row.id)}
                          disabled={isAnnuling}
                          className="flex items-center gap-2 px-3 py-2 text-error hover:bg-error/10 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XCircle size={16} />
                          Annuler
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </>
        )}
      </div>
    </div>
  );
};

export default MesReservationsPage;
