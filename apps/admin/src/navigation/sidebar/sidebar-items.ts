import {
  CalendarDays,
  CalendarRange,
  ChartColumn,
  FileText,
  House,
  Hourglass,
  ImageIcon,
  Inbox,
  LayoutDashboard,
  Settings,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Oversikt",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
      },
      {
        title: "Kalender",
        url: "/kalender",
        icon: CalendarRange,
      },
    ],
  },
  {
    id: 2,
    label: "Drift",
    items: [
      {
        title: "Bookinger",
        url: "/bokningar",
        icon: CalendarDays,
      },
      {
        title: "Gjester",
        url: "/gaster",
        icon: Users,
      },
      {
        title: "Priser",
        url: "/priser",
        icon: Tags,
      },
      {
        title: "Tilgjengelighet",
        url: "/tilgjengelighet",
        icon: CalendarDays,
      },
      {
        title: "Henvendelser",
        url: "/henvendelser",
        icon: Inbox,
      },
    ],
  },
  {
    id: 3,
    label: "Parsellene",
    items: [
      {
        title: "Parseller",
        url: "/parseller",
        icon: House,
      },
      {
        title: "Parsellanter",
        url: "/parsellanter",
        icon: Users,
      },
      {
        title: "Venteliste",
        url: "/venteliste",
        icon: Hourglass,
      },
    ],
  },
  {
    id: 4,
    label: "Innhold",
    items: [
      {
        title: "CMS",
        url: "/cms",
        icon: FileText,
        subItems: [
          { title: "Sider", url: "/cms/sider" },
          { title: "SEO", url: "/cms/seo" },
        ],
      },
      {
        title: "Media",
        url: "/media",
        icon: ImageIcon,
      },
    ],
  },
  {
    id: 5,
    label: "System",
    items: [
      {
        title: "Rapporter",
        url: "/rapporter",
        icon: ChartColumn,
      },
      {
        title: "Innstillinger",
        url: "/installningar",
        icon: Settings,
        subItems: [
          { title: "Generelt", url: "/installningar" },
          { title: "Bedrift", url: "/installningar/foretag" },
          { title: "Booking", url: "/installningar/bokning" },
          { title: "Betaling", url: "/installningar/betalning" },
          { title: "E-post", url: "/installningar/e-post" },
          { title: "Brukere", url: "/installningar/anvandare" },
        ],
      },
    ],
  },
];
