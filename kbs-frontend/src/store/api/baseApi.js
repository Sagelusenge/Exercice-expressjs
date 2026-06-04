import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseApi = createApi({
  reducerPath: "kbsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set("Authorization", `Bearer ${token}`);

      const tenantSlug = import.meta.env.VITE_TENANT_SLUG || "kbs-immobilier";
      headers.set("X-Tenant-Slug", tenantSlug);

      return headers;
    },
  }),
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: [
    "Parcelles", "Reservations", "Ventes", "Paiements",
    "Visites", "Favoris", "Users", "Locataires", "Factures",
    "PaiementsLoyer", "Rapports", "Notifications", "Chat",
    "Dashboard", "Parametres", "ActivityLogs",
  ],
  endpoints: () => ({}),
});

export default baseApi; // ✅ ajout du default export
