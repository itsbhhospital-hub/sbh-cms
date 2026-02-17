import { createContext, useContext, useState, useEffect } from 'react';
import { sheetsService } from '../services/googleSheets';
import { useAuth } from './AuthContext';
import { runAIAnalysis } from '../services/aiCore'; // 🧠 AI IMPORT

const IntelligenceContext = createContext(null);

const normalize = (val) => String(val || '').toLowerCase().trim();
const safeNumber = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
};

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
    // AI Auto System Recommendations
    const [aiRecommendations, setAiRecommendations] = useState({ booster: null, delayWarning: null });

    // 🧠 AI METRICS
    const [aiRiskReport, setAiRiskReport] = useState([]);
    const [aiDeptLoad, setAiDeptLoad] = useState({});
    const [aiStaffScores, setAiStaffScores] = useState({});

    // ------------------------------------------------------------------
    // LOCAL CACHING & FETCH LOCKING
    // ------------------------------------------------------------------
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Initial Load from Cache (Instant UI)
    useEffect(() => {
        try {
            const cachedTickets = sessionStorage.getItem('sbh_tickets_cache');
            const cachedStats = sessionStorage.getItem('sbh_stats_cache');
            const cachedStaff = sessionStorage.getItem('sbh_staff_cache');

            if (cachedTickets) setAllTickets(JSON.parse(cachedTickets));
            if (cachedStats) setStats(JSON.parse(cachedStats));
            if (cachedStaff) setStaffStats(JSON.parse(cachedStaff));

            if (cachedTickets) setLoading(false);
        } catch (e) {
            console.warn("Failed to load cache", e);
        }
    }, []);

    // ------------------------------------------------------------------
    // 1. DATA SYNC ENGINE (20s Cycle)
    // ------------------------------------------------------------------
    const refreshIntelligence = async () => {
        if (!user || isRefreshing) return;
        setIsRefreshing(true);
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

            let currentStaffStats = [];

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
                currentStaffStats = mappedStats;
            }

            if (allData) {
                setAllTickets(allData);
                // Trigger Systems Analysis (Risk, Flow, etc.) - user stats removed
                analyzeSystem(allData, ratingsData || [], currentStaffStats);
            }

            setLastSync(new Date());

            // Update Frontend Cache
            sessionStorage.setItem('sbh_tickets_cache', JSON.stringify(allData || []));
            sessionStorage.setItem('sbh_stats_cache', JSON.stringify(statsData || {}));
            sessionStorage.setItem('sbh_staff_cache', JSON.stringify(currentStaffStats || []));

        } catch (e) {
            console.warn("Intelligence Sync Failed:", e);
        } finally {
            setIsRefreshing(false);
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
    // ------------------------------------------------------------------
    // 2. UNIFIED ANALYSIS ENGINE (With Master Efficiency Formula)
    // ------------------------------------------------------------------
    const analyzeSystem = (tickets, ratings, currentStaffStats) => {
        if (!tickets) return;

        // 🧠 MODULE 13: NO FALSE ZERO DATA
        if (tickets.length === 0 && !loading && lastSync) {
            // If data exists in sheet but here is 0, force re-sync
            // We use a small timeout to avoid infinite loops if it's genuinely empty
            console.warn("🧠 AI DETECT: Potential False Zero. Scheduling Re-sync...");
            setTimeout(() => refreshIntelligence(), 2000);
        }

        // 🧠 1. RUN AI CORE PREDICTIONS
        const aiResults = runAIAnalysis(tickets, currentStaffStats);

        // 🧠 MODULE 14: ZERO-SPAM PROTECTION
        // Compare new AI results with previous state to avoid re-rendering/notifying if identical
        if (JSON.stringify(aiResults.riskReport) !== JSON.stringify(aiRiskReport)) {
            setAiRiskReport(aiResults.riskReport);
        }
        if (JSON.stringify(aiResults.deptLoad) !== JSON.stringify(aiDeptLoad)) {
            setAiDeptLoad(aiResults.deptLoad);
        }
        // Staff scores update less frequently, but we check anyway
        setAiStaffScores(aiResults.staffScores);

        const now = new Date();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // A. Base Counters
        let health = 100;
        let stress = 0;
        const flow = { open: 0, solved: 0, delayed: 0, transferred: 0, efficiency: 0 };
        const depts = {};
        const predictions = [];
        const detailedRisks = [];
        const alertList = [];

        // B. Staff Map Init (Ensure all users are tracked)
        const staffMap = {};
        const initStaff = (name) => {
            const nName = normalize(name);
            if (!nName) return;
            if (!staffMap[nName]) {
                const userObj = users.find(u => normalize(u.Username) === nName);
                staffMap[nName] = {
                    name: userObj ? userObj.Username : name,
                    username: nName,
                    dept: userObj ? userObj.Department : 'Unknown',
                    solved: 0,
                    ratings: [],
                    active: 0,
                    delayCount: 0,
                    speedTotalMinutes: 0,
                    speedCount: 0,
                    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, total: 0 }
                };
            }
            return staffMap[nName];
        };

        // Initialize from Users list first
        users.forEach(u => initStaff(u.Username));

        // C. Ticket Processing
        tickets.forEach(t => {
            const status = String(t.Status || '').toLowerCase().trim();
            const dept = t.Department || 'General';
            const date = t.Date ? new Date(t.Date) : null;
            const solvedDate = t.ResolvedDate ? new Date(t.ResolvedDate) : null;

            // Safe Date Parsing for Speed Calc
            const regTime = (date && !isNaN(date.getTime())) ? date.getTime() : 0;
            const closeTime = (solvedDate && !isNaN(solvedDate.getTime())) ? solvedDate.getTime() : 0;

            const isActive = !['solved', 'closed', 'resolved', 'force close'].includes(status);
            const isSolved = ['solved', 'closed', 'resolved', 'force close'].includes(status);
            const resolver = normalize(t.ResolvedBy);

            // NEW DELAY LOGIC: Dual Visibility
            // Is it overdue by TargetDate? 
            let isOverdue = false;
            if (t.TargetDate) {
                const targetDate = new Date(t.TargetDate);
                if (!isNaN(targetDate.getTime()) && new Date() > targetDate && isActive) {
                    isOverdue = true;
                }
            }

            // A case is Delayed if:
            // 1. Explicitly marked as Delay='Yes' by backend schedule
            // 2. Breached TargetDate
            // 3. Status is 'delayed' (Legacy support)
            // 🟢 FIX: Check 'Delay' column robustly
            const delayVal = String(t.Delay || '').toLowerCase().trim();
            const isDelayed = delayVal === 'yes' || status === 'delayed' || isOverdue;

            // Dept Init
            if (!depts[dept]) depts[dept] = { open: 0, solved: 0, pending: 0, delayed: 0, transfers: 0 };

            if (isActive) {
                // 🟢 FIX: Count ALL active as Open Flow
                flow.open++;

                // Breakdown by specific status for Dept Stats
                if (status === 'open') {
                    depts[dept].open++;
                } else if (['pending', 'in-progress', 're-open'].includes(status)) {
                    depts[dept].pending++;
                } else {
                    // For other active statuses (like 'delayed' or unmapped), count as open in dept too?
                    // User said "Open panel should count: status != Closed".
                    // So let's count them as open if not pending/transferred
                    if (status !== 'transferred') depts[dept].open++;
                }

                // 🟢 FIX: Delayed Logic INSIDE Active Block
                if (isDelayed) {
                    depts[dept].delayed++;
                    flow.delayed++; // Global Delay Count
                }

                // Risk Predictions
                if (regTime > 0) {
                    const hrsOpen = (now.getTime() - regTime) / (1000 * 60 * 60);
                    if (hrsOpen > 18 && !isDelayed) { // Don't double count if already delayed?
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

                // Staff Stats: Solved & Speed
                if (resolver) {
                    const s = initStaff(resolver);
                    if (s) {
                        s.solved++;
                        if (closeTime > regTime && regTime > 0) {
                            const diffMins = (closeTime - regTime) / (1000 * 60);
                            s.speedTotalMinutes += diffMins;
                            s.speedCount++;
                        }
                    }
                }

                // Track if it WAS delayed
                if (isDelayed && resolver) {
                    const s = initStaff(resolver);
                    if (s) s.delayCount++;
                }

            } else if (status === 'transferred') {
                depts[dept].transfers++;
                flow.transferred++;
            }
            // Removed redundant 'delayed' check since it's handled in isActive
        });

        // D. Ratings Integration
        if (ratings && Array.isArray(ratings)) {
            ratings.forEach(r => {
                const rawStaff = r.ResolvedBy || r['Staff Name'] || r.Resolver;
                // Use safeNumber helper logic inline if simple
                const val = parseFloat(r.Rating);
                const rating = isNaN(val) ? 0 : val;
                const staff = initStaff(rawStaff);

                if (staff && rating > 0) {
                    staff.ratings.push(rating);
                    if (rating >= 1 && rating <= 5) {
                        staff.breakdown[Math.floor(rating)]++;
                    }
                }
            });
        }

        // E. FINAL EFFICIENCY CALCULATION (40/30/30)
        const finalStaffStats = Object.values(staffMap).map(s => {
            const avgRating = s.ratings.length ? (s.ratings.reduce((a, b) => a + b, 0) / s.ratings.length) : 0;

            // Speed (Hours)
            const avgSpeedMins = s.speedCount > 0 ? (s.speedTotalMinutes / s.speedCount) : 0;
            const avgSpeedHours = avgSpeedMins / 60;

            // Scores
            const scoreRating = (avgRating / 5) * 100; // 0-100
            const scoreSpeed = Math.max(0, 100 - (avgSpeedHours * 2)); // 0-100 (50hrs = 0)
            const scoreSolved = Math.min(100, s.solved * 5); // 0-100 (20 tickets = 100)

            // Formula: 40% Rating + 30% Speed + 30% Solved
            const efficiency = (scoreRating * 0.4) + (scoreSpeed * 0.3) + (scoreSolved * 0.3);

            return {
                ...s,
                avgRating: avgRating.toFixed(1),
                ratingCount: s.ratings.length,
                avgSpeed: avgSpeedHours.toFixed(1),
                efficiency: efficiency.toFixed(1),
                resolved: s.solved,
                delayed: s.delayCount,
                R5: s.breakdown[5],
                R4: s.breakdown[4],
                R3: s.breakdown[3],
                R2: s.breakdown[2],
                R1: s.breakdown[1]
            };
        });

        // Global Ranking
        finalStaffStats.sort((a, b) => {
            if (parseFloat(b.efficiency) !== parseFloat(a.efficiency)) return parseFloat(b.efficiency) - parseFloat(a.efficiency);
            return b.resolved - a.resolved;
        });
        finalStaffStats.forEach((s, idx) => s.rank = idx + 1);

        // Calculate Global Efficiency for AI Center
        const globalEfficiency = finalStaffStats.length ? (finalStaffStats.reduce((a, b) => a + parseFloat(b.efficiency), 0) / finalStaffStats.length).toFixed(1) : 0;
        flow.efficiency = globalEfficiency;

        // F. Alerts
        if (stress > 50) health = Math.max(0, health - 20);
        if (tickets.length > 500) health -= 10;
        if (health < 60) alertList.push({ type: 'critical', msg: 'System Stress Level High' });
        if (predictions.length > 5) alertList.push({ type: 'warning', msg: 'Multiple SLA Breaches Predicted' });

        // H. AI AUTOMATION (Master Prompt Part 11)
        // 1. Smart Priority Booster (Pending > 6hrs)
        // Find best candidate: Oldest pending ticket > 6hrs, not yet regular delay
        let bestBooster = null;
        const boosterCandidates = tickets.filter(t => {
            if (!t.Date || ['solved', 'closed', 'delayed'].includes(String(t.Status).toLowerCase())) return false;
            const tDate = new Date(t.Date);
            if (isNaN(tDate.getTime())) return false;
            const diffHrs = (now - tDate) / (1000 * 60 * 60);
            return diffHrs > 6;
        });

        if (boosterCandidates.length > 0) {
            // Sort by oldest first
            boosterCandidates.sort((a, b) => new Date(a.Date) - new Date(b.Date));
            const top = boosterCandidates[0];
            bestBooster = {
                TicketID: top.ID,
                Reason: 'Pending > 6 hours. Boost required to prevent delay.',
                Admin: 'AI Auto-System'
            };
        }

        // 2. Delay Prevention Alert (Pre-Midnight Warning)
        // Warn if a ticket registered TODAY is still open and it's late (e.g. > 8 PM)
        let delayWarn = null;
        const currentHour = now.getHours();
        if (currentHour >= 20) { // After 8 PM
            const potentialDelays = tickets.filter(t => {
                const status = String(t.Status).toLowerCase();
                if (['solved', 'closed', 'delayed'].includes(status)) return false;
                if (!t.Date) return false;
                // Check if registered today
                const tDate = new Date(t.Date);
                const isToday = tDate.toDateString() === now.toDateString();
                return isToday;
            });

            if (potentialDelays.length > 0) {
                delayWarn = {
                    count: potentialDelays.length,
                    msg: `⚠ ${potentialDelays.length} cases may become delayed tomorrow. Resolve ASAP.`
                };
            }
        }

        // G. Update State
        setHospitalHealth(health);
        setStressIndex(stress);
        setPredictedDelays(predictions);
        setDeptRisks(depts);
        setFlowStats(flow);
        // Global Latest-First Sorting for Risks
        detailedRisks.sort((a, b) => {
            const dateA = new Date(String(a.Date || a.Timestamp || '').replace(/'/g, ''));
            const dateB = new Date(String(b.Date || b.Timestamp || '').replace(/'/g, ''));
            return dateB - dateA;
        });

        setDetailedDelayRisks(detailedRisks);
        setStaffStats(finalStaffStats);
        setAlerts(alertList);
        setAiRecommendations({ booster: bestBooster, delayWarning: delayWarn });
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
        const isDelayed = String(ticket.Delay).toLowerCase() === 'yes' || status === 'delayed';

        if (isDelayed) {
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
            alerts,
            aiRecommendations, // Expose AI Logic

            // 🧠 EXPOSED AI METRICS
            aiRiskReport,
            aiDeptLoad,
            aiStaffScores
        }}>
            {children}
        </IntelligenceContext.Provider>
    );
};

export const useIntelligence = () => useContext(IntelligenceContext);
