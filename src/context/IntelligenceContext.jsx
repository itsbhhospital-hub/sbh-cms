import { createContext, useContext, useState, useEffect } from 'react';
import { sheetsService } from '../services/googleSheets';
import { useAuth } from './AuthContext';

const IntelligenceContext = createContext(null);

const normalize = (val) => String(val || '').toLowerCase().trim();

export const IntelligenceProvider = ({ children }) => {
    const { user } = useAuth();

    // ------------------------------------------------------------------
    // RAW DATA STATE
    // ------------------------------------------------------------------
    const [allTickets, setAllTickets] = useState([]);
    const [stats, setStats] = useState({
        open: 0, pending: 0, solved: 0, transferred: 0, extended: 0, delayed: 0, activeStaff: 0
    });
    const [users, setUsers] = useState([]);
    const [boosters, setBoosters] = useState([]);
    const [allRatings, setAllRatings] = useState([]);

    // System Monitor
    const [loading, setLoading] = useState(true);
    const [lastSync, setLastSync] = useState(null);

    // ------------------------------------------------------------------
    // INTELLIGENCE METRICS (Computed)
    // ------------------------------------------------------------------
    const [hospitalHealth, setHospitalHealth] = useState(100);
    const [stressIndex, setStressIndex] = useState(0);
    const [predictedDelays, setPredictedDelays] = useState([]); // Simple list for Dashboard

    // Director/Analytics Metrics
    const [deptRisks, setDeptRisks] = useState({}); // Detailed Dept Stats
    const [flowStats, setFlowStats] = useState({ open: 0, solved: 0, delayed: 0, transferred: 0 });
    const [staffStats, setStaffStats] = useState([]);
    const [detailedDelayRisks, setDetailedDelayRisks] = useState([]);
    const [alerts, setAlerts] = useState([]);

    // ------------------------------------------------------------------
    // 1. DATA SYNC ENGINE (20s Cycle)
    // ------------------------------------------------------------------
    const refreshIntelligence = async () => {
        if (!user) return;
        try {
            const isAdmin = ['admin', 'super_admin', 'superadmin'].includes(String(user.Role).toLowerCase());

            // Fetch Core Data + PRE-CALCULATED Performance Sheet
            const [statsData, fetchedUsers, allData, boosterData, ratingsData, perfData] = await Promise.all([
                sheetsService.getDashboardStats(user.Username, user.Department, user.Role),
                isAdmin ? sheetsService.getUsers() : Promise.resolve([]),
                sheetsService.getComplaints(false, true),
                sheetsService.getBoosters(true, true).catch(() => []),
                sheetsService.getRatings(false, true).catch(() => []),
                sheetsService.getAllUserPerformance(false, true).catch(() => []) // NEW: Single Source
            ]);

            if (statsData) setStats(prev => ({ ...prev, ...statsData }));
            if (fetchedUsers) setUsers(fetchedUsers);
            if (boosterData) setBoosters(boosterData);
            if (ratingsData) setAllRatings(ratingsData);

            // Populate Staff Stats directly from Sheet (Source of Truth)
            if (perfData && Array.isArray(perfData)) {
                // Normalize keys just in case
                const mappedStats = perfData.map(p => ({
                    Username: p.Username,
                    resolved: parseInt(p.TotalSolved || p.Solved || 0),
                    avgRating: parseFloat(p.AverageRating || p.Rating || 0),
                    ratingCount: parseInt(p.RatingCount || 0),
                    avgSpeed: parseFloat(p.AvgSpeed || p.AvgResolutionTime || 0),
                    rank: p.Rank || '-',
                    efficiency: parseFloat(p.Efficiency || 0),
                    delayed: parseInt(p.Delayed || 0),
                    // Keep breakdown for compatibility if needed, or default to 0s
                    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                }));
                setStaffStats(mappedStats);
            }

            if (allData) {
                setAllTickets(allData);
                // Trigger Systems Analysis (Risk, Flow, etc.) - user stats removed
                analyzeSystem(allData, ratingsData || []);
            }

            setLastSync(new Date());
        } catch (e) {
            console.warn("Intelligence Sync Failed:", e);
        }
    };

    useEffect(() => {
        let interval;
        if (user) {
            refreshIntelligence().finally(() => setLoading(false));
            interval = setInterval(refreshIntelligence, 20000); // 20s Live Pulse
        }
        return () => clearInterval(interval);
    }, [user]);

    // ------------------------------------------------------------------
    // 2. UNIFIED ANALYSIS ENGINE
    // ------------------------------------------------------------------
    const analyzeSystem = (tickets, ratings) => {
        if (!tickets || !tickets.length) return;

        const now = new Date();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // A. Base Counters
        let health = 100;
        let stress = 0;
        const flow = { open: 0, solved: 0, delayed: 0, transferred: 0 };
        const depts = {};
        const predictions = [];
        const detailedRisks = [];
        const alertList = [];

        tickets.forEach(t => {
            const status = String(t.Status || '').toLowerCase().trim();
            const dept = t.Department || 'General';
            const date = t.Date ? new Date(t.Date) : null;
            const solvedDate = t.ResolvedDate ? new Date(t.ResolvedDate) : null;
            const isActive = !['solved', 'closed'].includes(status);
            const isSolved = ['solved', 'closed'].includes(status);

            // Dept Init
            if (!depts[dept]) depts[dept] = { open: 0, solved: 0, pending: 0, delayed: 0, transfers: 0 };

            if (isActive) {
                if (status === 'open') { depts[dept].open++; flow.open++; }
                if (['pending', 'in-progress', 're-open'].includes(status)) { depts[dept].pending++; flow.open++; }
                // Risk Predictions
                if (date && !isNaN(date.getTime())) {
                    const hrsOpen = (now - date) / (1000 * 60 * 60);
                    if (hrsOpen > 18 && status !== 'delayed') {
                        predictions.push({ id: t.ID, dept: dept, reason: 'Open > 18hrs', chance: 'High' });
                        stress += 2;
                        detailedRisks.push({ ...t, riskLevel: 'HIGH', hours: hrsOpen.toFixed(1) });
                    } else if (hrsOpen > 12) {
                        stress += 1;
                        if (hrsOpen > 18) detailedRisks.push({ ...t, riskLevel: 'MEDIUM', hours: hrsOpen.toFixed(1) });
                    }
                }
            } else if (isSolved) {
                depts[dept].solved++;
                if (solvedDate && solvedDate >= startOfDay) flow.solved++;
            } else if (status === 'transferred') {
                depts[dept].transfers++;
                flow.transferred++;
            } else if (status === 'delayed') {
                depts[dept].delayed++;
                health -= 5;
                stress += 5;
                flow.delayed++;
            }
        });

        // NOTE: Manual Staff Stats calculation removed to prevent override.
        // We now fetch pre-calculated stats from 'User_Performance_Ratings' sheet.

        // E. Thresholds & Alerts
        if (stress > 50) health = Math.max(0, health - 20);
        if (tickets.length > 500) health -= 10;

        // Push-based Alerts
        if (health < 60) alertList.push({ type: 'critical', msg: 'System Stress Level High' });
        if (predictions.length > 5) alertList.push({ type: 'warning', msg: 'Multiple SLA Breaches Predicted' });

        // Update State
        setHospitalHealth(health);
        setStressIndex(stress);
        setPredictedDelays(predictions);
        setDeptRisks(depts);
        setFlowStats(flow);
        setDetailedDelayRisks(detailedRisks);
        setAlerts(alertList);
    };


    // ------------------------------------------------------------------
    // 3. EXPOSED HELPERS
    // ------------------------------------------------------------------
    const getAiCaseDecision = (ticket) => {
        const regDateStr = ticket.Date || ticket.Timestamp;
        let priority = { label: 'Normal', color: 'bg-slate-100 text-slate-500' };
        let delayRisk = false;

        if (!regDateStr) return { priority, delayRisk };

        const regDate = new Date(regDateStr);
        if (isNaN(regDate.getTime())) return { priority, delayRisk };

        const hrsOpen = (new Date() - regDate) / (1000 * 60 * 60);
        const status = String(ticket.Status).toLowerCase();

        if (status === 'delayed') {
            priority = { label: 'Delayed', color: 'bg-rose-100 text-rose-600' };
            delayRisk = true;
        } else if (hrsOpen > 18) {
            priority = { label: 'Critical', color: 'bg-rose-50 text-rose-600 border border-rose-200' };
            delayRisk = true;
        } else if (hrsOpen > 12) {
            priority = { label: 'High Risk', color: 'bg-amber-50 text-amber-600 border border-amber-200' };
            delayRisk = true;
        } else {
            priority = { label: 'Safe', color: 'bg-[#cfead6] text-[#2e7d32]' };
        }

        if (predictedDelays.find(p => String(p.id) === String(ticket.ID))) {
            delayRisk = true;
            if (priority.label === 'Safe') priority = { label: 'Predicted Delay', color: 'bg-orange-50 text-orange-600' };
        }

        return { priority, delayRisk };
    };

    const getCrisisRisk = () => {
        if (stressIndex > 70) return 'CRITICAL';
        if (stressIndex > 40) return 'ELEVATED';
        return 'NORMAL';
    };

    const getTransferSuggestion = (ticket) => {
        if (!ticket || !ticket.Description) return null;
        const desc = String(ticket.Description).toLowerCase();

        if (desc.includes('computer') || desc.includes('printer') || desc.includes('internet') || desc.includes('wifi') || desc.includes('software')) return 'IT';
        if (desc.includes('clean') || desc.includes('dust') || desc.includes('garbage') || desc.includes('washroom')) return 'HOUSE KEEPING';
        if (desc.includes('light') || desc.includes('fan') || desc.includes('ac ') || desc.includes('power') || desc.includes('leak')) return 'MAINTENANCE';
        if (desc.includes('medicine') || desc.includes('tablet') || desc.includes('drug')) return 'PHARMACY';
        if (desc.includes('bill') || desc.includes('payment') || desc.includes('refund')) return 'BILLING';
        if (desc.includes('salary') || desc.includes('leave') || desc.includes('attendance')) return 'HR';

        return null;
    };

    const getResolverRecommendation = (department) => {
        if (!department) return null;
        const targetDept = String(department).toLowerCase().trim();

        // 1. Identify all staff in this department
        const deptStaffNames = users
            .filter(u => String(u.Department || '').toLowerCase().trim() === targetDept)
            .map(u => String(u.Username).toLowerCase());

        if (deptStaffNames.length === 0) return null;

        // 2. Find the highest ranked staff member from this department in our performance stats
        // staffStats is already sorted by Efficiency desc
        const bestPerformer = staffStats.find(s => deptStaffNames.includes(String(s.name).toLowerCase()));

        if (bestPerformer) return bestPerformer.name;

        // 3. Fallback: If no stats, return the first staff member
        const firstUser = users.find(u => String(u.Department || '').toLowerCase().trim() === targetDept);
        return firstUser ? firstUser.Username : null;
    };

    return (
        <IntelligenceContext.Provider value={{
            allTickets,
            stats,
            users,
            boosters,
            allRatings,
            lastSync,
            loading,

            // Intelligence
            hospitalHealth,
            deptRisks,
            predictedDelays,
            stressIndex,
            crisisRisk: getCrisisRisk(),
            getAiCaseDecision,
            getTransferSuggestion,
            getResolverRecommendation,
            refreshIntelligence,

            // Advanced Analytics (Ported)
            flowStats,
            staffStats,
            detailedDelayRisks,
            alerts
        }}>
            {children}
        </IntelligenceContext.Provider>
    );
};

export const useIntelligence = () => useContext(IntelligenceContext);
