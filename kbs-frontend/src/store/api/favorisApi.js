import { baseApi } from './baseApi'; // ✅ named import

const favorisApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getFavoris: builder.query({
      query: () => '/favoris',
      providesTags: ['Favoris'],
      transformResponse: (response) => response.data || []
    }),

    addFavori: builder.mutation({
      query: (parcelleId) => ({
        url: `/favoris/${parcelleId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Favoris'],
    }),

    deleteFavori: builder.mutation({
      query: (parcelleId) => ({
        url: `/favoris/${parcelleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Favoris'],
    }),

  }),
  overrideExisting: false,
});

export const {
  useGetFavorisQuery,
  useAddFavoriMutation,       // ✅ correspond à ParcelleCatalogPage
  useDeleteFavoriMutation,    // ✅ correspond à ParcelleCatalogPage
} = favorisApi;

export default favorisApi;