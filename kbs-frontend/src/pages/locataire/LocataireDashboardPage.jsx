import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowRight, Clock, FileCheck, MessageSquare, Receipt, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatters';
import { useGetMesFacturesQuery } from '../../store/api/facturesApi';
import { useGetMesPaiementsLoyerQuery } from '../../store/api/paiementsLoyerApi';

const QuickCard = ({ icon: Icon, title, count, subtitle, to, color }) => (
  <Link to={to} className="kbs-card kbs-card-hover p-5 group flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={22} className="text-on-secondary" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-montserrat font-bold text-2xl text-on-surface truncate">{count ?? 0}</p>
      <p className="text-label-md text-on-surface-variant">{title}</p>
      {subtitle && <p className="text-label-sm text-on-surface-variant truncate">{subtitle}</p>}
    </div>
    <ArrowRight size={16} className="text-on-surface-variant group-hover:translate-x-1 transition-transform" />
  </Link>
);

export default function LocataireDashboardPage() {
  const { user } = useSelector((s) => s.auth);
  const { data: facturesRes } = useGetMesFacturesQuery();
  const { data: paiementsRes } = useGetMesPaiementsLoyerQuery();

  const factures = facturesRes || [];
  const paiements = paiementsRes || [];
  const facturesOuvertes = factures.filter((f) => Number(f.montant_restant || 0) > 0 && f.statut !== 'REJETEE');
  const totalReste = facturesOuvertes.reduce((sum, f) => sum + Number(f.montant_restant || 0), 0);
  const dernierPaiement = paiements[0];
  const devise = factures[0]?.devise || dernierPaiement?.devise || 'USD';

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-4 kbs-card p-6 bg-primary-container text-on-primary-container">
        <Avatar nom={user?.nom} prenom={user?.prenom} photo_url={user?.photo_url} size="xl" />
        <div>
          <p className="text-label-md text-on-primary-container/60 mb-1">Bienvenue de retour</p>
          <h2 className="font-montserrat font-bold text-headline-md">
            {user?.nom} {user?.prenom}
          </h2>
          <p className="text-label-sm text-on-primary-container/60 mt-1 font-mono">
            {user?.code_user}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickCard
          icon={FileCheck}
          title="Factures a payer"
          count={facturesOuvertes.length}
          subtitle={formatCurrency(totalReste, devise)}
          to="/locataire/factures"
          color="bg-amber-500"
        />
        <QuickCard
          icon={Wallet}
          title="Paiements"
          count={paiements.length}
          subtitle={dernierPaiement ? `Dernier: ${formatCurrency(dernierPaiement.montant_paye, dernierPaiement.devise)}` : 'Aucun versement'}
          to="/locataire/paiements"
          color="bg-emerald-500"
        />
        <QuickCard
          icon={MessageSquare}
          title="Support"
          count="Chat"
          subtitle="Discussion directe avec ladmin"
          to="/locataire/chat"
          color="bg-secondary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="kbs-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
            <h3 className="font-montserrat font-semibold text-title-lg text-on-surface flex items-center gap-2">
              <Receipt size={18} /> Dernieres factures
            </h3>
            <Link to="/locataire/factures" className="text-label-md text-secondary hover:underline font-medium">
              Voir tout
            </Link>
          </div>
          <div className="divide-y divide-outline-variant">
            {factures.length === 0 ? (
              <p className="p-8 text-center text-on-surface-variant italic text-sm">Aucune facture disponible.</p>
            ) : (
              factures.slice(0, 5).map((facture) => (
                <div key={facture.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-12 h-12 bg-surface-high rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileCheck size={18} className="text-on-surface-variant" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-label-md font-semibold text-on-surface truncate">{facture.reference}</p>
                    <p className="text-label-sm text-on-surface-variant">
                      Reste: {formatCurrency(facture.montant_restant || 0, facture.devise)}
                    </p>
                  </div>
                  <Badge status={facture.statut} size="sm" />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="kbs-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
            <h3 className="font-montserrat font-semibold text-title-lg text-on-surface flex items-center gap-2">
              <Clock size={18} /> Derniers paiements
            </h3>
            <Link to="/locataire/paiements" className="text-label-md text-secondary hover:underline font-medium">
              Voir tout
            </Link>
          </div>
          <div className="divide-y divide-outline-variant">
            {paiements.length === 0 ? (
              <p className="p-8 text-center text-on-surface-variant italic text-sm">Aucun paiement enregistre.</p>
            ) : (
              paiements.slice(0, 5).map((paiement) => (
                <div key={paiement.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-12 h-12 bg-surface-high rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wallet size={18} className="text-on-surface-variant" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-label-md font-semibold text-on-surface">
                      {formatCurrency(paiement.montant_paye, paiement.devise)}
                    </p>
                    <p className="text-label-sm text-on-surface-variant">
                      {paiement.created_at ? format(new Date(paiement.created_at), 'dd MMM yyyy', { locale: fr }) : 'Date inconnue'}
                    </p>
                  </div>
                  <Badge status={paiement.statut} size="sm" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
