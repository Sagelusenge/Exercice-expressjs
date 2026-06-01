import { baseApi } from "./baseApi";

export const ventesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getVentes:        b.query({ 
      query: (p) => ({ url: "/ventes", params: p }), 
      providesTags: ["Ventes"],
      transformResponse: (response) => response.data || []
    }),
    getMesAchats:     b.query({ 
      query: () => "/ventes/mes-achats", 
      providesTags: ["Ventes"],
      transformResponse: (response) => response.data || []
    }),
    getVente:         b.query({ 
      query: (id) => `/ventes/${id}`, 
      providesTags: (r,e,id) => [{ type:"Ventes", id }],
      transformResponse: (response) => response.data
    }),
    createVente:      b.mutation({ 
      query: (body) => ({ url: "/ventes", method: "POST", body }), 
      invalidatesTags: ["Ventes"],
      transformResponse: (response) => response.data
    }),
    updateVente:      b.mutation({ 
      query: ({ id, ...body }) => ({ url: `/ventes/${id}`, method: "PUT", body }), 
      invalidatesTags: ["Ventes"],
      transformResponse: (response) => response.data
    }),
    deleteVente:      b.mutation({ 
      query: (id) => ({ url: `/ventes/${id}`, method: "DELETE" }), 
      invalidatesTags: ["Ventes"],
      transformResponse: (response) => response.data
    }),
    confirmerVente:   b.mutation({ 
      query: (id) => ({ url: `/ventes/${id}/confirmer`, method: "PATCH" }), 
      invalidatesTags: ["Ventes"],
      transformResponse: (response) => response.data
    }),
    getRapportFinancier: b.query({ 
      query: () => "/ventes/rapport-financier", 
      providesTags: ["Ventes"],
      transformResponse: (response) => response.data || []
    }),
  }),
});

export const { 
  useGetVentesQuery, 
  useGetMesAchatsQuery, 
  useGetVenteQuery, 
  useCreateVenteMutation, 
  useUpdateVenteMutation,
  useDeleteVenteMutation,
  useConfirmerVenteMutation, 
  useGetRapportFinancierQuery 
} = ventesApi;
