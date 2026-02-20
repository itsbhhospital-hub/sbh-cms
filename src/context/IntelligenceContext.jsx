import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { sheetsService } from '../services/googleSheets';
import { assetsService } from '../services/assetsService';
import { useAuth } from './AuthContext';
import { runAIAnalysis } from '../services/aiCore';

import { normalize, safeNumber } from '../utils/dataUtils';

const IntelligenceContext = createContext(null);

// --- DASHBOARD HELPERS ---
const findField = (item, prefixes) => {
    if (!item) return null;
    const keys = Object.keys(item);
    for (const p of prefixes) {
        const found = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === p.toLowerCase().replace(/[^a-z0-9]/g, ''));
        if (found) return item[found];
    }
    return null;
};

const parseDateSafe = (d) => {
    if (!d) return null;

    // Handle Google Sheets Numeric Dates (days since 30/12/1899)
    if (typeof d === 'number' && d > 40000 && d < 60000) {
        return new Date((d - 25569) * 86400 * 1000);
    }

    let parsed = new Date(d);

    // Handle DD/MM/YYYY or DD-MM-YYYY which Date constructor might fail on
    if ((isNaN(parsed.getTime()) || parsed.getFullYear() < 1971) && typeof d === 'string') {
        const cleaned = d.split(' ')[0]; // Remove time if present
        const parts = cleaned.split(/[/-]/);
        if (parts.length === 3) {
            let day, month, year;
            if (parts[0].length === 4) { // YYYY-MM-DD
                year = parseInt(parts[0]);
                month = parseInt(parts[1]) - 1;
                day = parseInt(parts[2]);
            } else { // DD-MM-YYYY
                day = parseInt(parts[0]);
                month = parseInt(parts[1]) - 1;
                year = parseInt(parts[2]);
            }
            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                parsed = new Date(year, month, day);
            }
        }
    }
    return isNaN(parsed.getTime()) ? null : parsed;
};

