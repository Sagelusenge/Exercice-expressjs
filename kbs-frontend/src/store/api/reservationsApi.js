import { baseApi } from "./baseApi";
export const reservationsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getReservations:             b.query({ 
      query: (p) => ({ url: "/reservations", params: p }), 
      providesTags: ["Reservations"],
      transformResponse: (response) => response.data || []
    }),
    getReservationsMesReservations: b.query({ 
      query: () => "/reservations/mes-reservations", 
      providesTags: ["Reservations"],
      transformResponse: (response) => response.data || []
    }),
    getReservationsActives:      b.query({ 
      query: () => "/reservations/actives", 
      providesTags: ["Reservations"],
      transformResponse: (response) => response.data || []
    }),
    getReservation:              b.query({ 
      query: (id) => `/reservations/${id}`, 
      providesTags: (r,e,id) => [{ type:"Reservations", id }],
      transformResponse: (response) => response.data
    }),
    createReservation:           b.mutation({ query: (b) => ({ url: "/reservations", method: "POST", body: b }), invalidatesTags: ["Reservations","Parcelles"] }),
    updateReservationStatut:     b.mutation({ query: ({ id, ...b }) => ({ url: `/reservations/${id}/statut`, method: "PATCH", body: b }), invalidatesTags: ["Reservations"] }),
    annulerReservation:          b.mutation({ query: (id) => ({ url: `/reservations/${id}/annuler`, method: "PATCH" }), invalidatesTags: ["Reservations"] }),
  }),
});
export const { useGetReservationsQuery, useGetReservationsMesReservationsQuery, useGetReservationsActivesQuery, useCreateReservationMutation, useUpdateReservationStatutMutation, useAnnulerReservationMutation } = reservationsApi;