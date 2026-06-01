import baseApi from './baseApi'

const paiementsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPaiements: builder.query({
      query: (params) => ({ url: '/paiements', params }),
      providesTags: ['Paiements'],
      transformResponse: (response) => response.data || []
    }),
    getPaiementsMesPaiements: builder.query({
      query: () => '/paiements/mes-paiements',
      providesTags: ['Paiements'],
      transformResponse: (response) => response.data || []
    }),
    validerPaiement: builder.mutation({
      query: (id) => ({ url: `/paiements/${id}/valider`, method: 'PATCH' }),
      invalidatesTags: ['Paiements']
    }),
    rejeterPaiement: builder.mutation({
      query: (id) => ({ url: `/paiements/${id}/rejeter`, method: 'PATCH' }),
      invalidatesTags: ['Paiements']
    }),
  }),
})

export const { useGetPaiementsQuery, useGetPaiementsMesPaiementsQuery, useValiderPaiementMutation, useRejeterPaiementMutation } = paiementsApi
