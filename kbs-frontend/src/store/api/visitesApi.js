import baseApi from './baseApi'

const visitesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVisites: builder.query({
      query: (params) => ({ url: '/visites', params }),
      providesTags: ['Visites'],
      transformResponse: (response) => response.data || []
    }),
    getVisitesMesVisites: builder.query({
      query: () => '/visites/mes-visites',
      providesTags: ['Visites'],
      transformResponse: (response) => response.data || []
    }),
    updateVisiteStatut: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/visites/${id}/statut`, method: 'PATCH', body }),
      invalidatesTags: ['Visites']
    }),
    createVisite: builder.mutation({
      query: (body) => ({ url: '/visites', method: 'POST', body }),
      invalidatesTags: ['Visites']
    }),
  }),
})

export const { useGetVisitesQuery, useGetVisitesMesVisitesQuery, useUpdateVisiteStatutMutation, useCreateVisiteMutation } = visitesApi
