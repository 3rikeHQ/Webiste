import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Lock, 
  Key, 
  Snowflake, 
  MessageCircle, 
  X, 
  Info, 
  ChevronRight, 
  BadgeCheck,
  Hourglass,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { getVerificationStatus } from "@/lib/ownership";

// KYC badge on the profile card
const KYC_BADGE = {
    not_started: { icon: ShieldAlert, label: "KYC not done", className: "bg-[#FFF7EC] text-[#EE9C2E]" },
    in_progress: { icon: Hourglass, label: "KYC under review", className: "bg-white/20 text-white" },
    approved: { icon: BadgeCheck, label: "Verified", className: "bg-[#D5FF19] text-[#0F4A1E]" },
    "3riker": { icon: BadgeCheck, label: "Verified 3riker", className: "bg-[#D5FF19] text-[#0F4A1E]" },
};

type MenuItemProps = {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    showBorder?: boolean;
};

// Helper component for individual menu items
const MenuItem = ({ icon: Icon, label, onClick }: MenuItemProps) => (
    <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-between p-3 text-left active:bg-green-100 transition-colors"
    >
        <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-[#01C259]" strokeWidth={2} />
            <span className="text-gray-500 font-light text-sm">{label}</span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
    </button>
);

// Helper for the grouped rounded containers
const MenuGroup = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-[#E6F6E94D] rounded-xl overflow-hidden mb-8">
        {children}
    </div>
);

export default function SettingsHome() {
    const navigate = useNavigate();
    const kycStatus = getVerificationStatus();
    const badge = KYC_BADGE[kycStatus];

    return (
        <div className="fixed inset-0 bg-white flex flex-col h-full">
            
            {/* --- Header --- */}
            <div className="relative flex items-center justify-center pt-12 pb-6 px-6 bg-white shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                    className="absolute left-6 w-10 h-10 rounded-full bg-[#F3F8F5] hover:bg-green-50 text-[#01C259]"
                >
                    <img src="/rounded-back.svg" alt="Back" className="w-10 h-10" />
                </Button>
                
                <h1 className="font-semibold text-sm text-black">
                    Settings
                </h1>
            </div>

            {/* --- Scrollable Content --- */}
            <div className="flex-1 overflow-y-auto px-6 pb-24 mt-5">

                {/* Profile card */}
                <button
                    type="button"
                    onClick={() => navigate("/driver/settings/profile")}
                    className="group relative w-full flex items-center gap-4 overflow-hidden rounded-2xl bg-linear-to-br from-[#01C259] to-[#1B8036] p-4 mb-3 text-left text-white shadow-lg shadow-[#01C259]/25 active:scale-[0.98] transition-transform animate-in fade-in slide-in-from-bottom-2 duration-500"
                >
                    <span className="absolute -right-8 -top-10 w-32 h-32 rounded-full bg-white/10" />
                    <span className="absolute right-10 -bottom-12 w-24 h-24 rounded-full bg-white/5" />
                    <img src="/profile.png" alt="" className="relative w-14 h-14 shrink-0 rounded-full border-2 border-white/70 bg-gray-200 object-cover" />
                    <div className="relative flex-1 min-w-0">
                        <p className="font-semibold text-base truncate">Effiong Musa</p>
                        <span className={`inline-flex items-center gap-1 mt-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.className}`}>
                            <badge.icon className="w-3.5 h-3.5" />
                            {badge.label}
                        </span>
                    </div>
                    <span className="relative flex items-center gap-0.5 text-xs text-white/85">
                        View
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                </button>

                {kycStatus === "not_started" ? (
                    <button
                        type="button"
                        onClick={() => navigate("/driver/verification")}
                        className="w-full flex items-center justify-between rounded-xl border border-dashed border-[#F1B058] bg-[#FFF7EC] px-4 py-3 mb-8 text-left text-sm text-[#B4741D] active:scale-[0.98] transition-transform"
                    >
                        Complete your KYC to own a 3rike
                        <ChevronRight className="w-4 h-4 shrink-0" />
                    </button>
                ) : (
                    <div className="mb-8" />
                )}

                {/* Group 1: Profile & Security */}
                <MenuGroup>
                    <MenuItem 
                        icon={User} 
                        label="My Profile" 
                        onClick={() => navigate("/driver/settings/profile")} 
                    />
                    <MenuItem 
                        icon={Lock} 
                        label="Payment Settings" 
                        onClick={() => navigate("/driver/settings/payment")} 
                    />
                    <MenuItem 
                        icon={Key} 
                        label="Login Settings" 
                        onClick={() => {}} 
                        showBorder={false}
                    />
                </MenuGroup>

                {/* Group 2: Account Actions */}
                <MenuGroup>
                    <MenuItem 
                        icon={Snowflake} 
                        label="Freeze account" 
                        onClick={() => {}} 
                    />
                    <MenuItem 
                        icon={MessageCircle} 
                        label="SMS Alert Settings" 
                        onClick={() => {}} 
                        showBorder={false}
                    />
                </MenuGroup>

                {/* Group 3: Close Account */}
                <MenuGroup>
                    <MenuItem 
                        icon={X} 
                        label="Close account" 
                        onClick={() => {}} 
                        showBorder={false}
                    />
                </MenuGroup>

                {/* Group 4: About */}
                <MenuGroup>
                    <MenuItem 
                        icon={Info} 
                        label="About" 
                        onClick={() => {}} 
                        showBorder={false}
                    />
                </MenuGroup>

            </div>

            {/* --- Footer Button --- */}
            <div className="absolute bottom-15 left-0 right-0 p-6 bg-white/80 backdrop-blur-sm">
                <Button
                    className="w-full py-6 rounded-xl bg-[#01C259] hover:bg-[#01b050] text-white text-lg font-light shadow-md transition-all active:scale-[0.98]"
                >
                    Sign Out
                </Button>
            </div>

        </div>
    );
}