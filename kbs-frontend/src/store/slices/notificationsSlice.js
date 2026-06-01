import { createSlice } from "@reduxjs/toolkit";

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: { unreadCount: 0, list: [] },
  reducers: {
    setUnreadCount: (state, { payload }) => { state.unreadCount = payload; },
    addNotification: (state, { payload }) => { state.list.unshift(payload); state.unreadCount += 1; },
    markAllRead: (state) => { state.unreadCount = 0; state.list = state.list.map((n) => ({ ...n, est_lu: 1 })); },
  },
});
export const { setUnreadCount, addNotification, markAllRead } = notificationsSlice.actions;
export default notificationsSlice.reducer;