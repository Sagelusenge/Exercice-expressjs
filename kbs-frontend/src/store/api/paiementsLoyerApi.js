import { baseApi } from './baseApi'

const paiementsLoyerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPaiementsLoyer: builder.query({
      query: (params) => ({ url: '/kbs/paiements-loyer', params }),
      providesTags: ['PaiementsLoyer'],
      transformResponse: (response) => response.data || []
    }),
    getMesPaiementsLoyer: builder.query({
      query: () => '/kbs/paiements-loyer/mes-paiements',
      providesTags: ['PaiementsLoyer'],
      transformResponse: (response) => response.data || []
    }),
    createPaiementLoyer: builder.mutation({
      query: (body) => ({
        url: '/kbs/paiements-loyer',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PaiementsLoyer', 'Factures', 'Dashboard'],
    }),
    updatePaiementLoyer: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/kbs/paiements-loyer/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['PaiementsLoyer', 'Factures', 'Dashboard'],
    }),
    deletePaiementLoyer: builder.mutation({
      query: (id) => ({
        url: `/kbs/paiements-loyer/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PaiementsLoyer', 'Factures', 'Dashboard'],
    }),
    validerPaiementLoyer: builder.mutation({
      query: (id) => ({
        url: `/kbs/paiements-loyer/${id}/valider`,
        method: 'PATCH',
      }),
      invalidatesTags: ['PaiementsLoyer', 'Factures', 'Dashboard'],
    }),
    rejeterPaiementLoyer: builder.mutation({
      query: (id) => ({
        url: `/kbs/paiements-loyer/${id}/rejeter`,
        method: 'PATCH',
      }),
      invalidatesTags: ['PaiementsLoyer', 'Factures', 'Dashboard'],
    }),
    getRapportMensuelLoyer: builder.query({
      query: () => '/kbs/paiements-loyer/rapport-mensuel',
      providesTags: ['PaiementsLoyer'],
      transformResponse: (response) => response.data || []
    }),
  }),
})

export const { 
  useGetPaiementsLoyerQuery, 
  useGetMesPaiementsLoyerQuery,
  useCreatePaiementLoyerMutation,
  useUpdatePaiementLoyerMutation,
  useDeletePaiementLoyerMutation,
  useValiderPaiementLoyerMutation,
  useRejeterPaiementLoyerMutation,
  useGetRapportMensuelLoyerQuery
} = paiementsLoyerApi

export default paiementsLoyerApi
