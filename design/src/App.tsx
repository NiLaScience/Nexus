import React from "react";
import { MemoryRouter as Router, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Analytics } from "./components/Analytics";
import { Dashboard } from "./components/Dashboard";
import { Settings } from "./components/Settings";
import { TicketDetail } from "./components/TicketDetail";
import { TicketForm } from "./components/TicketForm";
import { TicketList } from "./components/TicketList";
import { KnowledgeBase } from "./components/KnowledgeBase";
export function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tickets" element={<TicketList />} />
          <Route path="/new" element={<TicketForm />} />
          <Route path="/ticket/:id" element={<TicketDetail />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/kb" element={<KnowledgeBase />} />
        </Routes>
      </Layout>
    </Router>
  );
}
