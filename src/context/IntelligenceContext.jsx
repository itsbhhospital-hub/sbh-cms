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

            const [statsData, fetchedUsers, allData, boosterData, ratingsData] = await Promise.all([
                sheetsService.getDashboardStats(user.Username, user.Department, user.Role),
                isAdmin ? sheetsService.getUsers() : Promise.resolve([]),
                sheetsService.getComplaints(false, true),
                sheetsService.getBoosters(true, true).catch(() => []),
                sheetsService.getRatings(false, true).catch(() => [])
            ]);

            if (statsData) setStats(prev => ({ ...prev, ...statsData }));
            if (fetchedUsers) setUsers(fetchedUsers);
            if (boosterData) setBoosters(boosterData);
            if (ratingsData) setAllRatings(ratingsData);

            if (allData) {
                setAllTickets(allData);
                // Trigger Unified Analysis
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

        // --- NEW STAFF CALCULATION LOGIC ---
        // 1. Initialize Staff Map from Users List (Ensure everyone is tracked)
        const staffMap = {};
        if (users && users.length > 0) {
            users.forEach(u => {
                const uname = normalize(u.Username);
                if (uname) {
                    staffMap[uname] = {
                        username: u.Username, // Preserve original casing for display
                        dept: u.Department,
                        role: u.Role,
                        solved: 0,
                        delayed: 0,
                        active: 0,
                        ratings: [],
                        speedHours: [],
                        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                    };
                }
            });
        }

        // B. Ticket Processing
        tickets.forEach(t => {
            const dept = t.Department || 'Unknown';
            const status = String(t.Status || '').toLowerCase();
            const resolver = normalize(t.ResolvedBy || t.AssignedTo);
            const reporter = normalize(t.ReportedBy);
            const date = t.Date ? new Date(t.Date) : null;
            const solvedDate = t.ResolvedDate ? new Date(t.ResolvedDate) : null;

            // Init Dept Structure
            if (!depts[dept]) depts[dept] = { open: 0, delayed: 0, transfers: 0, total: 0, pending: 0, solved: 0 };
            depts[dept].total++;

            // Global Flow Counters
            const isActive = ['open', 'pending', 'transferred', 're-open', 'in-progress'].includes(status);
            const isSolved = ['solved', 'resolved', 'closed', 'force close'].includes(status);

            if (isActive) {
                if (status === 'open') { depts[dept].open++; flow.open++; }
                if (['pending', 'in-progress', 're-open'].includes(status)) { depts[dept].pending++; flow.open++; }
                // Risk Predictions (Legacy Logic Preserved)
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

            // --- STAFF METRICS LINKING ---
            // We want to attribute 'Solved' cases to the resolver.
            // If the resolver exists in our map (from users list), update them.
            // If not (maybe deleted user or typo), we skip or add if strict mode off. 
            // Here we only update if they exist to match "User Work Report" valid users.

            if (isSolved && resolver && staffMap[resolver]) {
                staffMap[resolver].solved++;

                // Speed Calculation
                if (date && solvedDate && solvedDate > date) {
                    const hours = (solvedDate - date) / (1000 * 60 * 60);
                    staffMap[resolver].speedHours.push(hours);
                }

                // Delayed Resolutions (Solved AND Delay=Yes)
                // Normalize delay check: 'yes', 'true', or just truthy if boolean
                const isDelayed = String(t.Delay || '').toLowerCase().trim();
                // We check basic 'yes' or 'true'. 
                if (isDelayed === 'yes' || isDelayed === 'true' || isDelayed === 'delayed') {
                    staffMap[resolver].delayed++;
                }
            }

            // Note: We are NO LONGER counting 'status === delayed' for staff metrics 
            // because the requirement "Delayed Resolutions" implies Solved tickets.
            // Active delays are still tracked in Dept stats.
        });

        // C. Rating Allocation
        const ticketToResolver = {};
        tickets.forEach(c => {
            if (c.ID) ticketToResolver[c.ID.toString()] = normalize(c.ResolvedBy || c.AssignedTo || '');
        });

        ratings.forEach(r => {
            const ticketId = (r.ID || r.TicketID || '').toString();
            const rating = parseInt(r.Rating);
            if (isNaN(rating)) return;

            // Link Rating -> Ticket -> Resolver
            const resolver = ticketToResolver[ticketId];
            if (resolver && staffMap[resolver]) {
                staffMap[resolver].ratings.push(rating);
                // Star Breakdown
                if (rating >= 1 && rating <= 5) {
                    staffMap[resolver].breakdown[rating]++;
                }
            }
        });

        // D. Final Staff Stats Calculation & Global Ranking
        // Find Max Solved for normalization
        const maxSolved = Math.max(...Object.values(staffMap).map(s => s.solved), 1);

        const finalStaffStats = Object.values(staffMap).map(s => {
            // 1. Avg Rating
            const totalStars = s.ratings.reduce((a, b) => a + b, 0);
            const avgRating = s.ratings.length ? (totalStars / s.ratings.length) : 0;

            // 2. Avg Speed
            const totalSpeedHours = s.speedHours.reduce((a, b) => a + b, 0);
            const avgSpeed = s.speedHours.length ? (totalSpeedHours / s.speedHours.length) : 0;

            // 3. Efficiency Calculation
            // Rating Score (40%): (Avg / 5) * 100
            const ratingScore = (avgRating / 5) * 100;

            // Speed Score (30%): Linear 0-100. 1hr = 100, 48hr = 0.
            // Formula: 100 - ((AvgHours - 1) * (100/47)). Clamped 0-100.
            // Simpler: If < 1hr -> 100. If > 48hr -> 0.
            let speedScore = 0;
            if (s.speedHours.length > 0) {
                speedScore = Math.max(0, Math.min(100, 100 - ((avgSpeed - 1) * 2.1))); // Approx slope
            }

            // Solved Score (30%): Relative to max performer
            const solvedScore = (s.solved / maxSolved) * 100;

            // Final Weighted Score
            const efficiency = (ratingScore * 0.4) + (speedScore * 0.3) + (solvedScore * 0.3);

            return {
                name: s.username, // Display Name
                Username: s.username, // For matching
                Department: s.dept,

                // Metrics
                resolved: s.solved,
                solved: s.solved, // Alias
                delayed: s.delayed,

                avgRating: avgRating.toFixed(1),
                ratingCount: s.ratings.length,

                avgSpeed: avgSpeed.toFixed(1),
                speedScore: speedScore.toFixed(0),

                efficiency: efficiency.toFixed(0),
                rawEfficiency: efficiency, // For internal sorting

                // Star Breakdown
                R5: s.breakdown[5],
                R4: s.breakdown[4],
                R3: s.breakdown[3],
                R2: s.breakdown[2],
                R1: s.breakdown[1]
            };
        }).sort((a, b) => b.rawEfficiency - a.rawEfficiency); // Rank High to Low

        // E. State Updates
        setHospitalHealth(Math.max(0, Math.min(100, health)));
        setStressIndex(Math.min(100, stress));
        setPredictedDelays(predictions);
        setFlowStats(flow);
        setStaffStats(finalStaffStats); // This now contains ALL required data for Work Report
        setDetailedDelayRisks(detailedRisks);

        // Dept Risks & Alerts Construction (Legacy)
        const risks = {};
        Object.keys(depts).forEach(d => {
            const data = depts[d];
            let level = 'Stable';
            let params = [];

            if (data.delayed > 0) { level = 'Critical'; params.push('Active Delays'); }
            else if (data.open > 10) { level = 'High Load'; params.push('High Volume'); }
            else if (predictions.find(p => p.dept === d)) { level = 'Risk'; params.push('Potential Delay'); }

            risks[d] = { level, params, counts: data };
            if (data.open > 15) alertList.push({ type: 'overload', msg: `High Load: ${d} (${data.open} Active)` });
            if (data.delayed > 5) alertList.push({ type: 'delay', msg: `Delay Spike: ${d}` });
        });

        if (predictions.length > 5) alertList.push({ type: 'risk', msg: `${predictions.length} Tickets at Risk` });

        setDeptRisks(risks);
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
