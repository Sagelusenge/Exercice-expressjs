import React, { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  useGetDashboardAdminQuery 
} from '../../../store/api/dashboardApi';
import { 
  useGetParcellesAdminQuery 
} from '../../../store/api/parcellesApi';
import { 
  useGetVentesQuery 
} from '../../../store/api/ventesApi';
import { 
  useGetReservationsQuery 
} from '../../../store/api/reservationsApi';
import { 
  useGetUsersQuery 
} from '../../../store/api/usersApi';
import { 
  useGetFacturesQuery 
} from '../../../store/api/facturesApi';
import { 
  useGetPaiementsLoyerQuery 
} from '../../../store/api/paiementsLoyerApi';
import { 
  useGetLocatairesQuery 
} from '../../../store/api/locatairesApi';
import { 
  useGetPaiementsQuery 
} from '../../../store/api/paiementsApi';
import { 
  BarChart2, TrendingUp, DollarSign, Users, Building2, 
  Calendar, Download, Filter, FileText, FileSpreadsheet, FilePlus, ChevronDown 
} from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const RapportsPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const { data: dashRes, isLoading: dashLoading } = useGetDashboardAdminQuery();
  const { data: parcellesData, isLoading: parcellesLoading } = useGetParcellesAdminQuery({ limit: 1000 });
  const { data: ventesData, isLoading: ventesLoading } = useGetVentesQuery({ limit: 1000 });
  const { data: reservationsData, isLoading: resaLoading } = useGetReservationsQuery({ limit: 1000 });
  const { data: usersData, isLoading: usersLoading } = useGetUsersQuery({ limit: 1000 });
  const { data: facturesData, isLoading: facturesLoading } = useGetFacturesQuery({ limit: 1000 });
  const { data: paiementsLoyerData, isLoading: ployerLoading } = useGetPaiementsLoyerQuery({ limit: 1000 });
  const { data: locatairesData, isLoading: locatairesLoading } = useGetLocatairesQuery({ limit: 1000 });
  const { data: paiementsData, isLoading: paiementsLoading } = useGetPaiementsQuery({ limit: 1000 });

  const dash = dashRes || {};
  const parc = dash.parcelles || {};
  const usrs = dash.users || {};
  const vent = dash.ventes || {};
  const resa = dash.reservations || {};
  const kbs = dash.kbs_loyer || {};
  const ployer = dash.paiements_loyer || {};

  // Update data variables to use the new { data, pagination } format
  const parcelles = parcellesData?.data || [];
  const ventes = ventesData?.data || [];
  const reservations = reservationsData?.data || [];
  const users = usersData?.data || [];
  const factures = facturesData?.data || [];
  const paiementsLoyer = paiementsLoyerData?.data || [];
  const locataires = locatairesData?.data || [];
  const paiements = paiementsData?.data || [];

  // CSV export function
  const exportToCSV = (data, filename, headers) => {
    if (!data || data.length === 0) return;

    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header.toLowerCase().replace(/\s+/g, '_')] || row[header] || '';
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${format(new Date(), 'yyyyMMddHHmmss')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // PDF export function
  const exportToPDF = (data, title, filename, headers) => {
    if (!data || data.length === 0) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.text(`Généré le: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);

    // Prepare table data
    const tableData = data.map(row => 
      headers.map(header => 
        row[header.toLowerCase().replace(/\s+/g, '_')] || row[header] || ''
      )
    );

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      styles: { fontSize: 9 }
    });

    doc.save(`${filename}_${format(new Date(), 'yyyyMMddHHmmss')}.pdf`);
  };

  if (dashLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Rapports</h1>
            <p className="text-on-surface-variant text-sm">Statistiques financières et opérationnelles.</p>
          </div>
          <div className="flex gap-4 items-center">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
            </select>

            {/* Export Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-container transition"
              >
                <Download size={16} />
                Exporter
                <ChevronDown size={16} />
              </button>

              {showExportDropdown && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-outline-variant rounded-lg shadow-lg z-50">
                  <div className="p-2 space-y-1">
                    <p className="px-3 py-1 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">CSV</p>
                    <button 
                      onClick={() => {
                        exportToCSV(parcelles, 'rapport_parcelles', ['Référence', 'Type', 'Statut', 'Prix', 'Ville', 'Surface']);
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-surface-low text-label-md"
                      disabled={!parcelles || parcelles.length === 0}
                    >
                      Parcelles
                    </button>
                    <button 
                      onClick={() => {
                        exportToCSV(ventes, 'rapport_ventes', ['Référence', 'Client', 'Parcelle', 'Montant', 'Statut', 'Date']);
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-surface-low text-label-md"
                      disabled={!ventes || ventes.length === 0}
                    >
                      Ventes
                    </button>
                    <button 
                      onClick={() => {
                        exportToCSV(reservations, 'rapport_reservations', ['Référence', 'Client', 'Parcelle', 'Statut', 'Date Début', 'Date Fin']);
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-surface-low text-label-md"
                      disabled={!reservations || reservations.length === 0}
                    >
                      Réservations
                    </button>
                    <button 
                      onClick={() => {
                        exportToCSV(users, 'rapport_utilisateurs', ['Référence', 'Nom', 'Prénom', 'Email', 'Rôle', 'Statut']);
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-surface-low text-label-md"
                      disabled={!users || users.length === 0}
                    >
                      Utilisateurs
                    </button>
                    <button 
                      onClick={() => {
                        exportToCSV(locataires, 'rapport_locataires', ['Référence', 'Nom', 'Prénom', 'Email', 'Statut', 'Logement']);
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-surface-low text-label-md"
                      disabled={!locataires || locataires.length === 0}
                    >
                      Locataires
                    </button>
                    <button 
                      onClick={() => {
                        exportToCSV(factures, 'rapport_factures', ['Référence', 'Locataire', 'Montant', 'Statut', 'Date Période']);
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-surface-low text-label-md"
                      disabled={!factures || factures.length === 0}
                    >
                      Factures
                    </button>
                    <button 
                      onClick={() => {
                        exportToCSV(paiementsLoyer, 'rapport_paiements_loyer', ['Référence', 'Locataire', 'Montant', 'Statut', 'Date']);
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-surface-low text-label-md"
                      disabled={!paiementsLoyer || paiementsLoyer.length === 0}
                    >
                      Paiements Loyer
                    </button>
                    
                    <div className="border-t border-outline-variant my-2"></div>
                    
                    <p className="px-3 py-1 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">PDF</p>
                    <button 
                      onClick={() => {
                        exportToPDF(parcelles, 'Rapport Parcelles', 'rapport_parcelles', ['Référence', 'Type', 'Statut', 'Prix', 'Ville', 'Surface']);
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-surface-low text-label-md"
                      disabled={!parcelles || parcelles.length === 0}
                    >
                      Parcelles
                    </button>
                    <button 
                      onClick={() => {
                        exportToPDF(ventes, 'Rapport Ventes', 'rapport_ventes', ['Référence', 'Client', 'Parcelle', 'Montant', 'Statut', 'Date']);
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-surface-low text-label-md"
                      disabled={!ventes || ventes.length === 0}
                    >
                      Ventes
                    </button>
                    <button 
                      onClick={() => {
                        exportToPDF(reservations, 'Rapport Réservations', 'rapport_reservations', ['Référence', 'Client', 'Parcelle', 'Statut', 'Date Début', 'Date Fin']);
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-surface-low text-label-md"
                      disabled={!reservations || reservations.length === 0}
                    >
                      Réservations
                    </button>
                    <button 
                      onClick={() => {
                        exportToPDF(users, 'Rapport Utilisateurs', 'rapport_utilisateurs', ['Référence', 'Nom', 'Prénom', 'Email', 'Rôle', 'Statut']);
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-surface-low text-label-md"
                      disabled={!users || users.length === 0}
                    >
                      Utilisateurs
                    </button>
                    <button 
                      onClick={() => {
                        exportToPDF(locataires, 'Rapport Locataires', 'rapport_locataires', ['Référence', 'Nom', 'Prénom', 'Email', 'Statut', 'Logement']);
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-surface-low text-label-md"
                      disabled={!locataires || locataires.length === 0}
                    >
                      Locataires
                    </button>
                    <button 
                      onClick={() => {
                        exportToPDF(factures, 'Rapport Factures', 'rapport_factures', ['Référence', 'Locataire', 'Montant', 'Statut', 'Date Période']);
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-surface-low text-label-md"
                      disabled={!factures || factures.length === 0}
                    >
                      Factures
                    </button>
                    <button 
                      onClick={() => {
                        exportToPDF(paiementsLoyer, 'Rapport Paiements Loyer', 'rapport_paiements_loyer', ['Référence', 'Locataire', 'Montant', 'Statut', 'Date']);
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-surface-low text-label-md"
                      disabled={!paiementsLoyer || paiementsLoyer.length === 0}
                    >
                      Paiements Loyer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">
              Inventaire Total
            </p>
            <div className="p-2.5 rounded-xl bg-blue-50">
              <Building2 size={18} className="text-blue-600" />
            </div>
          </div>
          <p className="font-montserrat font-bold text-3xl text-on-surface">{parc.total ?? 0}</p>
          <p className="text-xs text-on-surface-variant mt-1">Toutes parcelles</p>
        </div>

        <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">
              Clients Actifs
            </p>
            <div className="p-2.5 rounded-xl bg-emerald-50">
              <Users size={18} className="text-emerald-600" />
            </div>
          </div>
          <p className="font-montserrat font-bold text-3xl text-on-surface">{usrs.clients ?? 0}</p>
          <p className="text-xs text-on-surface-variant mt-1">{usrs.en_attente ?? 0} en attente</p>
        </div>

        <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">
              Revenu Total
            </p>
            <div className="p-2.5 rounded-xl bg-secondary-container">
              <DollarSign size={18} className="text-secondary" />
            </div>
          </div>
          <p className="font-montserrat font-bold text-3xl text-on-surface">
            {vent.revenu_total ? formatCurrency(vent.revenu_total) : formatCurrency(0)}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">{vent.ventes_completes ?? 0} ventes</p>
        </div>

        <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">
              Locataires
            </p>
            <div className="p-2.5 rounded-xl bg-purple-50">
              <Building2 size={18} className="text-purple-600" />
            </div>
          </div>
          <p className="font-montserrat font-bold text-3xl text-on-surface">{kbs.total_locataires ?? 0}</p>
          <p className="text-xs text-on-surface-variant mt-1">{kbs.en_retard ?? 0} retards</p>
        </div>
      </div>

      {/* Sections détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventes */}
        <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <TrendingUp size={20} className="text-secondary" />
              Ventes
            </h3>
            <span className="text-sm text-on-surface-variant">
              {vent.ventes_completes ?? 0} ventes complètes
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-surface-low rounded-lg">
              <span className="text-sm text-on-surface-variant">Revenu total</span>
              <span className="font-bold text-on-surface">
                {vent.revenu_total ? formatCurrency(vent.revenu_total) : formatCurrency(0)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-surface-low rounded-lg">
              <span className="text-sm text-on-surface-variant">En cours</span>
              <span className="font-bold text-on-surface">{vent.en_cours ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Réservations */}
        <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <Calendar size={20} className="text-amber-600" />
              Réservations
            </h3>
            <span className="text-sm text-on-surface-variant">
              {resa.total ?? 0} total
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-surface-low rounded-lg">
              <span className="text-sm text-on-surface-variant">En attente</span>
              <span className="font-bold text-on-surface">{resa.en_attente ?? 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-surface-low rounded-lg">
              <span className="text-sm text-on-surface-variant">Confirmées</span>
              <span className="font-bold text-on-surface">{resa.confirmees ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Paiements Loyer */}
        <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <DollarSign size={20} className="text-emerald-600" />
              Paiements Loyer
            </h3>
            <span className="text-sm text-on-surface-variant">
              {ployer.total ?? 0} paiements
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-surface-low rounded-lg">
              <span className="text-sm text-on-surface-variant">Total perçu</span>
              <span className="font-bold text-on-surface">
                {ployer.total_perçu ? formatCurrency(ployer.total_perçu) : formatCurrency(0)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-surface-low rounded-lg">
              <span className="text-sm text-on-surface-variant">En attente</span>
              <span className="font-bold text-on-surface">{ployer.en_attente ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Locataires */}
        <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <Building2 size={20} className="text-purple-600" />
              Locataires
            </h3>
            <span className="text-sm text-on-surface-variant">
              {kbs.total ?? 0} total
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-surface-low rounded-lg">
              <span className="text-sm text-on-surface-variant">À jour</span>
              <span className="font-bold text-on-surface">{kbs.a_jour ?? 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-surface-low rounded-lg">
              <span className="text-sm text-on-surface-variant">En retard</span>
              <span className="font-bold text-on-surface">{kbs.en_retard ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rapports générés */}
      <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <FileText size={20} className="text-on-surface-variant" />
            Rapports Générés
          </h3>
          <button className="flex items-center gap-2 px-3 py-2 border border-outline-variant rounded-lg hover:bg-surface-low transition text-sm">
            <Filter size={14} />
            Filtrer
          </button>
        </div>
        <div className="text-center py-8 text-on-surface-variant">
          <p className="text-sm">Aucun rapport généré pour le moment.</p>
        </div>
      </div>
    </div>
  );
};

export default RapportsPage;
