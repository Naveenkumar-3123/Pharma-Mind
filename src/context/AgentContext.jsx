import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { runFullAgentScan } from '../utils/agentEngine';
import { donationListings, communityRequests } from '../data/mockData';

const AgentContext = createContext(null);

export function AgentProvider({ children }) {
    const [agentData, setAgentData] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [dismissedNotifs, setDismissedNotifs] = useState([]);
    const [scanCount, setScanCount] = useState(0);
    const [isScanning, setIsScanning] = useState(false);
    const [lastScanTime, setLastScanTime] = useState(null);
    const notifQueueRef = useRef([]);
    const notifTimerRef = useRef(null);

    // Network State
    const [flashSales, setFlashSales] = useState([]);
    const [dealerConnections, setDealerConnections] = useState([
        { id: '1', name: 'Apollo Pharmacy', code: 'APO', location: 'Downtown', status: 'approved' },
        { id: '2', name: 'MedPlus Pharmacy', code: 'MPL', location: 'Whitefield', status: 'approved' },
        { id: '3', name: 'Netmeds Store', code: 'NMS', location: 'Koramangala', status: 'approved' }
    ]);
    const [transferRequests, setTransferRequests] = useState([
        { id: 't1', fromCode: 'APO', fromName: 'Apollo Pharmacy', drug: 'Amlodipine 5mg', qty: 200, status: 'pending' },
        { id: 't2', fromCode: 'MPL', fromName: 'MedPlus Pharmacy', drug: 'Metformin 500mg', qty: 150, status: 'pending' }
    ]);
    const [outgoingTransfers, setOutgoingTransfers] = useState([
        { id: 'o1', toCode: 'APO', drug: 'Paracetamol 500mg', qty: 300, status: 'pending', date: new Date().toISOString() },
        { id: 'o2', toCode: 'NMS', drug: 'Cetirizine 10mg', qty: 100, status: 'approved', date: new Date().toISOString() }
    ]);

    // Customer Medicine Requests (harmonized with Community Board)
    const [customerMedicineRequests, setCustomerMedicineRequests] = useState(communityRequests);

    const addCustomerRequest = (req) => {
        setCustomerMedicineRequests(prev => [{
            ...req,
            id: Date.now().toString(),
            status: 'pending',
            date: new Date().toISOString().split('T')[0],
            // Map to community board UI format
            drugNeeded: req.medicine,
            requestor: req.customerName,
            contactInfo: req.contactInfo || 'Not Provided',
            condition: req.condition || '',
            story: req.story || '',
            neededBy: 'ASAP',
            urgency: 'High',
            icon: 'volunteer_activism'
        }, ...prev]);
    };

    const updateCustomerRequest = (id, status) => {
        setCustomerMedicineRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    };

    // Donations
    const [donations, setDonations] = useState(donationListings);

    const addDonation = (drugName, quantity, expiryDate) => {
        setDonations(prev => [{
            id: Date.now().toString(),
            drug: drugName,
            quantity: quantity,
            expiryDate: expiryDate
        }, ...prev]);
    };

    const addFlashSale = (item) => {
        setFlashSales(prev => [...prev, { ...item, flashId: Date.now().toString(), promoCode: item.promoCode || '' }]);
    };

    const addDealerConnection = (code, name, location) => {
        setDealerConnections(prev => [...prev, { id: Date.now().toString(), name: name || `Pharmacy ${code}`, code: code, location: location || 'Unknown', status: 'approved' }]);
    };

    const sendTransferRequest = (dealerCode, item, quantity) => {
        setOutgoingTransfers(prev => [...prev, {
            id: Date.now().toString(),
            toCode: dealerCode,
            drug: item.name,
            qty: quantity,
            status: 'pending',
            date: new Date().toISOString()
        }]);
    };

    // Run a full agent scan
    const runScan = useCallback(() => {
        setIsScanning(true);
        // Simulate slight delay for analysis
        setTimeout(() => {
            const result = runFullAgentScan();
            setAgentData(result);
            setScanCount(prev => prev + 1);
            setLastScanTime(new Date());
            setIsScanning(false);

            // Queue new alerts as toast notifications (drip-feed them)
            const newAlerts = result.tieredAlerts.filter(
                a => !dismissedNotifs.includes(a.id)
            );
            notifQueueRef.current = [...newAlerts];
        }, 800);
    }, [dismissedNotifs]);

    // Drip-feed notifications one at a time
    useEffect(() => {
        if (notifTimerRef.current) clearInterval(notifTimerRef.current);

        notifTimerRef.current = setInterval(() => {
            if (notifQueueRef.current.length > 0) {
                const next = notifQueueRef.current.shift();
                setNotifications(prev => {
                    // avoid duplicates by type+drug
                    const key = `${next.type}-${next.drugName}`;
                    if (prev.some(n => `${n.type}-${n.drugName}` === key)) return prev;
                    const updated = [next, ...prev].slice(0, 20); // keep max 20
                    return updated;
                });
            }
        }, 2500); // one notification every 2.5 seconds

        return () => clearInterval(notifTimerRef.current);
    }, []);

    // Initial scan on mount
    useEffect(() => {
        runScan();
    }, []);

    // Periodic re-scan every 30 seconds
    useEffect(() => {
        const interval = setInterval(runScan, 30000);
        return () => clearInterval(interval);
    }, [runScan]);

    const dismissNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        setDismissedNotifs(prev => [...prev, id]);
    };

    const dismissAllNotifications = () => {
        const ids = notifications.map(n => n.id);
        setNotifications([]);
        setDismissedNotifs(prev => [...prev, ...ids]);
    };

    return (
        <AgentContext.Provider value={{
            agentData,
            notifications,
            dismissNotification,
            dismissAllNotifications,
            scanCount,
            isScanning,
            lastScanTime,
            runScan,
            flashSales,
            addFlashSale,
            dealerConnections,
            addDealerConnection,
            transferRequests,
            setTransferRequests,
            outgoingTransfers,
            sendTransferRequest,
            customerMedicineRequests,
            addCustomerRequest,
            updateCustomerRequest,
            donations,
            addDonation
        }}>
            {children}
        </AgentContext.Provider>
    );
}

export function useAgent() {
    const ctx = useContext(AgentContext);
    if (!ctx) throw new Error('useAgent must be used within AgentProvider');
    return ctx;
}
