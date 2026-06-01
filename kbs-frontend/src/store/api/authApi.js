import { baseApi } from "./baseApi";
import { setCredentials, logout } from "../slices/authSlice";

export const authApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    login:          b.mutation({ 
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: (response) => response.data 
    }),
    register:       b.mutation({ 
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      transformResponse: (response) => response.data 
    }),
    verifyEmail:    b.mutation({ 
      query: (body) => ({ url: "/auth/verify-email", method: "POST", body }),
      transformResponse: (response) => response.data 
    }),
    verifyCode:     b.mutation({ 
      query: (body) => ({ url: "/auth/verify-code", method: "POST", body }),
      transformResponse: (response) => response.data 
    }),
    resendCode:     b.mutation({ 
      query: (body) => ({ url: "/auth/resend-code", method: "POST", body }),
      transformResponse: (response) => response.data 
    }),
    getMe:          b.query({ 
      query: () => "/auth/me", 
      providesTags: ["Users"],
      transformResponse: (response) => response.data 
    }),
    changePassword: b.mutation({ 
      query: (body) => ({ url: "/auth/change-password", method: "PUT", body }),
      transformResponse: (response) => response.data 
    }),
    forgotPassword: b.mutation({ 
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }),
      transformResponse: (response) => response.data 
    }),
    resetPassword:  b.mutation({ 
      query: (body) => ({ url: "/auth/reset-password", method: "POST", body }),
      transformResponse: (response) => response.data 
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyEmailMutation,
  useVerifyCodeMutation,
  useResendCodeMutation,
  useGetMeQuery,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
