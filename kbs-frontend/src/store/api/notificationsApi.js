import { baseApi } from "./baseApi";
export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getNotifications:        b.query({ 
      query: (p) => ({ url: "/notifications", params: p }), 
      providesTags: ["Notifications"],
      transformResponse: (response) => response.data || []
    }),
    getNotificationsNonLues: b.query({ 
      query: () => "/notifications/non-lues", 
      providesTags: ["Notifications"],
      transformResponse: (response) => response.data || []
    }),
    getNotificationsCount:   b.query({ 
      query: () => "/notifications/count", 
      providesTags: ["Notifications"],
      transformResponse: (response) => response.data
    }),
    markRead:                b.mutation({ query: (id) => ({ url: `/notifications/${id}/lue`, method: "PATCH" }), invalidatesTags: ["Notifications"] }),
    markAllRead:             b.mutation({ query: () => ({ url: "/notifications/tout-lire", method: "PATCH" }), invalidatesTags: ["Notifications"] }),
  }),
});
export const { useGetNotificationsQuery, useGetNotificationsNonLuesQuery, useGetNotificationsCountQuery, useMarkReadMutation, useMarkAllReadMutation } = notificationsApi;