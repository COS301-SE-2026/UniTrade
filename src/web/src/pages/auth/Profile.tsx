import { Link , useNavigate} from "react-router-dom";
import { IconSettings,IconHistory } from "@tabler/icons-react";
import { useAuthStore } from "../../store/useAuthStore";
import { authService } from "../../services/authService";
export default function Profile() {
const {user, clearUser} = useAuthStore();
const navigate = useNavigate();

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

<a href="/activity"
onClick={(e) => {
  e.preventDefault();
  navigate("/activity");
}}
className="flex items-center justifiy-center gap-2 text-sm font-medium text-navy-700 hover:text-navy-900">

<IconHistory size={16} />
<span>View Activity History</span>
</a>
<button
onClick={handleLogout}
className="w-full mt-4 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"



>
LOGOUT
</button>

</div>
</div>
);
}