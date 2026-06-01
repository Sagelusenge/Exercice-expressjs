import { createSlice } from "@reduxjs/toolkit";

const stored = localStorage.getItem("kbs_auth");
const initial = stored ? JSON.parse(stored) : { user: null, token: null, isAuthenticated: false };

const authSlice = createSlice({
  name: "auth",
  initialState: initial,
  reducers: {
    setCredentials: (state, { payload }) => {
      state.user = payload.user;
      state.token = payload.token;
      state.isAuthenticated = true;
      localStorage.setItem("kbs_auth", JSON.stringify(state));
    },
    updateUser: (state, { payload }) => {
      state.user = { ...state.user, ...payload };
      localStorage.setItem("kbs_auth", JSON.stringify(state));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem("kbs_auth");
    },
  },
});

export const { setCredentials, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;