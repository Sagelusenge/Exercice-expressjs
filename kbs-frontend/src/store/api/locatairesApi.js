import { baseApi } from "./baseApi";
export const locatairesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getLocataires:          b.query({ 
      query: (p) => ({ url: "/kbs/locataires", params: p }), 
      providesTags: ["Locataires"],
      transformResponse: (response) => response.data || []
    }),
    getLocataire:           b.query({ 
      query: (id) => `/kbs/locataires/${id}`,
      transformResponse: (response) => response.data
    }),
    getMonProfilLocataire:  b.query({ 
      query: () => "/kbs/locataires/mon-profil", 
      providesTags: ["Locataires"],
      transformResponse: (response) => response.data
    }),
    getDashboardKbs:        b.query({ 
      query: () => "/kbs/locataires/dashboard",
      transformResponse: (response) => response.data
    }),
    createLocataire:        b.mutation({ query: (body) => ({ url: "/kbs/locataires", method: "POST", body }), invalidatesTags: ["Locataires"] }),
    updateLocataire:        b.mutation({ query: ({ id, ...body }) => ({ url: `/kbs/locataires/${id}`, method: "PUT", body }), invalidatesTags: ["Locataires"] }),
    deleteLocataire:        b.mutation({ query: (id) => ({ url: `/kbs/locataires/${id}`, method: "DELETE" }), invalidatesTags: ["Locataires"] }),
  }),
});
export const { useGetLocatairesQuery, useGetLocataireQuery, useGetMonProfilLocataireQuery, useGetDashboardKbsQuery, useCreateLocataireMutation, useUpdateLocataireMutation, useDeleteLocataireMutation } = locatairesApi;