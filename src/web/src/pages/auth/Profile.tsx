import { Link , useNavigate} from "react-router-dom";
import { useState } from "react";
import { IconSettings,IconHistory, IconChevronRight, IconShieldLock, IconTrash, IconLogout } from "@tabler/icons-react";
import { useAuthStore } from "../../store/useAuthStore";
import { authService } from "../../services/authService";

interface ProfileRowProps{
icon: React.ReactNode;
label: string;
onClick: () => void;
danger?: boolean;
}

function ProfileRow({icon,label,onClick,danger}:ProfileRowProps){
  return (
    <button
    onClick={onClick}
    className="w-full flex items-center justify-between px-4 py-3.5 bg-white hover:bg-gray-50 transition-colors text left">

<span className={'flex items-center gap-3 text-sm font-medium ${danger ? "text-red-500" : "text-navy-700"}'}>
  <span className={danger ? "text-red-400" : "text-gray-400"}>
    {icon}
  </span>
  {label}
</span>
<IconChevronRight size={16} className={"text-gray-300"} />
</button>
  );
}


export default function Profile() {
const {user, clearUser} = useAuthStore();
const navigate = useNavigate();
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

if(!user) return null;

const handleLogout = async () => {
  try {
    await authService.logout();
  }catch {
  }finally{
    clearUser();
    navigate("/auth/login");}
  };


return (
<div className="max-w-xl mx-auto">
<div className="bg-navy-700 round-t-2xl px-6 pt-10 pb-6 pb-8">
  <div className="flex item-center justify-between mb-6">
    <h1 className="text-xl font-bold text-white">Profile</h1>
    <button 
    onClick={() => navigate("/profile/settings")}
    className="text-white/70 hover:text-white transition-colors"
    aria-label="Settings">
      <IconSettings size={20} />
      </button>
  </div>
  <div className="flex items-center gap-4">
<div className="w-16 h-16 rounded-full bg-white text-navy-700 flex items-center justify-center text-xl font-bold shadow-lg">
{user.initials}
</div>
<div>

<p className="text-base font-bold text-white">
  {user.name}
</p>
</div>
</div>
</div>

<div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 pb-6 pt-4 -mt-10 mx-4">
<ProfileRow
icon={<IconHistory size={18} />}
label="View Activity History"
onClick={() => navigate("/activity")}
/>

<ProfileRow
icon={<IconShieldLock size={18} />}
label="Privacy & Security"
onClick={() => navigate("/profile/privacy")}
/>

</div>

<div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 pb-6 pt-4 -mt-10 mx-4">
  <ProfileRow
icon={<IconTrash size={18} />}
label="Delete Account"
onClick={() => setShowDeleteConfirm(true)}
danger
/>

<ProfileRow
icon={<IconLogout size={18} />}
label="Logout"
onClick={() => handleLogout()}
/>
</div>

</div>

);
}