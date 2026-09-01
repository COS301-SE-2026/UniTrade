export interface LighthouseThresholds{
performance: number;
accessibility: number;
"best practices" : number;
seo: number;
}

export interface LighthousePageConfig{
name: string;
path: string;
admin?: boolean;
thresholds: LighthouseThresholds;
}

const default_thresholds: LighthouseThresholds = {
performance: 70,
accessibility: 90,
"best practices" : 85,
seo: 80,
};

export const Lighthouse_pages: LighthousePageConfig[] = [
{
name: "login",
path: "/auth/Login",
thresholds: {...default_thresholds} ,
},
{
name: "signup",
path: "/auth/Signup",
thresholds: {...default_thresholds} ,
},
{
name: "browse-listings",
path: "/buyer/listings",
thresholds: {...default_thresholds} ,
},
{
name: "admin-dashboard",
path: "/admin/dashboard",
admin: true,
thresholds: {...default_thresholds} ,
},
{
name: "admin-verifications-queue",
path: "/admin/verifications",
admin: true,
thresholds: {...default_thresholds} ,
},

{
name: "admin-listings-queue",
path: "/admin/listings",
admin: true,
thresholds: {...default_thresholds} ,
},
{
name: "admin-disputes",
path: "/admin/disputes",
admin: true,
thresholds: { ...default_thresholds} ,
},
];