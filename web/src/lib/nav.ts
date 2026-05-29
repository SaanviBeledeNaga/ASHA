export type NavItem = {
  label: string;
  href: string;
  description?: string;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const navTree: NavSection[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", description: "At-a-glance KPIs and activity" }],
  },
  {
    label: "Care Management",
    items: [
      { label: "Beneficiaries", href: "/dashboard/beneficiaries", description: "Profiles and follow-ups" },
      { label: "High Risk", href: "/dashboard/high-risk", description: "Risk-stratified view" },
      { label: "Alerts", href: "/dashboard/alerts", description: "Escalations and reminders" },
    ],
  },
  {
    label: "Programs",
    items: [{ label: "Schemes", href: "/dashboard/schemes", description: "Eligibility and enrollment" }],
  },
  {
    label: "Operations",
    items: [
      { label: "Sync Health", href: "/dashboard/sync-health", description: "Sync jobs and status" },
      { label: "Documents", href: "/dashboard/documents", description: "Uploads and verification" },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Rules", href: "/dashboard/settings/rules", description: "Automation and triage rules" },
      { label: "Security", href: "/dashboard/settings/security", description: "Access and sessions" },
    ],
  },
];

