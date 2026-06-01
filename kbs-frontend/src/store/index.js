import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./api/baseApi";
import authReducer from "./slices/authSlice";
import notificationsReducer from "./slices/notificationsSlice";
import chatReducer from "./slices/chatSlice";

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    notifications: notificationsReducer,
    chat: chatReducer,
  },
  middleware: (getDefault) => getDefault().concat(baseApi.middleware),
});