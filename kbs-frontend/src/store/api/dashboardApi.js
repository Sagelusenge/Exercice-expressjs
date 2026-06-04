import { baseApi } from "./baseApi";
export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getDashboardAdmin:     b.query({ 
      query: () => "/dashboard/admin",            
      providesTags: ["Dashboard"],
      transformResponse: (response) => response.data
    }),
    getDashboardParcelles: b.query({ 
      query: () => "/dashboard/parcelles",        
      providesTags: ["Dashboard"],
      transformResponse: (response) => response.data
    }),
    getDashboardUsers:     b.query({ 
      query: () => "/dashboard/users",            
      providesTags: ["Dashboard"],
      transformResponse: (response) => response.data
    }),
    getDashboardKbs:       b.query({ 
      query: () => "/dashboard/kbs",              
      providesTags: ["Dashboard"],
      transformResponse: (response) => response.data
    }),
    getPublicStats:        b.query({
      query: () => "/dashboard/public-stats",
      providesTags: ["Dashboard"],
      transformResponse: (response) => response.data
    }),
    getActivitesRecentes:  b.query({ 
      query: (l=20) => ({ url: "/dashboard/activites", params: { limit: l } }), 
      providesTags: ["ActivityLogs"],
      transformResponse: (response) => response.data || []
    }),
    getRapportFinancier:   b.query({ 
      query: () => "/dashboard/rapport-financier",
      providesTags: ["Dashboard"],
      transformResponse: (response) => response.data
    }),
  }),
});
export const { useGetDashboardAdminQuery, useGetDashboardParcellesQuery, useGetDashboardUsersQuery, useGetDashboardKbsQuery, useGetPublicStatsQuery, useGetActivitesRecentesQuery, useGetRapportFinancierQuery } = dashboardApi;
