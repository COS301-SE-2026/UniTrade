import { useAuthStore } from "../../store/useAuthStore";
export default function Profile() {
const {user} = useAuthStore();

if(!user) return null;

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
</div>
</div>
);
}