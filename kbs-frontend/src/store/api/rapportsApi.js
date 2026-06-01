import baseApi from './baseApi'

const rapportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRapports: builder.query({
      query: () => '/rapports',
      transformResponse: (response) => response.data || []
    }),
  }),
})

export const { useGetRapportsQuery } = rapportsApi
