import { baseApi } from "./baseApi";
export const facturesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getFactures:      b.query({ 
      query: (p) => ({ url: "/kbs/factures", params: p }), 
      providesTags: ["Factures"],
      transformResponse: (response) => response.data || []
    }),
    getMesFactures:   b.query({ 
      query: () => "/kbs/factures/mes-factures", 
      providesTags: ["Factures"],
      transformResponse: (response) => response.data || []
    }),
    getFacture:       b.query({ 
      query: (id) => `/kbs/factures/${id}`,
      transformResponse: (response) => response.data
    }),
    getHistorique:    b.query({ 
      query: (id) => `/kbs/factures/${id}/historique`,
      transformResponse: (response) => response.data || []
    }),
    createFacture:    b.mutation({ query: (body) => ({ url: "/kbs/factures", method: "POST", body }), invalidatesTags: ["Factures"] }),
    updateFacture:    b.mutation({ query: ({ id, ...body }) => ({ url: `/kbs/factures/${id}`, method: "PUT", body }), invalidatesTags: ["Factures", "Dashboard"] }),
    validerFacture:   b.mutation({ query: ({ id, ...body }) => ({ url: `/kbs/factures/${id}/valider`, method: "PATCH", body }), invalidatesTags: ["Factures"] }),
    rejeterFacture:   b.mutation({ query: ({ id, ...body }) => ({ url: `/kbs/factures/${id}/rejeter`, method: "PATCH", body }), invalidatesTags: ["Factures"] }),
    telechargerFacture: b.query({ query: (id) => `/kbs/factures/${id}/telecharger` }),
  }),
});
export const { useGetFacturesQuery, useGetMesFacturesQuery, useGetFactureQuery, useGetHistoriqueQuery, useCreateFactureMutation, useUpdateFactureMutation, useValiderFactureMutation, useRejeterFactureMutation, useTelechargerFactureQuery } = facturesApi;
