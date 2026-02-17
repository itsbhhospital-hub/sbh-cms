import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Calendar, FileText,
    Clock, Wrench, Download, CheckCircle, UploadCloud, ExternalLink,
    Banknote, RefreshCw, Edit, AlertTriangle, Sparkles, ShieldCheck, MapPin, Building,
    Activity, History, XCircle, X
} from 'lucide-react';
import { assetsService } from '../services/assetsService';
import QRCode from 'react-qr-code';
import AIIntelligencePanel from '../components/AIIntelligencePanel';
import html2canvas from 'html2canvas';

const AssetDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('details'); // 'details' or 'ai'
    const [submitting, setSubmitting] = useState(false);
    const [age, setAge] = useState('');

    // Modals State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({});

    const [showReplaceModal, setShowReplaceModal] = useState(false);
    const [replaceForm, setReplaceForm] = useState({
        reason: 'Beyond Repair',
        remark: '',
        newMachineName: '',
        newSerialNumber: '',
        newPurchaseCost: '',
        newPurchaseDate: '',
        newInvoiceFile: null,
        newInvoiceName: ''
    });

    const [showServiceModal, setShowServiceModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null); // For history details
    const [serviceForm, setServiceForm] = useState({
        serviceDate: new Date().toISOString().split('T')[0],
        nextServiceDate: '',
        remark: '',
        cost: '',
        file: null,
        fileName: '',
        serviceType: 'Paid' // Default
    });

    // Success Popup State
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const triggerSuccess = (msg) => {
        setSuccessMessage(msg);
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 3000);
    };

    // Fetch Details
    const fetchDetails = async () => {
        try {
            setLoading(true);
            const data = await assetsService.getAssetDetails(id);
            setAsset(data);
            if (data && data.purchaseDate) {
                setAge(calculateAge(data.purchaseDate));
            }
        } catch (error) {
            console.error("Error fetching asset details", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchDetails();
    }, [id]);

    const calculateAge = (dateString) => {
        const today = new Date();
        const birthDate = new Date(dateString);
        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();
        let days = today.getDate() - birthDate.getDate();

        if (days < 0) {
            months--;
            days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }
        return `${years} Years, ${months} Months`;
    };

    // --- SMART STATUS LOGIC (Matching Dashboard) ---
    const getSmartStatus = () => {
        if (!asset) return { text: 'Loading...', color: 'bg-slate-100 text-slate-500' };
        if (asset.status === 'Replaced') return { text: 'Replaced', color: 'bg-slate-200 text-slate-600 border-slate-300' };
        if (asset.status === 'Retired') return { text: 'Retired', color: 'bg-slate-100 text-slate-500 border-slate-200' };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextService = asset.nextServiceDate ? new Date(asset.nextServiceDate) : null;

        // Service Status
        if (nextService) {
            const diffTime = nextService - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) return { text: 'Service Overdue', color: 'bg-rose-100 text-rose-700 border-rose-200' };
            if (diffDays <= 20) return { text: 'Service Due Soon', color: 'bg-amber-100 text-amber-700 border-amber-200' };
        }

        // Fallback to Active
        return { text: 'Active', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    };

    // Handlers
    const openEditModal = () => {
        setEditForm({
            ...asset,
            location: asset.location || '',
            department: asset.department || '',
            warrantyType: asset.warrantyType || 'None',
            warrantyExpiry: (asset.warrantyExpiry && !isNaN(new Date(asset.warrantyExpiry))) ? new Date(asset.warrantyExpiry).toISOString().split('T')[0] : '',
            amcTaken: asset.amcTaken || 'No',
            amcStart: (asset.amcStart && !isNaN(new Date(asset.amcStart))) ? new Date(asset.amcStart).toISOString().split('T')[0] : '',
            amcExpiry: (asset.amcExpiry && !isNaN(new Date(asset.amcExpiry))) ? new Date(asset.amcExpiry).toISOString().split('T')[0] : '',
            amcAmount: asset.amcAmount || '',
            purchaseDate: (asset.purchaseDate && !isNaN(new Date(asset.purchaseDate))) ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
            currentServiceDate: (asset.currentServiceDate && !isNaN(new Date(asset.currentServiceDate))) ? new Date(asset.currentServiceDate).toISOString().split('T')[0] : '',
            nextServiceDate: (asset.nextServiceDate && !isNaN(new Date(asset.nextServiceDate))) ? new Date(asset.nextServiceDate).toISOString().split('T')[0] : '',
            vendorName: asset.vendorName || '',
            vendorContact: asset.vendorContact || '',
            keywords: asset.keywords || '',
            description: asset.description || '',
            responsiblePerson: asset.responsiblePerson || '',
            responsibleMobile: asset.responsibleMobile || ''
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await assetsService.editAsset(editForm);
            await fetchDetails();
            setShowEditModal(false);
            triggerSuccess("✔ Asset Updated Successfully");
        } catch (error) {
            console.error("Edit failed", error);
            alert("Failed to update asset.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleReplaceSubmit = async (e) => {
        e.preventDefault();

        if (!window.confirm("Are you sure you want to mark this asset as REPLACED? This action cannot be undone.")) {
            return;
        }

        setSubmitting(true);
        try {
            await assetsService.markAsReplaced({
                id: asset.id,
                reason: replaceForm.reason,
                remark: replaceForm.remark,
                createdBy: 'Admin',
                newMachineData: {
                    machineName: replaceForm.newMachineName,
                    serialNumber: replaceForm.newSerialNumber,
                    purchaseCost: replaceForm.newPurchaseCost,
                    purchaseDate: replaceForm.newPurchaseDate,
                    invoiceFile: replaceForm.newInvoiceFile,
                    invoiceName: replaceForm.newInvoiceName
                },
                location: replaceForm.location,
                department: replaceForm.department,
                vendorName: replaceForm.vendorName,
                vendorContact: replaceForm.vendorContact,
                responsiblePerson: replaceForm.responsiblePerson,
                responsibleMobile: replaceForm.responsibleMobile
            });
            await fetchDetails();
            setShowReplaceModal(false);
            triggerSuccess("Asset Replaced Successfully!");
        } catch (error) {
            console.error("Replacement failed", error);
            alert("Failed to process replacement.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleServiceSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await assetsService.addServiceRecord(
                {
                    id: asset.id,
                    serviceDate: serviceForm.serviceDate,
                    nextServiceDate: serviceForm.nextServiceDate,
                    remark: serviceForm.remark,
                    cost: serviceForm.serviceType === 'Paid' ? serviceForm.cost : 0,
                    serviceType: serviceForm.serviceType,
                    serviceVendor: serviceForm.serviceVendor || asset.vendorName,
                    location: serviceForm.location || asset.location,
                    department: serviceForm.department || asset.department,
                    responsiblePerson: serviceForm.responsiblePerson || asset.responsiblePerson
                },
                serviceForm.file,
                serviceForm.fileName,
                serviceForm.file ? serviceForm.file.type : ''
            );
            await fetchDetails();
            setShowServiceModal(false);
            triggerSuccess("✔ Service Record Added");
        } catch (error) {
            console.error("Service record failed", error);
            alert("Failed to add service record.");
        } finally {
            setSubmitting(false);
        }
    };

    // QR Download Handler
    const handleDownloadQR = async () => {
        const element = document.getElementById('print-qr-card');
        if (!element) return;

        try {
            // Unhide temporarily if needed (but absolute -z-50 should work if visible in DOM)
            // html2canvas needs the element to be rendered.
            const canvas = await html2canvas(element, { scale: 3, useCORS: true });
            const link = document.createElement('a');
            link.download = `${asset.id}_QR_Identity.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error("QR Download failed", err);
            alert("Failed to download QR.");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#2e7d32] border-t-transparent rounded-full animate-spin"></div></div>;
    if (!asset) return <div className="p-12 text-center text-rose-500 font-black uppercase tracking-widest">Asset Not Found</div>;

    const publicLink = `${window.location.origin}/asset-view/${asset.id}`;
    const statusBadge = getSmartStatus();

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Success Popup */}
            {showSuccessPopup && (
                <div className="fixed top-6 right-6 z-[100] animate-slide-in">
                    <div className="bg-[#1f2d2a] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-[#2e7d32]/20">
                        <div className="bg-[#2e7d32] p-2 rounded-full text-white">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-sm uppercase tracking-wider text-[#4ade80]">Success</h4>
                            <p className="font-bold text-sm">{successMessage}</p>
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={() => navigate('/assets')}
                className="flex items-center gap-2 text-slate-500 font-bold hover:text-[#2e7d32] transition-colors"
            >
                <ArrowLeft size={20} /> Back to Assets
            </button>

            {/* AI / Details Tab Switcher */}
            <div className="flex gap-2 border-b border-slate-200 mb-6">
                <button
                    onClick={() => setActiveTab('details')}
                    className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'details' ? 'border-[#2e7d32] text-[#2e7d32]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <FileText size={18} /> Asset Details
                </button>
                <button
                    onClick={() => setActiveTab('ai')}
                    className={`px-6 py-3 font-black text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'ai' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Sparkles size={18} /> AI Intelligence <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase">Beta</span>
                </button>
            </div>

            {activeTab === 'ai' ? (
                <AIIntelligencePanel asset={asset} />
            ) : (
                <>
                    {/* Top Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* AI Insights & Alerts (Conditional) */}
                        {(
                            (asset.purchaseCost > 0 && asset.totalServiceCost > (asset.purchaseCost * 0.5)) ||
                            (asset.warrantyExpiry && new Date(asset.warrantyExpiry) > new Date() && new Date(asset.warrantyExpiry) < new Date(new Date().setDate(new Date().getDate() + 30))) ||
                            (asset.amcExpiry && new Date(asset.amcExpiry) > new Date() && new Date(asset.amcExpiry) < new Date(new Date().setDate(new Date().getDate() + 30)))
                        ) && (
                                <div className="lg:col-span-3 bg-indigo-50 border border-indigo-100 rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl shrink-0">
                                        <Sparkles size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-indigo-900 text-lg flex items-center gap-2">
                                            AI System Insights
                                            <span className="text-[10px] bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded-md uppercase tracking-wider">Beta</span>
                                        </h3>
                                        <div className="space-y-2 mt-2">
                                            {/* High Cost Alert */}
                                            {asset.purchaseCost > 0 && asset.totalServiceCost > (asset.purchaseCost * 0.5) && (
                                                <div className="flex items-center gap-2 text-sm text-indigo-800 font-medium">
                                                    <AlertTriangle size={16} className="text-amber-500" />
                                                    <span>Maintenance costs have exceeded <strong>50%</strong> of the asset's value. Consider replacement.</span>
                                                </div>
                                            )}
                                            {/* Warranty Expiry Alert */}
                                            {asset.warrantyExpiry && new Date(asset.warrantyExpiry) > new Date() && new Date(asset.warrantyExpiry) < new Date(new Date().setDate(new Date().getDate() + 30)) && (
                                                <div className="flex items-center gap-2 text-sm text-indigo-800 font-medium">
                                                    <Clock size={16} className="text-indigo-500" />
                                                    <span>Warranty expires in <strong>{Math.ceil((new Date(asset.warrantyExpiry) - new Date()) / (1000 * 60 * 60 * 24))} days</strong>. Schedule a checkup.</span>
                                                </div>
                                            )}
                                            {/* AMC Expiry Alert */}
                                            {asset.amcExpiry && new Date(asset.amcExpiry) > new Date() && new Date(asset.amcExpiry) < new Date(new Date().setDate(new Date().getDate() + 30)) && (
                                                <div className="flex items-center gap-2 text-sm text-indigo-800 font-medium">
                                                    <ShieldCheck size={16} className="text-indigo-500" />
                                                    <span>AMC expires in <strong>{Math.ceil((new Date(asset.amcExpiry) - new Date()) / (1000 * 60 * 60 * 24))} days</strong>. Renew contract.</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                        {/* Main Info Card */}
                        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Wrench size={100} />
                            </div>

                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="bg-[#1f2d2a] text-white px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">
                                            {asset.id}
                                        </span>
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${statusBadge.color}`}>
                                            {statusBadge.text}
                                        </span>
                                    </div>
                                    <h1 className="text-3xl font-black text-[#1f2d2a]">{asset.machineName}</h1>
                                    <p className="text-slate-500 font-bold mt-1">Serial: {asset.serialNumber || 'N/A'}</p>

                                    <div className="mt-4 flex flex-wrap gap-4">
                                        {asset.location && (
                                            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                <MapPin size={16} className="text-[#2e7d32]" />
                                                <div className="text-xs">
                                                    <p className="font-black text-slate-400 uppercase tracking-wider text-[10px]">Location</p>
                                                    <p className="font-bold text-slate-700">{asset.location}</p>
                                                </div>
                                            </div>
                                        )}
                                        {asset.department && (
                                            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                <Building size={16} className="text-[#2e7d32]" />
                                                <div className="text-xs">
                                                    <p className="font-black text-slate-400 uppercase tracking-wider text-[10px]">Department</p>
                                                    <p className="font-bold text-slate-700">{asset.department}</p>
                                                </div>
                                            </div>
                                        )}
                                        {age && (
                                            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                <Activity size={16} className="text-[#2e7d32]" />
                                                <div className="text-xs">
                                                    <p className="font-black text-slate-400 uppercase tracking-wider text-[10px]">Machine Age</p>
                                                    <p className="font-bold text-slate-700">{age}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 relative z-10">
                                    <button
                                        onClick={openEditModal}
                                        className="p-2.5 text-slate-400 hover:text-[#1f2d2a] hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200"
                                        title="Edit Asset"
                                    >
                                        <Edit size={20} />
                                    </button>
                                    {asset.status !== 'Replaced' && (
                                        <button
                                            onClick={() => {
                                                setReplaceForm(prev => ({
                                                    ...prev,
                                                    // Auto-Fill from Old Asset
                                                    newMachineName: asset.machineName, // Often same model
                                                    location: asset.location,
                                                    department: asset.department,
                                                    vendorName: asset.vendorName,
                                                    vendorContact: asset.vendorContact,
                                                    responsiblePerson: asset.responsiblePerson,
                                                    responsibleMobile: asset.responsibleMobile
                                                }));
                                                setShowReplaceModal(true);
                                            }}
                                            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100"
                                            title="Mark as Replaced"
                                        >
                                            <RefreshCw size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Purchase Date</p>
                                    <div className="flex items-center gap-2 text-slate-700 font-bold">
                                        <Calendar size={18} className="text-[#2e7d32]" />
                                        {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Next Service</p>
                                    <div className="flex items-center gap-2 text-slate-700 font-bold">
                                        <Clock size={18} className={asset.status === 'Service Due' ? "text-amber-500" : "text-[#2e7d32]"} />
                                        {asset.nextServiceDate ? new Date(asset.nextServiceDate).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Warranty</p>
                                    <div className="flex items-center gap-2 text-slate-700 font-bold">
                                        <ShieldCheck size={18} className="text-[#2e7d32]" />
                                        {asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : 'None'}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">AMC Status</p>
                                    <div className="flex items-center gap-2 text-slate-700 font-bold">
                                        <Building size={18} className="text-[#2e7d32]" />
                                        {asset.amcTaken === 'Yes' ? (asset.amcExpiry ? `Exp: ${new Date(asset.amcExpiry).toLocaleDateString()}` : 'Active') : 'No AMC'}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 flex gap-4">
                                {asset.invoiceLink && (
                                    <a href={asset.invoiceLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 border border-slate-200 transition-colors">
                                        <FileText size={16} /> Purchase Invoice
                                    </a>
                                )}
                                {asset.folderLink && (
                                    <a href={asset.folderLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 border border-slate-200 transition-colors">
                                        <Download size={16} /> Asset Drive Folder
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* QR Code Card - ADMIN VIEW */}
                        <div className="bg-[#1f2d2a] rounded-3xl p-8 border border-slate-800 shadow-xl text-white flex flex-col items-center justify-center text-center relative overflow-hidden">

                            {/* Hidden Print Template for High Quality Download */}
                            {/* HIDDEN PRINT TEMPLATE - FIXED 1000px WIDTH */}
                            <div id="print-qr-card"
                                style={{
                                    position: 'absolute',
                                    zIndex: -50,
                                    top: 0,
                                    left: 0,
                                    backgroundColor: '#ffffff',
                                    width: '1000px',
                                    height: 'auto',
                                    minHeight: '1300px',
                                    padding: '40px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    border: '40px solid #1f2d2a'
                                }}
                            >
                                {/* HEADER */}
                                <div style={{ textAlign: 'center', marginBottom: '40px', paddingTop: '40px' }}>
                                    <h1 style={{ color: '#1f2d2a', fontWeight: 900, fontSize: '64px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>SBH GROUP</h1>
                                    <p style={{ color: '#64748b', fontWeight: 700, fontSize: '24px', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '10px' }}>Asset Verification System</p>
                                </div>

                                {/* QR CONTAINER */}
                                <div style={{ position: 'relative', width: '600px', height: '600px', marginTop: '20px', marginBottom: '40px' }}>
                                    <div style={{ width: '100%', height: '100%' }}>
                                        <QRCode
                                            value={publicLink}
                                            size={600}
                                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                            viewBox={`0 0 256 256`}
                                            level="H"
                                        />
                                    </div>
                                    {/* CENTER LABEL - AUTO FIT */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        backgroundColor: '#ffffff',
                                        padding: '8px 20px',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '5px solid white', // creates space around
                                        minWidth: '90px'
                                    }}>
                                        <span style={{ fontSize: '32px', fontWeight: 900, color: '#1f2d2a', lineHeight: 1 }}>{asset.id}</span>
                                    </div>
                                </div>

                                {/* FOOTER TEXT */}
                                <div style={{ textAlign: 'center', marginTop: 'auto', paddingBottom: '40px', width: '100%' }}>
                                    <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#1f2d2a', margin: 0, textTransform: 'uppercase' }}>{asset.machineName}</h2>
                                    <p style={{ fontSize: '20px', color: '#64748b', marginTop: '10px', fontWeight: 600 }}>Property of SBH Group Of Hospitals</p>
                                </div>
                            </div>

                            {/* Visible Card */}
                            {/* Visible Card */}
                            <div className="bg-white p-4 rounded-2xl mb-4 relative flex items-center justify-center" id="qr-code-view">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${publicLink}`}
                                    alt="Asset QR"
                                    className="w-[140px] h-[140px] object-contain relative z-0"
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                    <div className="bg-white px-2 py-1 rounded border border-[#1f2d2a] shadow-sm">
                                        <span className="text-xs font-black text-[#1f2d2a] tracking-tight">{asset.id}</span>
                                    </div>
                                </div>
                            </div>

                            <h3 className="font-black text-xl tracking-tight">Digital Identity</h3>
                            <p className="text-slate-400 text-sm mt-2">Scan to view details.</p>

                            <div className="flex flex-col gap-3 w-full mt-6">
                                <button
                                    onClick={handleDownloadQR}
                                    className="flex items-center gap-2 bg-white text-[#1f2d2a] hover:bg-slate-100 px-6 py-3 rounded-xl font-black uppercase tracking-wide text-xs transition-colors shadow-lg w-full justify-center"
                                >
                                    <Download size={16} /> Download QR (High Quality)
                                </button>

                                <button
                                    onClick={() => window.open(publicLink, '_blank')}
                                    className="flex items-center gap-2 bg-[#2e7d32] hover:bg-[#1b5e20] text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-[#2e7d32]/20 w-full justify-center"
                                >
                                    <ExternalLink size={18} /> Open Public Page
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Financial Intelligence Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Banknote size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Purchase Cost</p>
                                <p className="text-xl font-black text-[#1f2d2a]">
                                    {asset.purchaseCost ? `₹${Number(asset.purchaseCost).toLocaleString()}` : 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                                <Wrench size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Service Spend</p>
                                <p className="text-xl font-black text-[#1f2d2a]">
                                    {asset.totalServiceCost ? `₹${Number(asset.totalServiceCost).toLocaleString()}` : '₹0'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Wty / AMC Status</p>
                                <p className="text-sm font-bold text-[#1f2d2a]">
                                    {asset.amcTaken === 'Yes' ? 'AMC Active' : (asset.warrantyExpiry ? 'Warranty Active' : 'No Coverage')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Lifecycle Timeline */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h2 className="text-xl font-black text-[#1f2d2a] uppercase tracking-wide flex items-center gap-2">
                                    <History className="text-[#2e7d32]" size={24} /> Service & Event Timeline
                                </h2>
                                <p className="text-sm text-slate-500 font-medium mt-1">Complete history of services, repairs, and updates.</p>
                            </div>
                            <button
                                onClick={() => setShowServiceModal(true)}
                                className="flex items-center gap-2 bg-[#2e7d32] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#1b5e20] transition-colors shadow-lg shadow-[#2e7d32]/20 text-sm"
                            >
                                <span className="bg-white/20 p-1 rounded-lg"><Wrench size={14} /></span>
                                Add Service Record
                            </button>
                        </div>

                        <div className="relative border-l-2 border-slate-100 ml-3 space-y-8">
                            {(asset.history && asset.history.length > 0) ? (
                                [...asset.history].sort((a, b) => new Date(b.date) - new Date(a.date)).map((record, idx) => {
                                    let icon, bgColor, borderColor, titleColor;
                                    switch (record.type) {
                                        case 'event': // Asset Acquired
                                            icon = <Banknote size={16} />;
                                            bgColor = "bg-blue-50"; borderColor = "border-blue-100"; titleColor = "text-blue-800";
                                            break;
                                        case 'alert': // Replaced
                                            icon = <AlertTriangle size={16} />;
                                            bgColor = "bg-rose-50"; borderColor = "border-rose-100"; titleColor = "text-rose-800";
                                            break;
                                        case 'info': // Replacement Origin
                                            icon = <RefreshCw size={16} />;
                                            bgColor = "bg-purple-50"; borderColor = "border-purple-100"; titleColor = "text-purple-800";
                                            break;
                                        case 'service':
                                        default:
                                            icon = <Wrench size={16} />;
                                            bgColor = "bg-emerald-50"; borderColor = "border-emerald-100"; titleColor = "text-[#1f2d2a]";
                                    }

                                    return (
                                        <div key={idx} className="relative pl-8 group">
                                            <div className={`absolute -left-[9px] top-6 w-4 h-4 rounded-full bg-white border-4 ${record.type === 'alert' ? 'border-rose-500' : record.type === 'event' ? 'border-blue-500' : 'border-[#2e7d32]'} group-hover:scale-110 transition-transform`}></div>
                                            <div className={`${bgColor} p-6 rounded-2xl border ${borderColor} hover:shadow-md transition-shadow`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg bg-white/60 ${titleColor}`}>{icon}</div>
                                                        <h4 className={`font-black text-sm uppercase tracking-wide ${titleColor}`}>{record.name}</h4>
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white/60 px-2 py-1 rounded-lg border border-slate-200/50">{new Date(record.date).toLocaleDateString()}</span>
                                                </div>
                                                {record.details && (
                                                    <p className="text-sm text-slate-600 mt-2 font-medium leading-relaxed">{record.details}</p>
                                                )}
                                                {record.url && (
                                                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200/50">
                                                        <a href={record.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-[#2e7d32] hover:bg-emerald-50 transition-colors">
                                                            <Download size={14} /> View Service Report
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                                    <Clock className="mx-auto text-slate-300 mb-2" size={32} />
                                    <p className="text-slate-400 font-bold">No history records found.</p>
                                    <p className="text-xs text-slate-300 mt-1">Service records and events will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Add Service Modal */}
            {
                showServiceModal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pt-[60px]">
                        <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl max-h-[85vh] overflow-y-auto relative animate-slide-in">
                            <button onClick={() => setShowServiceModal(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200"><XCircle size={20} className="text-slate-500" /></button>
                            <h2 className="text-xl font-black text-[#1f2d2a] mb-6">Add Service Record</h2>
                            <form onSubmit={handleServiceSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Service Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                                            value={serviceForm.serviceDate}
                                            onChange={e => setServiceForm({ ...serviceForm, serviceDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-[#2e7d32] uppercase tracking-widest block mb-1">Next Due</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 font-bold text-emerald-800"
                                            value={serviceForm.nextServiceDate}
                                            onChange={e => setServiceForm({ ...serviceForm, nextServiceDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Service Type</label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold appearance-none"
                                            value={serviceForm.serviceType}
                                            onChange={e => {
                                                const type = e.target.value;
                                                setServiceForm(prev => ({
                                                    ...prev,
                                                    serviceType: type,
                                                    cost: (type === 'Warranty' || type === 'AMC') ? '' : prev.cost
                                                }));
                                            }}
                                        >
                                            <option value="Paid">Paid Service</option>
                                            <option value="Warranty">Warranty Service</option>
                                            <option value="AMC">AMC Service</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                        </div>
                                    </div>
                                </div>

                                {serviceForm.serviceType === 'Paid' && (
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Cost (₹)</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                                            value={serviceForm.cost}
                                            onChange={e => setServiceForm({ ...serviceForm, cost: e.target.value })}
                                            required
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Remarks</label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                                        rows="3"
                                        required
                                        value={serviceForm.remark}
                                        onChange={e => setServiceForm({ ...serviceForm, remark: e.target.value })}
                                    ></textarea>
                                </div>

                                {/* Auto-Filled / Editable Location & Contact Info */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Service Location & Contact</h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Location</label>
                                            <input type="text" className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold"
                                                value={serviceForm.location || asset.location || ''}
                                                onChange={e => setServiceForm({ ...serviceForm, location: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Department</label>
                                            <input type="text" className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold"
                                                value={serviceForm.department || asset.department || ''}
                                                onChange={e => setServiceForm({ ...serviceForm, department: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Service Vendor</label>
                                            <input type="text" className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold"
                                                value={serviceForm.serviceVendor || asset.vendorName || ''}
                                                onChange={e => setServiceForm({ ...serviceForm, serviceVendor: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Responsible Person</label>
                                            <input type="text" className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold"
                                                value={serviceForm.responsiblePerson || asset.responsiblePerson || ''}
                                                onChange={e => setServiceForm({ ...serviceForm, responsiblePerson: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Upload Service Report</label>
                                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 relative">
                                        <input
                                            type="file"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                if (e.target.files[0]) {
                                                    setServiceForm({ ...serviceForm, file: e.target.files[0], fileName: e.target.files[0].name });
                                                }
                                            }}
                                        />
                                        {serviceForm.fileName ? (
                                            <span className="text-sm font-bold text-[#2e7d32] flex items-center justify-center gap-2"><CheckCircle size={16} /> {serviceForm.fileName}</span>
                                        ) : (
                                            <span className="text-sm text-slate-400 font-bold flex items-center justify-center gap-2"><UploadCloud size={16} /> Upload PDF</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowServiceModal(false)}
                                        className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 py-3 rounded-xl font-bold text-white bg-[#1f2d2a] hover:bg-[#2e7d32] transition-colors"
                                    >
                                        {submitting ? 'Saving...' : 'Save Record'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div >
                )
            }

            {/* Edit Asset Modal */}
            {
                showEditModal && (
                    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[60px] pb-4 px-4 bg-black/60 backdrop-blur-sm overflow-hidden">
                        <div className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-in relative">
                            <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200"><XCircle size={20} className="text-slate-500" /></button>
                            <h2 className="text-xl font-black text-[#1f2d2a] mb-6 flex items-center gap-2"><Edit className="text-[#2e7d32]" size={24} /> Edit Asset Details</h2>
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Machine Name</label>
                                        <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                                            value={editForm.machineName || ''} onChange={e => setEditForm({ ...editForm, machineName: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Serial Number</label>
                                        <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                                            value={editForm.serialNumber || ''} onChange={e => setEditForm({ ...editForm, serialNumber: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Location</label>
                                        <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                                            value={editForm.location || ''} onChange={e => setEditForm({ ...editForm, location: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Department</label>
                                        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                                            value={editForm.department || ''} onChange={e => setEditForm({ ...editForm, department: e.target.value })}>
                                            <option value="">Select...</option>
                                            <option value="Radiology">Radiology</option>
                                            <option value="Pathology">Pathology</option>
                                            <option value="OT">OT</option>
                                            <option value="ICU">ICU</option>
                                            <option value="OPD">OPD</option>
                                            <option value="General Ward">General Ward</option>
                                            <option value="IT">IT</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Related Words (Keywords)</label>
                                        <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                                            placeholder="e.g. Printer, Scanner, Office"
                                            value={editForm.keywords || ''} onChange={e => setEditForm({ ...editForm, keywords: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Matter / Description</label>
                                        <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                                            placeholder="Brief description..."
                                            value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Purchase Cost (₹)</label>
                                        <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                                            value={editForm.purchaseCost || ''} onChange={e => setEditForm({ ...editForm, purchaseCost: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Purchase Date</label>
                                        <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                                            value={editForm.purchaseDate || ''} onChange={e => setEditForm({ ...editForm, purchaseDate: e.target.value })} />
                                    </div>
                                </div>

                                {/* New Field: Last Service Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Last Service Date</label>
                                        <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                                            value={editForm.currentServiceDate ? new Date(editForm.currentServiceDate).toISOString().split('T')[0] : ''}
                                            onChange={e => setEditForm({ ...editForm, currentServiceDate: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Next Service Date</label>
                                        <input type="date" className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 font-bold text-emerald-800"
                                            value={editForm.nextServiceDate ? new Date(editForm.nextServiceDate).toISOString().split('T')[0] : ''}
                                            onChange={e => setEditForm({ ...editForm, nextServiceDate: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Vendor Name</label>
                                        <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                                            value={editForm.vendorName || ''} onChange={e => setEditForm({ ...editForm, vendorName: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Vendor Contact</label>
                                        <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                                            value={editForm.vendorContact || ''} onChange={e => setEditForm({ ...editForm, vendorContact: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-black text-indigo-800 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded w-fit mb-1 block">Responsible Person</label>
                                        <input type="text" className="w-full bg-indigo-50/50 border border-indigo-100 rounded-xl px-3 py-2 font-bold"
                                            value={editForm.responsiblePerson || ''} onChange={e => setEditForm({ ...editForm, responsiblePerson: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-indigo-800 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded w-fit mb-1 block">Responsible Mobile</label>
                                        <input type="text" className="w-full bg-indigo-50/50 border border-indigo-100 rounded-xl px-3 py-2 font-bold"
                                            value={editForm.responsibleMobile || ''} onChange={e => setEditForm({ ...editForm, responsibleMobile: e.target.value })} />
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-4 mt-2">
                                    <h3 className="text-sm font-black text-[#2e7d32] uppercase tracking-widest mb-3">Warranty & AMC</h3>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Warranty Type</label>
                                            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                                                value={editForm.warrantyType || 'None'} onChange={e => setEditForm({ ...editForm, warrantyType: e.target.value })}>
                                                <option value="None">None</option>
                                                <option value="1 Year">1 Year</option>
                                                <option value="2 Years">2 Years</option>
                                                <option value="3 Years">3 Years</option>
                                                <option value="5 Years">5 Years</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Warranty Expiry</label>
                                            <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                                                value={editForm.warrantyExpiry || ''} onChange={e => setEditForm({ ...editForm, warrantyExpiry: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">AMC Taken?</label>
                                            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                                                value={editForm.amcTaken || 'No'} onChange={e => setEditForm({ ...editForm, amcTaken: e.target.value })}>
                                                <option value="No">No</option>
                                                <option value="Yes">Yes</option>
                                            </select>
                                        </div>
                                        {editForm.amcTaken === 'Yes' && (
                                            <>
                                                <div>
                                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">AMC Expiry</label>
                                                    <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                                                        value={editForm.amcExpiry || ''} onChange={e => setEditForm({ ...editForm, amcExpiry: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">AMC Cost</label>
                                                    <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                                                        value={editForm.amcAmount || ''} onChange={e => setEditForm({ ...editForm, amcAmount: e.target.value })} />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
                                    <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl font-bold text-white bg-[#1f2d2a] hover:bg-[#2e7d32] transition-colors">{submitting ? 'Saving...' : 'Update Asset'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Replace Asset Modal */}
            {
                showReplaceModal && (
                    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[60px] pb-4 px-4 bg-black/60 backdrop-blur-sm overflow-hidden">
                        <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-in relative">
                            <button onClick={() => setShowReplaceModal(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200"><XCircle size={20} className="text-slate-500" /></button>
                            <h2 className="text-xl font-black text-[#1f2d2a] mb-6 flex items-center gap-2"><RefreshCw className="text-rose-600" size={24} /> Mark as Replaced</h2>
                            <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl mb-6 text-sm text-rose-800">
                                <strong>⚠️ Important:</strong> This asset will be marked as "Replaced". A new asset ID will be created for the replacement machine. The history will be linked.
                            </div>
                            <form onSubmit={handleReplaceSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Reason for Replacement</label>
                                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                                        value={replaceForm.reason} onChange={e => setReplaceForm({ ...replaceForm, reason: e.target.value })}>
                                        <option>Beyond Repair</option>
                                        <option>Too Old / Obsolete</option>
                                        <option>Upgrade</option>
                                        <option>Lost / Stolen</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Remarks</label>
                                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium" rows="2"
                                        value={replaceForm.remark} onChange={e => setReplaceForm({ ...replaceForm, remark: e.target.value })}></textarea>
                                </div>

                                <div className="border-t border-slate-200 pt-4 mt-4">
                                    <h3 className="text-sm font-black text-[#1f2d2a] uppercase tracking-widest mb-4">New Machine Details</h3>
                                    <div className="space-y-4">
                                        <input type="text" placeholder="New Machine Name" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                                            value={replaceForm.newMachineName} onChange={e => setReplaceForm({ ...replaceForm, newMachineName: e.target.value })} />

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">New Serial No</label>
                                                <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                                                    value={replaceForm.newSerialNumber} onChange={e => setReplaceForm({ ...replaceForm, newSerialNumber: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Cost (₹)</label>
                                                <input type="number" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                                                    value={replaceForm.newPurchaseCost} onChange={e => setReplaceForm({ ...replaceForm, newPurchaseCost: e.target.value })} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Location</label>
                                                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-600"
                                                    value={replaceForm.location} onChange={e => setReplaceForm({ ...replaceForm, location: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Department</label>
                                                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-600"
                                                    value={replaceForm.department} onChange={e => setReplaceForm({ ...replaceForm, department: e.target.value })} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">New Vendor Name</label>
                                                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-600"
                                                    value={replaceForm.vendorName} onChange={e => setReplaceForm({ ...replaceForm, vendorName: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Vendor Contact</label>
                                                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-600"
                                                    value={replaceForm.vendorContact} onChange={e => setReplaceForm({ ...replaceForm, vendorContact: e.target.value })} />
                                            </div>
                                        </div>

                                        <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                                            <label className="text-xs font-black text-indigo-800 uppercase tracking-widest block mb-2">Responsible Person (Auto-Filled)</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <input type="text" placeholder="Name" className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 font-bold text-slate-700"
                                                    value={replaceForm.responsiblePerson} onChange={e => setReplaceForm({ ...replaceForm, responsiblePerson: e.target.value })} />
                                                <input type="text" placeholder="Mobile" className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 font-bold text-slate-700"
                                                    value={replaceForm.responsibleMobile} onChange={e => setReplaceForm({ ...replaceForm, responsibleMobile: e.target.value })} />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Purchase Date</label>
                                            <input type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                                                value={replaceForm.newPurchaseDate} onChange={e => setReplaceForm({ ...replaceForm, newPurchaseDate: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Upload New Invoice</label>
                                            <input type="file" className="w-full font-bold text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#1f2d2a] file:text-white hover:file:bg-[#2e7d32]"
                                                onChange={(e) => {
                                                    if (e.target.files[0]) setReplaceForm({ ...replaceForm, newInvoiceFile: e.target.files[0], newInvoiceName: e.target.files[0].name });
                                                }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowReplaceModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100">Cancel</button>
                                    <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700">{submitting ? 'Processing...' : 'Confirm Replacement'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AssetDetails;