export const IntelligenceProvider = ({ children }) => {
    const { user } = useAuth();
    const lastDataHash = useRef('');

    // ------------------------------------------------------------------
    // RAW DATA STATE
    // ------------------------------------------------------------------
    const [allTickets, setAllTickets] = useState([]);
    const [assets, setAssets] = useState([]);
    const [stats, setStats] = useState({
        open: 0, pending: 0, solved: 0, transferred: 0, extended: 0, delayed: 0, activeStaff: 0
    });
    const [assetStats, setAssetStats] = useState({
        total: 0, risk: 0, void: 0, serviceDue: 0, healthy: 0
    });
    const [trendStats, setTrendStats] = useState([]);
    const [users, setUsers] = useState([]);
    const [boosters, setBoosters] = useState([]);
    const [allRatings, setAllRatings] = useState([]);

    const [loading, setLoading] = useState(true);
    const [lastSync, setLastSync] = useState(null);

    // ------------------------------------------------------------------
    // INTELLIGENCE METRICS
    // ------------------------------------------------------------------
    const [hospitalHealth, setHospitalHealth] = useState(100);
    const [stressIndex, setStressIndex] = useState(0);
    const [predictedDelays, setPredictedDelays] = useState([]);
    const [deptRisks, setDeptRisks] = useState({});
    const [deptStats, setDeptStats] = useState([]);
    const [flowStats, setFlowStats] = useState({ open: 0, solved: 0, delayed: 0, transferred: 0, efficiency: 0, activeStaff: 0 });
    const [staffStats, setStaffStats] = useState([]);
    const [delayRisks, setDelayRisks] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [aiRecommendations, setAiRecommendations] = useState({ booster: null, delayWarning: null });
    const [aiRiskReport, setAiRiskReport] = useState([]);
    const [aiDeptLoad, setAiDeptLoad] = useState({});
    const [aiStaffScores, setAiStaffScores] = useState({});
    const [loadWarnings, setLoadWarnings] = useState([]);
    const [deptTrends, setDeptTrends] = useState([]);
    const [lastAiPulse, setLastAiPulse] = useState(new Date());

    const [isRefreshing, setIsRefreshing] = useState(false);

    // ------------------------------------------------------------------
    // ANALYSIS ENGINE (PERFORMANCE OPTIMIZED)
    // ------------------------------------------------------------------
    const analyzeSystem = useCallback((tickets, ratings, assetsData, usersList) => {
        if (!tickets || !usersList) return;

        const now = new Date();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        let health = 100;
        let stress = 0;
        const flow = { open: 0, solved: 0, delayed: 0, transferred: 0, extended: 0, efficiency: 0, activeStaff: 0 };
        const depts = {};
        const predictions = [];
        const detailedRisks = [];

        const staffMap = {};
        const initStaff = (name) => {
            const nName = normalize(name);
            if (!nName) return null;
            if (!staffMap[nName]) {
                const userObj = usersList.find(u => normalize(u.Username) === nName);
                staffMap[nName] = {
                    name: userObj ? userObj.Username : name,
                    Username: userObj ? userObj.Username : name,
                    dept: userObj ? userObj.Department : 'Unknown',
                    solved: 0,
                    resolved: 0,
                    ratings: [],
                    active: 0,
                    delayed: 0,
                    speedTotalMinutes: 0,
                    speedCount: 0,
                    R5: 0, R4: 0, R3: 0, R2: 0, R1: 0,
                    ratingCount: 0
                };
            }
            return staffMap[nName];
        };

        // Initialize from Users list
        for (let i = 0; i < usersList.length; i++) {
            initStaff(usersList[i].Username);
        }

        // Process Ratings
        ratings.forEach(r => {
            const resolver = normalize(r.ResolvedBy || r.Resolver);
            const score = parseInt(r.Rating || r.Stars || 0);
            if (resolver && score > 0) {
                const s = initStaff(resolver);
                if (s) {
                    s.ratings.push(score);
                    s.ratingCount++;
                    if (score === 5) s.R5++;
                    else if (score === 4) s.R4++;
                    else if (score === 3) s.R3++;
                    else if (score === 2) s.R2++;
                    else if (score === 1) s.R1++;
                }
            }
        });

        // Process Tickets
        for (let i = 0; i < tickets.length; i++) {
            const t = tickets[i];
            const status = normalize(t.Status || '');
            const dept = t.Department || 'General';
            const date = parseDateSafe(t.Date || t.Timestamp);
            const regTime = date ? date.getTime() : 0;

            const isSolved = ['solved', 'closed', 'resolved', 'force close', 'done', 'fixed'].includes(status);
            const isActive = !isSolved;
            const resolver = normalize(t.ResolvedBy);

            const isDelayed = normalize(t.Delay) === 'yes' ||
                status === 'delayed' ||
                (isActive && regTime > 0 && regTime < startOfDay.getTime());

            if (!depts[dept]) depts[dept] = { open: 0, solved: 0, pending: 0, delayed: 0, extended: 0, transfers: 0 };

            if (isActive) {
                flow.open++;
                if (resolver) {
                    const s = initStaff(resolver);
                    if (s) s.active++;
                }

                if (status === 'open') depts[dept].open++;
                else if (['pending', 'in-progress', 're-open'].includes(status)) depts[dept].pending++;
                else if (status === 'transferred') { depts[dept].transfers++; flow.transferred++; }

                const hasTargetDate = t.TargetDate && String(t.TargetDate).trim() !== '' && String(t.TargetDate).toLowerCase() !== 'none';
                if (status === 'extended' || status === 'extend' || hasTargetDate) {
                    depts[dept].extended++;
                    flow.extended++;
                }

                if (isDelayed) {
                    depts[dept].delayed++;
                    flow.delayed++;
                    if (resolver) {
                        const s = initStaff(resolver);
                        if (s) s.delayed++;
                    }
                }

                if (regTime > 0) {
                    const hrsOpen = (now - regTime) / 3600000;
                    if (hrsOpen > 18) {
                        predictions.push({ id: t.ID, dept, reason: 'Open > 18hrs' });
                        stress += 2;
                        detailedRisks.push({ ...t, riskLevel: 'HIGH', hours: hrsOpen.toFixed(1) });
                    }
                }
            } else {
                depts[dept].solved++;
                flow.solved++;
                if (resolver) {
                    const s = initStaff(resolver);
                    if (s) {
                        s.solved++;
                        s.resolved++;
                        const solvedDate = parseDateSafe(t.ResolvedDate);
                        if (solvedDate && regTime > 0) {
                            s.speedTotalMinutes += (solvedDate.getTime() - regTime) / 60000;
                            s.speedCount++;
                        }
                    }
                }
            }
        }

        // Staff Analysis
        const processedStaff = Object.values(staffMap).map(s => {
            const avgRating = s.ratingCount > 0 ? (s.ratings.reduce((a, b) => a + b, 0) / s.ratingCount) : 0;
            const avgSpeedHours = s.speedCount > 0 ? (s.speedTotalMinutes / s.speedCount / 60) : 0;

            const ratingWeight = (avgRating / 5) * 50;
            const volumeWeight = Math.min(30, (s.solved / 10) * 30);
            const speedWeight = s.speedCount > 0 ? Math.max(0, 20 - (avgSpeedHours / 4) * 20) : 10;

            const efficiency = ratingWeight + volumeWeight + speedWeight;
            if (s.active > 0) flow.activeStaff++;

            return {
                ...s,
                avgRating: avgRating.toFixed(1),
                avgSpeed: avgSpeedHours.toFixed(1),
                efficiency: parseFloat(efficiency.toFixed(1))
            };
        });

        // 🟢 CALCULATE GLOBAL RANKING & SORT
        const rankedStaffList = processedStaff
            .sort((a, b) => b.efficiency - a.efficiency)
            .map((s, idx) => ({ ...s, rank: idx + 1 }));

        // Trend Analysis (Last 14 Days)
        const trends = {};
        for (let i = 13; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            trends[d.toDateString()] = {
                date: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                tickets: 0,
                assets: 0,
                serviced: 0,
                warranty: 0
            };
        }

        // 1. Ticketing Trends (Complaints) - Robust Extraction
        tickets.forEach(t => {
            // Check normalized Date, then fallbacks
            const rawDate = t.Date || t.Timestamp || t.date || t.datetime || t.RegistrationDate || t.RegisteredAt || t.EntryDate;
            const tDate = parseDateSafe(rawDate);
            if (tDate) {
                const dateKey = tDate.toDateString();
                if (trends[dateKey]) trends[dateKey].tickets++;
            }
        });

        // 2. Asset & Expiry Analysis
        const aStats = { total: 0, risk: 0, void: 0, serviceDue: 0, healthy: 0 };
        if (assetsData && Array.isArray(assetsData)) {
            aStats.total = assetsData.length;
            assetsData.forEach(a => {
                const installDate = parseDateSafe(findField(a, ['InstallationDate', 'PurchaseDate', 'Date', 'RegisteredDate']));
                const lastService = parseDateSafe(findField(a, ['LastServiceDate', 'ServiceDate', 'LastService']));
                const amcTaken = normalize(findField(a, ['AMCTaken', 'AMC', 'WarrantyStatus'])) === 'yes';
                const amcExpiry = parseDateSafe(findField(a, ['AMCExpiry', 'AMCExpiryDate', 'AMCDate', 'ExpiryDate', 'WarrantyExpiry']));
                const nextService = parseDateSafe(findField(a, ['NextServiceDate', 'NextService', 'ServiceDue']));
                const health = a.aiHealthScore ?? 100;

                // Trend mapping
                if (installDate && trends[installDate.toDateString()]) trends[installDate.toDateString()].assets++;
                if (lastService && trends[lastService.toDateString()]) trends[lastService.toDateString()].serviced++;
                if (amcTaken && trends[installDate?.toDateString()]) trends[installDate.toDateString()].warranty++; // Assuming warranty taken at install if no specific date

                // Status mapping
                if (health > 80) aStats.healthy++;
                if (amcTaken && amcExpiry) {
                    const diffDays = Math.ceil((amcExpiry - now) / 864e5);
                    if (diffDays < 0) aStats.void++;
                    else if (diffDays <= 30) aStats.risk++;
                }
                if (nextService) {
                    const diffDays = Math.ceil((nextService - now) / 864e5);
                    if (diffDays <= 0) aStats.serviceDue++;
                }
            });
            setAssetStats(aStats);
        }

        // Heatmap Trend Analysis (Last 7 Days)
        const heatmapTrends = [];
        const daysToMap = 7;
        const deptsInSystem = Object.keys(depts);

        for (let i = daysToMap - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const label = d.toLocaleDateString('en-US', { weekday: 'short' });
            const snapshot = { name: label };

            deptsInSystem.forEach(dept => {
                const count = tickets.filter(t => {
                    const tDate = parseDateSafe(t.Date || t.Timestamp);
                    return tDate &&
                        tDate.toDateString() === d.toDateString() &&
                        normalize(t.Department) === normalize(dept);
                }).length;
                snapshot[dept] = count;
            });
            heatmapTrends.push(snapshot);
        }

        // 🧠 RUN AI CORE ANALYSIS
        const aiResults = runAIAnalysis(tickets, rankedStaffList);

        // Load Warnings (Staff with > 5 active cases)
        const warnings = rankedStaffList
            .filter(s => s.active > 5)
            .map(s => ({ name: s.name, count: s.active }));

        // --- BATCHED STATE UPDATES ---
        setHospitalHealth(health);
        setStressIndex(Math.min(100, stress));
        setPredictedDelays(predictions);
        setDeptRisks(depts);
        setDeptStats(Object.entries(depts).map(([name, s]) => ({ name, ...s })));
        setFlowStats(flow);
        setStaffStats(rankedStaffList);
        setTrendStats(Object.values(trends));
        setAiRiskReport(aiResults.riskReport);
        setAiDeptLoad(aiResults.deptLoad);
        setAiStaffScores(aiResults.staffScores);
        setDelayRisks(detailedRisks);
        setDeptTrends(heatmapTrends);
        setLoadWarnings(warnings);
        setLastAiPulse(new Date());
    }, []);

    const getAiCaseDecision = useCallback((ticket) => {
        const regDateStr = ticket.Date || ticket.Timestamp;
        let priority = { label: 'Normal', color: 'bg-slate-100 text-slate-500' };
        let delayRisk = false;

        if (!regDateStr) return { priority, delayRisk };
        const regDate = new Date(regDateStr);
        if (isNaN(regDate.getTime())) return { priority, delayRisk };

        const hrsOpen = (new Date() - regDate) / (1000 * 60 * 60);
        const status = normalize(ticket.Status);
        const isDelayed = normalize(ticket.Delay) === 'yes' || status === 'delayed';

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

        const tid = String(ticket.ID || ticket.id);
        if (predictedDelays.find(p => String(p.id) === tid)) {
            delayRisk = true;
            if (priority.label === 'Safe') priority = { label: 'Predicted Delay', color: 'bg-orange-50 text-orange-600' };
        }

        return { priority, delayRisk };
    }, [predictedDelays]);

    const getTransferSuggestion = useCallback((ticket) => {
        if (!ticket || !ticket.Description) return null;
        const desc = normalize(ticket.Description);
        if (desc.includes('computer') || desc.includes('printer') || desc.includes('internet') || desc.includes('wifi')) return 'IT';
        if (desc.includes('clean') || desc.includes('dust') || desc.includes('garbage')) return 'HOUSE KEEPING';
        if (desc.includes('light') || desc.includes('fan') || desc.includes('ac ') || desc.includes('leak')) return 'MAINTENANCE';
        if (desc.includes('medicine') || desc.includes('tablet')) return 'PHARMACY';
        return null;
    }, []);

    const getResolverRecommendation = useCallback((department) => {
        if (!department) return null;
        const targetDept = normalize(department);
        const deptStaffNames = users
            .filter(u => normalize(u.Department) === targetDept)
            .map(u => normalize(u.Username));

        if (deptStaffNames.length === 0) return null;
        const bestPerformer = staffStats
            .filter(s => deptStaffNames.includes(normalize(s.Username)))
            .sort((a, b) => b.efficiency - a.efficiency)[0];
        return bestPerformer ? bestPerformer.Username : null;
    }, [users, staffStats]);

    const refreshIntelligence = useCallback(async () => {
        if (!user || isRefreshing) return;
        setIsRefreshing(true);
        try {
            const isAdmin = ['admin', 'super_admin', 'superadmin'].includes(normalize(user.Role));
            const [statsData, fetchedUsers, allData, boosterData, ratingsData, assetsData] = await Promise.all([
                sheetsService.getDashboardStats(user.Username, user.Department, user.Role),
                isAdmin ? sheetsService.getUsers() : Promise.resolve([]),
                sheetsService.getComplaints(false, true),
                sheetsService.getBoosters(true, true).catch(() => []),
                sheetsService.getRatings(false, true).catch(() => []),
                assetsService.getAssets().catch(() => [])
            ]);

            if (allData) {
                const cleanedData = allData.filter(t => {
                    const idCandidate = t.ID || t.id || t['Ticket ID'] || t.ComplaintID || t.Complaint_ID || t.Complaint_id || '';
                    const desc = t.Description || t.description || t.Complaint || '';
                    const cleanId = String(idCandidate).toLowerCase().replace(/[^a-z0-9]/g, '');
                    return (cleanId !== '' && cleanId !== 'na' && cleanId !== 'undefined') || String(desc).trim() !== '';
                }).map(t => {
                    const rawId = t.ID || t.id || t['Ticket ID'] || t.ComplaintID || t.Complaint_ID || t.Complaint_id || '';
                    const cleanId = String(rawId).toLowerCase().replace(/[^a-z0-9]/g, '');
                    const finalId = (cleanId !== '' && cleanId !== 'na' && cleanId !== 'undefined') ? rawId : 'N/A';
                    return { ...t, ID: finalId };
                });

                setAllTickets(cleanedData);
                analyzeSystem(cleanedData, ratingsData, assetsData, fetchedUsers || users);
            }

            // --- BATCHED STATE UPDATES ---
            if (statsData) setStats(prev => ({ ...prev, ...statsData }));
            if (fetchedUsers) setUsers(fetchedUsers);
            if (boosterData) setBoosters(boosterData);
            if (ratingsData) setAllRatings(ratingsData);
            if (assetsData) setAssets(assetsData);
            setLastSync(new Date());
        } catch (e) {
            console.error("Sync Failed", e);
        } finally {
            setIsRefreshing(false);
        }
    }, [user, isRefreshing, analyzeSystem, users]);

    useEffect(() => {
        if (user) {
            refreshIntelligence().finally(() => setLoading(false));
            const timer = setInterval(refreshIntelligence, 45000);
            return () => clearInterval(timer);
        }
    }, [user]);

    const getCrisisRisk = useCallback(() => {
        if (stressIndex > 70) return 'CRITICAL';
        if (stressIndex > 40) return 'ELEVATED';
        return 'NORMAL';
    }, [stressIndex]);

    return (
        <IntelligenceContext.Provider value={{
            allTickets, stats, users, boosters, allRatings, lastSync, loading,
            hospitalHealth, deptRisks, deptStats, predictedDelays, stressIndex,
            crisisRisk: getCrisisRisk(), flowStats, staffStats, delayRisks, alerts,
            aiRecommendations, aiRiskReport, aiDeptLoad, aiStaffScores, loadWarnings,
            deptTrends, lastAiPulse,
            assets, assetStats, trendStats, refreshIntelligence,
            getAiCaseDecision, getTransferSuggestion, getResolverRecommendation
        }}>
            {children}
        </IntelligenceContext.Provider>
    );
};

export const useIntelligence = () => useContext(IntelligenceContext);
