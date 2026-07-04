import { useNavigate} from "react-router-dom";
import { useState } from "react";
import { IconSettings,IconHistory, IconChevronRight, IconShieldLock, IconTrash, IconLogout, IconAlertTriangle, IconX, IconSchool} from "@tabler/icons-react";
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
    className="w-full flex items-center justify-between px-4 py-3.5 bg-white hover:bg-gray-50 transition-colors text-left">

<span className={'flex items-center gap-3 text-sm font-medium ${danger ? "text-red-500" : "text-navy-700"}'}>
  <span className={danger ? "text-red-400" : "text-gray-400"}>
    {icon}
  </span>
  {label}
</span>
<IconChevronRight size={16} className="text-gray-300" />
</button>
  );
}


export default function Profile() {
const {user, clearUser} = useAuthStore();
const navigate = useNavigate();
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [deleting, setDeleting] = useState(false);
const [deleteError, setDeleteError] = useState<string | null>(null);

if(!user) return null;

const handleLogout = async () => {
  try {
    await authService.logout();
  }catch {
  }finally{
    clearUser();
    navigate("/auth/login");}
  };

const handleDeleteAccount = async () => {
  setDeleting(true);
  setDeleteError(null);
  try {
    clearUser();
    navigate("/auth/login");
  } catch {
    setDeleteError("Failed to delete account. Please try again.");
    setDeleting(false);
  }};


return (
<div className="max-w-xl mx-auto">
<div className="bg-navy-700 rounded-t-3xl px-6 pt-8 pb-10">
  <div className="flex item-center justify-between mb-8">
    <h1 className="text-2xl font-bold text-white">Profile</h1>
    <button 
    onClick={() => navigate("/profile/settings")}
    className="text-white/70 hover:text-white transition-colors"
    aria-label="Settings">
      <IconSettings size={22} />
      </button>
  </div>
  <div className="flex items-center gap-5">
<div className="w-20 h-20 rounded-full bg-white text-navy-700 flex items-center justify-center text-2xl font-bold shadow-lg flex-shrink-0">
{user.initials}
</div>
<div>

<p className="text-base font-bold text-white">
  {user.name}
</p>
</div>
</div>
</div>

<div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-5 mx-4 px-5 py-4 flex items-center gap-3">
  <div className="w-9 h-9 rounded-full bg-sky-50 text-sky-500 flex item-center justify-center flex-shirnk-0">
  <IconSchool size={18}/>
  </div>
  <div>
    <p className="text-sm font-semibold text-navy-900">
      {user.course ?? "Course not set"}
      </p>
      {user.year && (
        <p className="text-xs text-gray-400">Year {user.year}</p>
      )}
      </div>
      </div>

<div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-5 mx-4 overflow-hidden divide-y divide-gray-50">
<ProfileRow
icon={<IconHistory size={19} />}
label="View Activity History"
onClick={() => navigate("/activity")}
/>

<ProfileRow
icon={<IconShieldLock size={19} />}
label="Privacy & Security"
onClick={() => navigate("/profile/privacy")}
/>



  <ProfileRow
icon={<IconTrash size={19} />}
label="Delete Account"
onClick={() => setShowDeleteConfirm(true)}
danger
/>

<ProfileRow
icon={<IconLogout size={19} />}
label="Logout"
onClick={handleLogout}
/>
</div>


{showDeleteConfirm && (
<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-2 text-red-500">
        <IconAlertTriangle size={20} />
        <h3 className="font-bold text-navy-900">Delete Account </h3>
        </div>
      <button
      onClick={() => setShowDeleteConfirm(false)}
      className="text-gray-400 hover:text-gray-600 transition-colors"
      aria-label="Close">

      <IconX size={18} />
      </button>
    </div>
    <p className="text-sm text-gray-600 mb-6">
      Are you sure you want to delete your account? This action cannot be undone.
    </p>
    {deleteError && (
      <p className="text-sm text-red-500 mb-4">{deleteError}</p>
    )}
    <div className="flex gap-3">
      <button
      onClick={() => setShowDeleteConfirm(false)}
      className="flex-1 rounded-full border border-gray-200 text-gray-600 font-semibold text-sm py-2.5 hover:bg-gray-50 transition-colors">
        Cancel
      </button>
      <button
      onClick={handleDeleteAccount}
      disabled={deleting}
      className="flex-1 rounded-full bg-red-500 text-white font-semibold text-sm py-2.5 hover:bg-red-600 transition-colors disabled:opacity-50"
      >
        {deleting ? "Deleting..." : "Delete Account"}
      </button>
    </div>
  </div>

 </div>
)
}

</div>
);
}