import { baseApi } from "./baseApi";

export const parcellesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /parcelles — v_parcelles_publiques (SANS prix)
    // 5 par ligne, 10 par page
    getParcellesPubliques: builder.query({
      query: (params) => ({ url: "/parcelles", params: { limit: 10, ...params } }),
      providesTags: ["Parcelles"],
      transformResponse: (response) => response.data || []
    }),

    // GET /parcelles/populaires — v_parcelles_populaires
    getParcellesPopulaires: builder.query({
      query: (limit = 10) => ({ url: "/parcelles/populaires", params: { limit } }),
      providesTags: ["Parcelles"],
      transformResponse: (response) => response.data || []
    }),

    // GET /parcelles/recherche — sp_recherche_parcelles
    rechercheAvancee: builder.query({
      query: (params) => ({ url: "/parcelles/recherche", params }),
      transformResponse: (response) => response.data || []
    }),

    // GET /parcelles/:id/public — SANS prix
    getParcellePublic: builder.query({
      query: (id) => `/parcelles/${id}/public`,
      providesTags: (r, e, id) => [{ type: "Parcelles", id }],
      transformResponse: (response) => response.data
    }),

    // ── Admin ──────────────────────────────────────────────
    // GET /parcelles/admin/liste — v_parcelles_admin (AVEC prix)
    getParcellesAdmin: builder.query({
      query: (params) => ({ url: "/parcelles/admin/liste", params: { limit: 10, ...params } }),
      providesTags: ["Parcelles"],
      transformResponse: (response) => response.data || []
    }),

    // GET /parcelles/:id/admin — détail admin avec prix
    getParcelleAdmin: builder.query({
      query: (id) => `/parcelles/${id}/admin`,
      providesTags: (r, e, id) => [{ type: "Parcelles", id }],
      transformResponse: (response) => response.data
    }),

    createParcelle: builder.mutation({
      query: (body) => ({ 
        url: "/parcelles", 
        method: "POST", 
        body,
        formData: true
      }),
      invalidatesTags: ["Parcelles"],
    }),

    updateParcelle: builder.mutation({
      query: ({ id, body }) => ({ 
        url: `/parcelles/${id}`, 
        method: "PUT", 
        body,
        formData: true
      }),
      invalidatesTags: ["Parcelles"],
    }),

    deleteParcelle: builder.mutation({
      query: (id) => ({ url: `/parcelles/${id}`, method: "DELETE" }),
      invalidatesTags: ["Parcelles"],
    }),

    addImage: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/parcelles/${id}/images`, method: "POST", body }),
      invalidatesTags: (r, e, { id }) => [{ type: "Parcelles", id }],
    }),

    addDocument: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/parcelles/${id}/documents`, method: "POST", body }),
      invalidatesTags: (r, e, { id }) => [{ type: "Parcelles", id }],
    }),
  }),
});

export const {
  useGetParcellesPubliquesQuery,
  useGetParcellesPopulairesQuery,
  useRechercheAvanceeQuery,
  useGetParcellePublicQuery,
  useGetParcellesAdminQuery,
  useGetParcelleAdminQuery,
  useCreateParcelleMutation,
  useUpdateParcelleMutation,
  useDeleteParcelleMutation,
  useAddImageMutation,
  useAddDocumentMutation,
} = parcellesApi;