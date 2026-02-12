import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { sheetsService } from '../services/googleSheets';

const AnalyticsContext = createContext(null);

const normalize = (val) => String(val || '').toLowerCase().trim();

export const AnalyticsProvider = ({ children }) => {
    const { user } = useAuth();
    const [lastUpdated, setLastUpdated] = useState(new Date());

    // 1. Raw Data (Cached in Memory)
    const [allComplaints, setAllComplaints] = useState([]);
    const [allRatings, setAllRatings] = useState([]);
    const [loading, setLoading] = useState(true);

    // 2. Computed Metrics (Derived from Raw Data)
    const [deptStats, setDeptStats] = useState([]);
    const [staffStats, setStaffStats] = useState([]);
    const [delayRisks, setDelayRisks] = useState([]);
    const [flowStats, setFlowStats] = useState({ open: 0, solved: 0, delayed: 0, transferred: 0 });
    const [alerts, setAlerts] = useState([]);

    const isAdmin = user?.Role?.toUpperCase() === 'ADMIN' || user?.Role?.toUpperCase() === 'SUPER_ADMIN';

    // -------------------------------------------------------------------------
    // 🔄 POLLING ENGINE
    // -------------------------------------------------------------------------

    // Poll Data - Every 10s (Balances freshness vs API Quota)
    // "Real-time" effect is simulated by frequent UI updates, but data sync is 10s.
    useEffect(() => {
        if (!user) return;

        let isMounted = true;

        const fetchData = async () => {
            try {
                // Fetch Complaints (Silent Mode)
                const complaints = await sheetsService.getComplaints(true, true);
                // Fetch Ratings (Silent Mode)
                const ratings = await sheetsService.getRatings(true, true);

                if (isMounted) {
                    setAllComplaints(complaints);
                    setAllRatings(ratings);
                    setLastUpdated(new Date());
                    setLoading(false);
                }
            } catch (error) {
                console.error("Analytics Poll Failed:", error);
            }
        };

        // Initial Fetch
        fetchData();

        const interval = setInterval(fetchData, 30000);
        return () => {
            clearInterval(interval);
            isMounted = false;
        };
    }, [user]);

    // -------------------------------------------------------------------------
    // 🧠 INTELLIGENCE ENGINE (Runs when data changes)
    // -------------------------------------------------------------------------

    useEffect(() => {
        if (allComplaints.length === 0) return;

        const now = new Date();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // --- 1. Department Load & Flow Stats ---
        const depts = {};
        const flow = { open: 0, solved: 0, delayed: 0, transferred: 0 };
        const risks = [];
        const alertsList = [];

        // Staff Performance Map
        const staffMap = {};

        allComplaints.forEach(c => {
            const status = String(c.Status || '').toLowerCase();
            const dept = c.Department || 'Unknown';
            const resolver = c.ResolvedBy || c.AssignedTo || 'Unassigned';
            const date = c.Date ? new Date(c.Date) : null;
            const solvedDate = c.ResolvedDate ? new Date(c.ResolvedDate) : null;

            // Init Dept
            if (!depts[dept]) depts[dept] = { open: 0, pending: 0, delayed: 0, total: 0, solved: 0 };

            // Counts
            depts[dept].total++;
            if (status === 'open') {
                depts[dept].open++;
                flow.open++;
            } else if (['pending', 'in-progress', 're-open'].includes(status)) {
                depts[dept].pending++;
                flow.open++; // Count as active flow
            } else if (['solved', 'resolved', 'closed', 'force close'].includes(status)) {
                depts[dept].solved++;
                if (solvedDate && solvedDate >= startOfDay) flow.solved++;
            } else if (status === 'transferred') {
                flow.transferred++;
            } else if (status === 'delayed') {
                depts[dept].delayed++;
                flow.delayed++;
            }

            // --- Delay Risk Detection ---
            if (!['solved', 'resolved', 'closed', 'force close'].includes(status) && date) {
                const hoursOpen = (now - date) / (1000 * 60 * 60);

                // Actual Delayed Status
                if (status === 'delayed') {
                    // Already marked
                } else {
                    // Predicted Risk
                    if (hoursOpen > 22) {
                        risks.push({ ...c, riskLevel: 'HIGH', hours: hoursOpen.toFixed(1) });
                    } else if (hoursOpen > 18) {
                        risks.push({ ...c, riskLevel: 'MEDIUM', hours: hoursOpen.toFixed(1) });
                    }
                }
            }

            // --- Staff Metrics ---
            const normalizedResolver = resolver.toLowerCase().trim();
            if (resolver !== 'Unassigned') {
                if (!staffMap[normalizedResolver]) staffMap[normalizedResolver] = { name: resolver, solved: 0, ratings: [], active: 0 };

                if (['solved', 'resolved', 'closed', 'force close'].includes(status)) {
                    staffMap[normalizedResolver].solved++;
                } else {
                    staffMap[normalizedResolver].active++;
                }
            }
        });

        // --- 2. Staff Ratings Integration (Precise Sync) ---
        // Build Ticket -> Resolver map for precise attribution
        const ticketToResolver = {};
        allComplaints.forEach(c => {
            if (c.ID) ticketToResolver[c.ID.toString()] = normalize(c.ResolvedBy || c.AssignedTo || '');
        });

        allRatings.forEach(r => {
            const ticketId = (r.ID || r.TicketID || '').toString();
            const rating = parseInt(r.Rating);
            if (isNaN(rating)) return;

            // Priority 1: Match by Ticket ID (Most Accurate)
            const resolverFromTicket = ticketToResolver[ticketId];
            if (resolverFromTicket && staffMap[resolverFromTicket]) {
                staffMap[resolverFromTicket].ratings.push(rating);
                return;
            }

            // Priority 2: Match by Staff Name (Fallback)
            const rawStaffName = r['Staff Name'] || r['StaffName'] || r['Resolver'];
            const name = normalize(rawStaffName);
            if (name && staffMap[name]) {
                staffMap[name].ratings.push(rating);
            }
        });

        // Final Staff Stats Calculation
        const finalStaffStats = Object.values(staffMap).map(s => {
            const solvedCount = s.solved || 0;
            const avgRating = s.ratings.length ? (s.ratings.reduce((a, b) => a + b, 0) / s.ratings.length) : 0;

            // Calculate Speed & Delay per staff
            let staffSpeedHours = 0;
            let staffSpeedCount = 0;
            let staffDelayCount = 0;
            let staffTotalCases = 0;

            allComplaints.forEach(c => {
                const resolver = normalize(c.ResolvedBy || c.AssignedTo || '');
                if (resolver === s.name.toLowerCase().trim()) {
                    staffTotalCases++;
                    const status = String(c.Status || '').toLowerCase();
                    const isSolved = ['solved', 'resolved', 'closed', 'force close'].includes(status);

                    if (isSolved && c.Date && c.ResolvedDate) {
                        const d1 = new Date(c.Date);
                        const d2 = new Date(c.ResolvedDate);
                        if (d2 > d1) {
                            staffSpeedHours += (d2 - d1) / (1000 * 60 * 60);
                            staffSpeedCount++;
                        }
                    }

                    // Delay Check (matches backend logic)
                    const regDate = c.Date ? new Date(c.Date) : null;
                    let targetDate = c.TargetDate ? new Date(c.TargetDate) : null;
                    if (!targetDate && regDate) {
                        targetDate = new Date(regDate);
                        targetDate.setHours(targetDate.getHours() + 24);
                    }
                    if (targetDate) {
                        if (isSolved) {
                            const closedDate = c.ResolvedDate ? new Date(c.ResolvedDate) : new Date();
                            if (closedDate > targetDate) staffDelayCount++;
                        } else if (new Date() > targetDate) {
                            staffDelayCount++;
                        }
                    }
                }
            });

            const avgSpeed = staffSpeedCount > 0 ? (staffSpeedHours / staffSpeedCount) : 0;

            // MASTER FORMULA (Simplified as per plan): Average Rating * 10
            // This provides a scale of 0-50 based on quality.
            const efficiency = avgRating * 10;

            return {
                ...s,
                avgRating: avgRating.toFixed(1),
                efficiency: efficiency.toFixed(1),
                solved: solvedCount,
                avgSpeed: avgSpeed.toFixed(1),
                speedScore: (avgSpeed > 0 ? Math.min(30, (24 / avgSpeed) * 10) : (solvedCount > 0 ? 30 : 0)).toFixed(1),
                delayPenalty: (staffTotalCases > 0 ? Math.max(0, (1 - (staffDelayCount / staffTotalCases)) * 20) : 20).toFixed(1)
            };
        }).sort((a, b) => {
            // Sort Rule: 1. Efficiency, 2. Avg Rating, 3. Solved Count
            if (parseFloat(b.efficiency) !== parseFloat(a.efficiency)) return parseFloat(b.efficiency) - parseFloat(a.efficiency);
            if (parseFloat(b.avgRating) !== parseFloat(a.avgRating)) return parseFloat(b.avgRating) - parseFloat(a.avgRating);
            return b.solved - a.solved;
        }); // Excellence Registry Sorting

        // --- 3. Alerts Generation ---
        Object.entries(depts).forEach(([d, stats]) => {
            if (stats.open > 15) alertsList.push({ type: 'overload', msg: `High Load: ${d} (${stats.open} Active)` });
            if (stats.delayed > 5) alertsList.push({ type: 'delay', msg: `Delay Spike: ${d}` });
        });

        if (risks.length > 10) alertsList.push({ type: 'risk', msg: `${risks.length} Cases approaching Deadline` });

        // Update State
        setDeptStats(Object.entries(depts).map(([name, stats]) => ({ name, ...stats })));
        setStaffStats(finalStaffStats);
        setDelayRisks(risks);
        setFlowStats(flow);
        setAlerts(alertsList);

    }, [allComplaints, allRatings]);

    return (
        <AnalyticsContext.Provider value={{
            loading,
            lastUpdated,
            deptStats,
            staffStats,
            delayRisks,
            flowStats,
            alerts,
            isAdmin
        }}>
            {children}
        </AnalyticsContext.Provider>
    );
};

export const useAnalytics = () => useContext(AnalyticsContext);
