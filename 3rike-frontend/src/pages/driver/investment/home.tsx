import { useState } from 'react';
import {
    Check,
    ChevronDown,
    Minus,
    Plus,
    PieChart,
    ShieldCheck,
    Hourglass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from "react-router-dom";
import Sheet from "@/components/bottom-sheet";
import { getVerificationStatus } from "@/lib/ownership";
import FleetGallery from "./fleet-gallery";
// --- Types & Mock Data ---

type Transaction = {
    id: string;
    title: string;
    date: string;
    amount: string;
    status: 'Successful' | 'Pending';
    type: 'fleet' | 'share';
    count: number;
};

const FLEET_HISTORY: Transaction[] = [
    { id: '1', title: '1 Fleet Purchased', date: 'Dec 1st, 7:47:44', amount: '$2800', status: 'Successful', type: 'fleet', count: 1 },
    { id: '2', title: '3 Fleets Purchased', date: 'Dec 1st, 09:47:44', amount: '$8400', status: 'Successful', type: 'fleet', count: 3 },
];

const SHARE_HISTORY: Transaction[] = [
    { id: '3', title: '3 Shares Purchased', date: 'Dec 1st, 7:47:44', amount: '$168', status: 'Successful', type: 'share', count: 3 },
    { id: '4', title: '10 Shares Purchased', date: 'Dec 1st, 09:47:44', amount: '$560', status: 'Successful', type: 'share', count: 10 },
];

const STATS = {
    fleets: { owned: 0, active: 0, completed: 0 },
    shares: { owned: 0, active: 0, completed: 0 }
};

const PRICING = {
    fleet: { unitPrice: 1400, label: 'Fleets', addLabel: 'Add fleets' },
    share: { unitPrice: 56, label: 'Shares', addLabel: 'Add Shares' }
};

// --- Main Component ---

export default function InvestmentApp() {
    const navigate = useNavigate();
    // 1. Navigation State: 'investment' (Purchase), 'fleets' (History), 'shares' (History)
    const [activeTab, setActiveTab] = useState<'investment' | 'fleets' | 'shares'>('investment');

    // 2. Investment/Purchase State
    const [purchaseQuantity, setPurchaseQuantity] = useState(2);
    const [isPurchaseFleetMode, setIsPurchaseFleetMode] = useState(true); // Toggle inside Investment tab

    // 3. View State (Success Screen)
    const [showSuccess, setShowSuccess] = useState(false);
    // KYC must be approved before buying; holds the blocking status while its sheet is open
    const [kycGate, setKycGate] = useState<'not_started' | 'in_progress' | null>(null);

    // Derived Purchase Data
    const currentPurchaseMode = isPurchaseFleetMode ? 'fleet' : 'share';
    const { unitPrice, addLabel } = PRICING[currentPurchaseMode];
    const totalPrice = purchaseQuantity * unitPrice;

    // Handlers
    const handleIncrement = () => setPurchaseQuantity((prev) => prev + 1);
    const handleDecrement = () => setPurchaseQuantity((prev) => (prev > 1 ? prev - 1 : 1));
    const togglePurchaseMode = (checked: boolean) => {
        setIsPurchaseFleetMode(checked);
        setPurchaseQuantity(checked ? 2 : 10); // Auto-adjust quantity for UX
    };

    const handlePurchase = () => {
        const status = getVerificationStatus();
        if (status === 'not_started' || status === 'in_progress') {
            setKycGate(status);
            return;
        }
        setShowSuccess(true);
    };

    // --- Success Screen View ---
    if (showSuccess) {
        return (
            <div className="min-h-screen flex justify-center items-center p-4">
                <div className="w-full max-w-md bg-white rounded-[30px] overflow-hidden min-h-200 flex flex-col items-center justify-center p-8 text-center relative">
                    <div className="mb-6">
                        {/* Placeholder for Success Icon */}
                        <div className="relative mx-auto">
                            <img src="/tricycle-success.svg" alt="Success Rickshaw" className="object-contain" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-extrabold text-black mb-2">Successfully Sent!</h2>
                    <p className="text-gray-400">
                        {purchaseQuantity} {isPurchaseFleetMode ? 'fleets' : 'shares'} successfully purchased
                    </p>
                    <Button
                        variant="ghost"
                        className="absolute top-8 left-6 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowSuccess(false)}
                    >
                        Close
                    </Button>
                </div>
            </div>
        );
    }

    // --- Main Dashboard View ---
    return (
        <div className="min-h-screen flex justify-center items-center p-2">
            <div className="w-full bg-white rounded-[30px] overflow-hidden min-h-212.5 flex flex-col relative">

                {/* --- Top Header Navigation --- */}
                <header className="pt-6 px-5 pb-2 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full bg-[#F3F8F5] hover:bg-green-50 text-[#01C259]"
                    >
                        <img src="/rounded-back.svg" alt="Back" className="w-10 h-10" />
                    </Button>
                    <div className="flex items-center gap-4 text-xs font-sm">
                        {/* Tab 1: Investment (Purchase) */}
                        <button
                            onClick={() => setActiveTab('investment')}
                            className={`text-sm transition-colors ${activeTab === 'investment' ? 'text-black font-bold' : 'text-gray-400'}`}
                        >
                            Investment
                        </button>

                        {/* Tab 2: Fleets (History) */}
                        <button
                            onClick={() => setActiveTab('fleets')}
                            className={`text-sm transition-colors ${activeTab === 'fleets' ? 'text-black font-bold' : 'text-gray-400'}`}
                        >
                            Fleets
                        </button>

                        {/* Tab 3: Shares (History) */}
                        <button
                            onClick={() => setActiveTab('shares')}
                            className={`text-sm transition-colors ${activeTab === 'shares' ? 'text-black font-bold' : 'text-gray-400'}`}
                        >
                            Shares
                        </button>
                    </div>
                    <div className="w-10" /> {/* Spacer */}
                </header>

                {/* --- Scrollable Content Content --- */}
                <div className="flex-1 flex flex-col px-6 pb-8 overflow-y-auto">

                    {/* Fleet photos (Visible on all tabs) */}
                    <FleetGallery />

                    {/* --- CONDITIONAL CONTENT RENDER --- */}

                    {/* VIEW 1: INVESTMENT (PURCHASE SCREEN) */}
                    {activeTab === 'investment' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Quantity Stepper */}
                            <div className="flex items-center justify-between mb-8 px-4">
                                <Button variant="outline" size="icon" onClick={handleDecrement} className="rounded-full h-10 w-10 border-gray-300 hover:bg-gray-100">
                                    <Minus className="h-4 w-4 text-gray-500" />
                                </Button>

                                <div className="flex flex-col items-center">
                                    <span className="text-3xl font-bold text-black">{purchaseQuantity}</span>
                                    <span className="text-xs text-gray-400 uppercase tracking-wide font-medium mt-1">{addLabel}</span>
                                </div>

                                <Button variant="outline" size="icon" onClick={handleIncrement} className="rounded-full h-10 w-10 border-gray-300 hover:bg-gray-100">
                                    <Plus className="h-4 w-4 text-gray-500" />
                                </Button>
                            </div>

                            {/* Toggle Switch */}
                            <div className="flex flex-col items-center gap-3 mb-8">
                                <div className="flex items-center gap-4">
                                    <PieChart className={`w-6 h-6 transition-colors duration-300 ${!isPurchaseFleetMode ? 'text-green-500' : 'text-gray-400'}`} />
                                    <Switch
                                        checked={isPurchaseFleetMode}
                                        onCheckedChange={togglePurchaseMode}
                                        className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-green-500 border-2 border-transparent"
                                    />
                                    <img
                                        src={isPurchaseFleetMode ? "/full_moon_fill.svg" : "/full_moon_fill_disabled.svg"}
                                        className="w-6 h-6 transition-all duration-300"
                                        alt="Moon Icon"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 text-center">Toggle button to buy either full share or a full fleet</p>
                            </div>

                            {/* Purchase Button */}
                            <div className="mt-auto">
                                <Button onClick={handlePurchase} className="w-full bg-[#00C058] hover:bg-[#00a84d] text-white text-lg  h-14 rounded-xl shadow-lg shadow-green-100">
                                    Purchase for ${totalPrice}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* VIEW 2 & 3: HISTORY/STATS (FLEETS OR SHARES) */}
                    {(activeTab === 'fleets' || activeTab === 'shares') && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <Tabs defaultValue="owned" className="w-full">
                                <TabsList className="w-full flex justify-between bg-transparent border-b border-gray-100 rounded-none h-auto p-0 mb-6">
                                    <TabsTrigger
                                        value="owned"
                                        className="flex-1 pb-3 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-b-[#00C058] text-gray-400 data-[state=active]:text-black font-semibold text-base"
                                    >
                                        {activeTab === 'fleets' ? 'Fleets Owned' : 'Shares Owned'}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="history"
                                        className="flex-1 pb-3 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-b-[#00C058] text-gray-400 data-[state=active]:text-black font-semibold text-base"
                                    >
                                        History
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="owned" className="mt-0">
                                    <div className="bg-gray-100 rounded-2xl p-6 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 italic font-medium text-sm">{activeTab === 'fleets' ? 'Owned' : 'Shares Owned'}</span>
                                            <span className="text-purple-600 font-bold">{activeTab === 'fleets' ? STATS.fleets.owned : STATS.shares.owned}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 italic font-medium text-sm">Active</span>
                                            <span className="text-purple-600 font-bold">{activeTab === 'fleets' ? STATS.fleets.active : STATS.shares.active}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 italic font-medium text-sm">Completed</span>
                                            <span className="text-purple-600 font-bold">{activeTab === 'fleets' ? STATS.fleets.completed : STATS.shares.completed}</span>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="history" className="mt-0">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-1 font-bold text-lg">Dec <ChevronDown className="w-4 h-4" /></div>
                                        <div className="flex items-center gap-1 text-sm font-bold">View All <ChevronDown className="w-4 h-4" /></div>
                                    </div>

                                    <div className="space-y-4">
                                        {(activeTab === 'fleets' ? FLEET_HISTORY : SHARE_HISTORY).map((item) => (
                                            <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                                                    <Check className="w-5 h-5 text-green-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-bold text-sm text-gray-900">{item.title}</h3>
                                                        <span className="font-medium text-gray-400 text-sm">{item.amount}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <p className="text-xs text-gray-400">{item.date}</p>
                                                        <p className="text-[10px] font-bold text-green-500">{item.status}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </div>
            </div>

            {kycGate && (
                <Sheet label="KYC required" onClose={() => setKycGate(null)}>
                    <div className="flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
                        <span className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${kycGate === 'not_started' ? 'bg-[#E9F8EE]' : 'bg-[#FFF7EC]'}`}>
                            {kycGate === 'not_started'
                                ? <ShieldCheck className="w-8 h-8 text-[#01C259]" />
                                : <Hourglass className="w-8 h-8 text-[#EE9C2E]" />}
                        </span>
                        <h3 className="text-xl font-bold text-gray-900">
                            {kycGate === 'not_started' ? 'Verify your identity to invest' : 'Your KYC is under review'}
                        </h3>
                        <p className="text-sm text-[#909090] mt-2 max-w-72">
                            {kycGate === 'not_started'
                                ? `KYC is required before you buy ${purchaseQuantity} ${isPurchaseFleetMode ? 'fleets' : 'shares'}. It takes about 3 minutes.`
                                : "You can invest as soon as you're approved. Check your status on the home screen."}
                        </p>
                        <Button
                            onClick={() =>
                                kycGate === 'not_started'
                                    ? navigate('/driver/verification', { state: { kycRequired: true } })
                                    : navigate('/driver', { state: { kycPending: true } })
                            }
                            className="mt-8 w-full h-14 rounded-xl bg-[#01C259] hover:bg-[#00a049] text-white text-base font-medium"
                        >
                            {kycGate === 'not_started' ? 'Start KYC' : 'Check status'}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setKycGate(null)}
                            className="mt-2 w-full h-12 rounded-xl text-gray-500"
                        >
                            Not now
                        </Button>
                    </div>
                </Sheet>
            )}
        </div>
    );
}