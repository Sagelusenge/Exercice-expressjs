import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
  name: "chat",
  initialState: { activeConversation: null, unread: 0 },
  reducers: {
    setActiveConversation: (state, { payload }) => { state.activeConversation = payload; },
    setUnread: (state, { payload }) => { state.unread = payload; },
  },
});
export const { setActiveConversation, setUnread } = chatSlice.actions;
export default chatSlice.reducer;