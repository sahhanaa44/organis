import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Assistant from "./pages/Assistant.jsx";

import DonorDashboard from "./pages/donor/Dashboard.jsx";
import DonorProfile from "./pages/donor/Profile.jsx";
import DonorOrgans from "./pages/donor/Organs.jsx";

import RecipientDashboard from "./pages/recipient/Dashboard.jsx";
import RecipientProfile from "./pages/recipient/Profile.jsx";
import RecipientWaitlist from "./pages/recipient/Waitlist.jsx";

import HospitalDashboard from "./pages/hospital/Dashboard.jsx";
import HospitalOrgans from "./pages/hospital/Organs.jsx";
import HospitalMatches from "./pages/hospital/Matches.jsx";
import HospitalAllocations from "./pages/hospital/Allocations.jsx";

import AdminDashboard from "./pages/admin/Dashboard.jsx";
import AdminUsers from "./pages/admin/Users.jsx";
import AdminDonors from "./pages/admin/Donors.jsx";
import AdminRecipients from "./pages/admin/Recipients.jsx";
import AdminOrgans from "./pages/admin/Organs.jsx";
import AdminMatches from "./pages/admin/Matches.jsx";
import AdminAllocations from "./pages/admin/Allocations.jsx";
import AdminAnalytics from "./pages/admin/Analytics.jsx";

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
      <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
      <Route
        path="/assistant"
        element={
          <>
            <Navbar />
            <Assistant />
          </>
        }
      />

      {/* Donor */}
      <Route path="/donor/dashboard" element={<ProtectedRoute roles={["donor"]}><DonorDashboard /></ProtectedRoute>} />
      <Route path="/donor/profile" element={<ProtectedRoute roles={["donor"]}><DonorProfile /></ProtectedRoute>} />
      <Route path="/donor/organs" element={<ProtectedRoute roles={["donor"]}><DonorOrgans /></ProtectedRoute>} />

      {/* Recipient */}
      <Route path="/recipient/dashboard" element={<ProtectedRoute roles={["recipient"]}><RecipientDashboard /></ProtectedRoute>} />
      <Route path="/recipient/profile" element={<ProtectedRoute roles={["recipient"]}><RecipientProfile /></ProtectedRoute>} />
      <Route path="/recipient/waitlist" element={<ProtectedRoute roles={["recipient"]}><RecipientWaitlist /></ProtectedRoute>} />

      {/* Hospital */}
      <Route path="/hospital/dashboard" element={<ProtectedRoute roles={["hospital"]}><HospitalDashboard /></ProtectedRoute>} />
      <Route path="/hospital/organs" element={<ProtectedRoute roles={["hospital"]}><HospitalOrgans /></ProtectedRoute>} />
      <Route path="/hospital/matches" element={<ProtectedRoute roles={["hospital"]}><HospitalMatches /></ProtectedRoute>} />
      <Route path="/hospital/allocations" element={<ProtectedRoute roles={["hospital"]}><HospitalAllocations /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={["admin"]}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/donors" element={<ProtectedRoute roles={["admin"]}><AdminDonors /></ProtectedRoute>} />
      <Route path="/admin/recipients" element={<ProtectedRoute roles={["admin"]}><AdminRecipients /></ProtectedRoute>} />
      <Route path="/admin/organs" element={<ProtectedRoute roles={["admin"]}><AdminOrgans /></ProtectedRoute>} />
      <Route path="/admin/matches" element={<ProtectedRoute roles={["admin"]}><AdminMatches /></ProtectedRoute>} />
      <Route path="/admin/allocations" element={<ProtectedRoute roles={["admin"]}><AdminAllocations /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute roles={["admin"]}><AdminAnalytics /></ProtectedRoute>} />

      <Route path="*" element={<PublicLayout><Landing /></PublicLayout>} />
    </Routes>
  );
}
