
const default_thresholds = {
performance: 70,
accessibility: 90,
"best practices" : 85,
seo: 80,
};

export const Lighthouse_pages = [
{
name: "login",
path: "/auth/Login",
authRole: "none",
thresholds: {...default_thresholds} ,
},
{
name: "home",
path: "/auth/HomePage",
authRole: "none",
thresholds: {...default_thresholds} ,
},
{
name: "signup",
path: "/auth/Signup",
authRole: "none",
thresholds: {...default_thresholds} ,
},
{
name: "browse-listings",
path: "/buyer/listings",
authRole: "none", 
thresholds: {...default_thresholds} ,
},
{
name: "admin-dashboard",
path: "/admin/dashboard",
authRole: "admin",
thresholds: {...default_thresholds} ,
},
{
name: "admin-verifications-queue",
path: "/admin/verifications",
authRole: "admin",
thresholds: {...default_thresholds} ,
},

{
name: "admin-listings-queue",
path: "/admin/listings",
authRole: "admin",
thresholds: {...default_thresholds} ,
},
{
name: "admin-disputes",
path: "/admin/disputes",
authRole: "admin",
thresholds: { ...default_thresholds} ,
},

{
name: "admin-users",
path: "/admin/users",
authRole: "admin",
thresholds: { ...default_thresholds} ,
},
];