import { baseApi } from './baseApi'

const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getConversations: builder.query({
      query: () => '/chat/conversations',
      providesTags: ['Chat'],
      transformResponse: (response) => response.data || [],
    }),
    getChatClients: builder.query({
      query: () => '/chat/clients',
      providesTags: ['Chat'],
      transformResponse: (response) => response.data || [],
    }),
    getMessages: builder.query({
      query: (conversationId) => `/chat/conversations/${conversationId}/messages`,
      providesTags: (result, error, id) => [{ type: 'Chat', id }],
      transformResponse: (response) => response.data || [],
    }),
    createConversation: builder.mutation({
      query: (data) => ({
        url: '/chat/conversations',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Chat'],
    }),
    getOrCreateDirectConversation: builder.mutation({
      query: (data = {}) => ({
        url: '/chat/conversations/direct',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Chat'],
      transformResponse: (response) => response.data,
    }),
    sendMessage: builder.mutation({
      query: ({ conversationId, ...data }) => ({
        url: `/chat/conversations/${conversationId}/messages`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: 'Chat', id: conversationId },
        'Chat',
        'Notifications',
      ],
    }),
    closeConversation: builder.mutation({
      query: (id) => ({
        url: `/chat/conversations/${id}/fermer`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Chat'],
    }),
  }),
})

export const { 
  useGetConversationsQuery, 
  useGetChatClientsQuery,
  useGetMessagesQuery, 
  useCreateConversationMutation, 
  useGetOrCreateDirectConversationMutation,
  useSendMessageMutation,
  useCloseConversationMutation 
} = chatApi

export default chatApi
