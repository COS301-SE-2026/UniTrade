import { Link , useNavigate} from "react-router-dom";
import { IconHistory } from "@tabler/icons-react";
import { useAuthStore } from "../../store/useAuthStore";
import { authService } from "../../services/authService";
export default function Profile() {
const {user} = useAuthStore();
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
<div className="bg-navy-700 round-t-2xl px-6 pt-10 pb-16 flex flex-col items-center">
<div className="w-24 h-24 rounded-full bg-white text-navy-700 flex items-center justify-center text-3xl font-bold shadow-lg">
{user.initials}
</div>
</div>

<div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 pb-6 pt-4 -mt-10 mx-4">
<div className="text-center mt-6">
<p className="text-lg font-bold text-navy-900">{user.name}</p>
</div>

<Link to="/activity" className="flex items-center justifiy-center gap-2 text-sm font-medium text-navy-700 hover:text-navy-900">
<IconHistory size={16} />
<span>View Activity History</span>
</Link>
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