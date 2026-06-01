import baseApi from './baseApi'

const parametresApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getParametres: builder.query({
      query: () => '/parametres',
      transformResponse: (response) => response.data
    }),
    updateParametres: builder.mutation({
      query: (data) => ({
        url: '/parametres',
        method: 'PUT',
        body: data,
      }),
    }),
  }),
})

export const { useGetParametresQuery, useUpdateParametresMutation } = parametresApi
