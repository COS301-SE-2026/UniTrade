import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import {
  IconSettings, IconHistory, IconChevronRight, IconShieldLock, IconTrash,
  IconLogout, IconAlertTriangle, IconX, IconSchool, IconArrowLeft, IconMail, IconBook2,
  IconCalendarStats, IconCircleCheck, IconClock,
} from "@tabler/icons-react";
import { useAuthStore } from "../../store/useAuthStore";
import { authService } from "../../services/authService";

interface ProfileDetails{
  email: string;
  university?: string;
  degreeProgram? :string;
  yearOfStudy?: number;
  verificationStatus?: string;
}

interface ProfileRowProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

function ProfileRow({ icon, label, onClick, danger }: ProfileRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3.5 bg-white hover:bg-gray-50 transition-colors text-left">

      <span className={`flex items-center gap-3 text-sm font-medium ${danger ? "text-red-500" : "text-navy-700"}`}>
        <span className={danger ? "text-red-400" : "text-gray-400"}>
          {icon}
        </span>
        {label}
      </span>
      <IconChevronRight size={16} className="text-gray-300" />
    </button>
  );
}

function InfoRow({
  icon,
  label,
  value,
}:{
  icon: React.ReactNode;
  label: string;
  value: string;

})

{
  return(
    <div className="flex items-center gap-3 px-4 py-3.5">
    <span className = "w-9 h-9 rounded-full bg-gray-50 text-navy-700 flex items-center justify-center flex-shrink-0">
      {icon}
      </span>
      <div className="min-w-0">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      
      <p className="text-sm font-semibold text-navy-900 truncate"> {value}</p>
      </div>
      </div>
  );}

  function VerificationBadge({ status }: { status: string }){
    const isVerified = status.toLowerCase() === "verified";
    return(
      <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-semibold ${ isVerified ? "bg-emerald-500/80 text-emerald-50" : 
        "bg-amber-500/80 text-amber-50"
      }`
    
      } >
        {isVerified ? <IconCircleCheck size={12} /> : <IconClock size={12} />}    
        {isVerified ? "Verified" : "Pending Verification"}
        </span> 
    );
  }


export default function Profile() {
  const { user, clearUser } = useAuthStore();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [profile,setProfile] = useState <ProfileDetails | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const[profileError, setProfileError] =useState<string | null>(null);

useEffect(() => {
  authService.getMe()
  .then((data) => {
    if (data.std) {
      setProfile( {
        email: data.user.email,
        university: data.std.university,
        degreeProgram: data.std.degreeProgram,
        yearOfStudy:data.std.yearOfStudy,
        verificationStatus: data.std.verificationStatus
      });
    }else {
      setProfile({email:data.user.email });
    }
  }).catch(() => setProfileError("Could not load profile details.")).finally(() => setLoadingProfile(false));
}, []);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      
    } finally {
      clearUser();
      navigate("/auth/login");
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await authService.deleteAccount();
      clearUser();
      navigate("/auth/login");
    } catch {
      setDeleteError("Failed to delete account. Please try again.");
      setDeleting(false);
    }
  };


  return (
    <div className="flex flex-col gap-6">
   
      <div className="bg-navy-700 rounded-xl px-8 py-7 shadow-sm flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-start mb-4">
            <button
              onClick={() => navigate(-1)}
              className="text-white/70 hover:text-white transition-colors mb-2"
              aria-label="Back">
              <IconArrowLeft size={22} />
            </button>
            <h1 className="text-2xl font-bold text-white">Profile</h1>
          </div>

          <button
            onClick={() => navigate("/profile/settings")}
            className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all mt-4"
            aria-label="Settings">
            <IconSettings size={20} />
          </button>
        </div>

        <div className="flex items-center gap-5">
            <div className="w-40 h-40 rounded-full bg-white text-navy-700 flex items-center justify-center text-5xl font-bold shadow-lg">
              {user.initials}
            </div>


          <div>
            <p className="text-base font-bold text-white text-xl">
              {user.name}
            </p>
            <div className ="flex items-center gap-2 mt-5 flex-wrap">

         <span className="inline-block bg-blue-600/80 text-[11px] px-2 py-0.5 rounded text-blue-100 font-semibold ">
            Student
            </span>
      {profile?.verificationStatus && ( <VerificationBadge status = {profile.verificationStatus} />
      )}

          </div>
        </div>
        </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50 h-fit">


        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">Account Details</h2>

         </div>   
{loadingProfile &&(
  <div className="p-4 flex flex-col gap-3">
    <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
     <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
      <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
      </div>
)}

 {!loadingProfile && profileError && (
  <div className="p-5 text-center">
    <p className="text-sm text-red-500"> {profileError}</p>
    </div>
 )}

 {!loadingProfile && !profileError && profile && (
  <div className="grid grid-cols-2 divide-gray-50">
    <div className="border-r border-gray-50">
  
   <InfoRow icon={<IconMail size={17} /> } label="Email" value={profile.email} />
   {profile.degreeProgram && (
    <InfoRow icon={<IconBook2 size={17} />} label="Course" value={profile.degreeProgram} />
    
    )}
    </div>
    <div>
    {profile.yearOfStudy !== undefined && (
      <InfoRow 
      icon = {<IconCalendarStats size={17} />}
      label="Year of Study" 
      value={`Year ${profile.yearOfStudy}`}
      />
   )}
   {profile.university && (
    <InfoRow icon={<IconSchool size={17} />} label="University" value={profile.university} />
   )}
   </div></div>
 )}</div>
 </div>



      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50 h-fit">
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
                data-testid="confirm-delete-button"

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