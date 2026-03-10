import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AgentProvider } from './context/AgentContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import PharmacyLogin from './pages/PharmacyLogin';
import CustomerLogin from './pages/CustomerLogin';
import CustomerPortal from './pages/CustomerPortal';
import ThemeSelector from './pages/ThemeSelector';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Procurement from './pages/Procurement';
import ExpiryManager from './pages/ExpiryManager';
import FinancialSummary from './pages/FinancialSummary';
import SlowMovement from './pages/SlowMovement';
import CommunityBoard from './pages/CommunityBoard';
import PatientCare from './pages/PatientCare';
import AlertCenter from './pages/AlertCenter';
import DealerNetwork from './pages/DealerNetwork';
import Settings from './pages/Settings';

export default function App() {
    return (
        <BrowserRouter>
            <AgentProvider>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/pharmacy-login" element={<PharmacyLogin />} />
                    <Route path="/customer-login" element={<CustomerLogin />} />
                    <Route path="/customer-portal" element={<CustomerPortal />} />
                    <Route path="/theme-selector" element={<ThemeSelector />} />

                    {/* Dashboard Routes */}
                    <Route path="/dashboard" element={<Layout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="inventory" element={<Inventory />} />
                        <Route path="procurement" element={<Procurement />} />
                        <Route path="expiry" element={<ExpiryManager />} />
                        <Route path="slow-movement" element={<SlowMovement />} />
                        <Route path="financial" element={<FinancialSummary />} />
                        <Route path="community" element={<CommunityBoard />} />
                        <Route path="patient-care" element={<PatientCare />} />
                        <Route path="alerts" element={<AlertCenter />} />
                        <Route path="dealer-network" element={<DealerNetwork />} />
                        <Route path="settings" element={<Settings />} />
                    </Route>
                </Routes>
            </AgentProvider>
        </BrowserRouter>
    );
}
