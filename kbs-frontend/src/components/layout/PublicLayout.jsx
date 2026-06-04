import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ChatWidget from "../chat/ChatWidget";
import ChatWindow from "../chat/ChatWindow";
import { useState } from "react";

const PublicLayout = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
<div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      <main className="flex-1 pb-24 sm:pb-0">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget onOpen={() => setIsChatOpen(true)} />
      <ChatWindow 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
};

export default PublicLayout;