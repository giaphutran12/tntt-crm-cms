export type LocalizedText = {
  en: string;
  vi?: string;
};

export type PublicImage = {
  src: string;
  alt: string;
};

export type PublicNavItem = {
  href: string;
  label: string;
};

export type AnnouncementPreview = {
  slug: string;
  audience: string;
  publishDate: string;
  status: string;
  title: LocalizedText;
  summary: LocalizedText;
};

export type ScheduleItem = {
  label: string;
  dateLabel: string;
  note: string;
};

export type ResourcePreview = {
  title: LocalizedText;
  audience: string;
  availability: string;
  description: LocalizedText;
};

export type ContactCard = {
  title: string;
  description: string;
};

export const chapterProfile = {
  name: "Doan Duc Me La Vang",
  shortName: "TNTT Surrey",
  location: "Surrey, British Columbia",
  parish: "Our Lady of La Vang Vietnamese community at St. Matthew's Parish",
  mission:
    "A chapter website and family information hub for prayer, formation, announcements, and chapter updates.",
  bilingualNote:
    "The public shell is English-first today, with content structures prepared for future English and Vietnamese publishing.",
};

export const publicNavItems: PublicNavItem[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/announcements", label: "Announcements" },
  { href: "/schedule", label: "Schedule" },
  { href: "/forms-resources", label: "Forms & Resources" },
  { href: "/contact", label: "Contact" },
];

export const publicImages = {
  homeHero: {
    src: "/images/public-site/hero-community.jpg",
    alt: "A TNTT chapter gathering during a liturgical program.",
  },
  aboutLead: {
    src: "/images/public-site/about-sanctuary.jpg",
    alt: "Sacred architecture used as supporting imagery for the chapter About page.",
  },
  announcementsLead: {
    src: "/images/public-site/announcements-arch.jpg",
    alt: "Catholic architecture used to support chapter announcements.",
  },
  scheduleLead: {
    src: "/images/public-site/schedule-basilica.jpg",
    alt: "Basilica interior used as supporting imagery for the schedule page.",
  },
  resourcesLead: {
    src: "/images/public-site/resources-hall.jpg",
    alt: "Church hall interior used as supporting imagery for forms and resources.",
  },
  contactLead: {
    src: "/images/public-site/contact-chapel.jpg",
    alt: "Chapel architecture used as supporting imagery for the contact page.",
  },
} satisfies Record<string, PublicImage>;

export const primaryActions = [
  {
    href: "/announcements",
    label: "See latest announcements",
  },
  {
    href: "/schedule",
    label: "Check upcoming dates",
  },
  {
    href: "/forms-resources",
    label: "Open forms and resources",
  },
];

export const familyNeeds = [
  {
    title: "Announcements",
    description:
      "Recent updates, event reminders, and chapter-wide notices will surface here first once CMS publishing is online.",
    href: "/announcements",
  },
  {
    title: "Schedule",
    description:
      "Parents will be able to confirm the weekly chapter rhythm and special dates without digging through old email threads.",
    href: "/schedule",
  },
  {
    title: "Forms & Resources",
    description:
      "Registration packets, retreat documents, and evergreen chapter resources are scaffolded for future uploads.",
    href: "/forms-resources",
  },
];

export const aboutHighlights = [
  {
    title: "Faith-centered youth formation",
    description:
      "The chapter exists to support prayer, formation, community life, and service in a parish-based TNTT setting.",
  },
  {
    title: "Parents need one reliable source",
    description:
      "The site is designed around family questions: what is happening, when it happens, and what paperwork is needed.",
  },
  {
    title: "Public and private data stay separate",
    description:
      "The public site does not expose student rosters, family records, or private registration details.",
  },
];

export const divisionOverview = [
  {
    name: "Au Nhi",
    description:
      "Early elementary division content can eventually explain age-appropriate formation and classroom expectations.",
  },
  {
    name: "Thieu Nhi",
    description:
      "Middle elementary and junior formation details can later be maintained by chapter editors in the CMS.",
  },
  {
    name: "Nghia Si",
    description:
      "Older youth content is kept ready for bilingual chapter messaging without hardwiring a separate locale system.",
  },
  {
    name: "Hiep Si",
    description:
      "Senior youth and leadership-track information can expand here once the chapter wants richer public storytelling.",
  },
];

export const announcementPreviews: AnnouncementPreview[] = [
  {
    slug: "season-opening-update",
    audience: "Parents and families",
    publishDate: "Content scaffold",
    status: "Awaiting chapter copy",
    title: {
      en: "Season opening update",
      vi: "Thông báo khai mạc năm sinh hoạt",
    },
    summary: {
      en: "Featured homepage announcement slot reserved for the first real chapter-wide notice, with space for an attachment later.",
      vi: "Vị trí thông báo nổi bật được giữ sẵn cho thông báo đầu mùa và tệp đính kèm sau này.",
    },
  },
  {
    slug: "retreat-registration-window",
    audience: "Families preparing paperwork",
    publishDate: "Content scaffold",
    status: "Awaiting event details",
    title: {
      en: "Retreat registration window",
      vi: "Thời gian ghi danh tĩnh tâm",
    },
    summary: {
      en: "Announcement cards are structured for title, audience, publish date, summary, and future file attachments.",
      vi: "Thẻ thông báo đã sẵn sàng cho tiêu đề, đối tượng, ngày đăng, tóm tắt và tệp đính kèm.",
    },
  },
  {
    slug: "uniform-reminder",
    audience: "Students and guardians",
    publishDate: "Content scaffold",
    status: "Awaiting chapter policy",
    title: {
      en: "Uniform and preparation reminder",
      vi: "Nhắc nhở đồng phục và chuẩn bị",
    },
    summary: {
      en: "This slot demonstrates how shorter reminders can still live beside larger event announcements in the same collection.",
      vi: "Mục này minh hoạ cách các nhắc nhở ngắn có thể xuất hiện cùng các thông báo sự kiện lớn hơn.",
    },
  },
];

export const weeklyRhythm: ScheduleItem[] = [
  {
    label: "Weekly chapter gathering",
    dateLabel: "Sunday rhythm",
    note:
      "The page is structured for a simple parent-friendly list first, with room to add richer calendar behavior later if the chapter needs it.",
  },
  {
    label: "Announcements and key reminders",
    dateLabel: "Published as needed",
    note:
      "Important schedule changes should surface both here and on the announcements page so families do not miss time-sensitive updates.",
  },
  {
    label: "Major seasonal dates",
    dateLabel: "Liturgical year milestones",
    note:
      "Retreats, registration windows, and special events can be layered in without changing the overall public IA.",
  },
];

export const upcomingDates: ScheduleItem[] = [
  {
    label: "Registration period",
    dateLabel: "Placeholder for chapter-confirmed window",
    note: "Reserved for the future registration cycle announcement and linked form packet.",
  },
  {
    label: "Retreat / formation event",
    dateLabel: "Placeholder for chapter-confirmed date",
    note: "Structured to call out deadlines, audiences, and linked downloads when live details are available.",
  },
  {
    label: "Family information reminder",
    dateLabel: "Placeholder for chapter-confirmed date",
    note: "Useful for uniform notices, parent reminders, or handbook updates without exposing private student data.",
  },
];

export const resourcePreviews: ResourcePreview[] = [
  {
    title: {
      en: "Registration packet",
      vi: "Hồ sơ ghi danh",
    },
    audience: "Families registering students",
    availability: "Upload pending",
    description: {
      en: "Ready for a future PDF upload, summary text, and publish window once chapter editors finalize the yearly form set.",
      vi: "Sẵn sàng cho tệp PDF, mô tả ngắn và thời gian công bố khi bộ hồ sơ được chốt.",
    },
  },
  {
    title: {
      en: "Retreat and event forms",
      vi: "Biểu mẫu tĩnh tâm và sự kiện",
    },
    audience: "Families responding to special events",
    availability: "Upload pending",
    description: {
      en: "The list supports seasonal files that appear and expire without changing the page design.",
      vi: "Danh sách hỗ trợ các tệp theo mùa có thể xuất hiện rồi hết hạn mà không cần đổi giao diện.",
    },
  },
  {
    title: {
      en: "Evergreen chapter resources",
      vi: "Tài liệu chương đoàn",
    },
    audience: "Parents, students, and staff",
    availability: "Structure ready",
    description: {
      en: "Space for handbooks, ministry guides, or orientation material after the chapter decides what should stay public year-round.",
      vi: "Không gian cho sổ tay, hướng dẫn và tài liệu định hướng khi chương đoàn xác định nội dung công khai lâu dài.",
    },
  },
];

export const contactCards: ContactCard[] = [
  {
    title: "Chapter context",
    description: `${chapterProfile.shortName} serves the ${chapterProfile.parish} in ${chapterProfile.location}.`,
  },
  {
    title: "Public contact details",
    description:
      "A canonical public email inbox and contact form still need chapter confirmation before they should be published here.",
  },
  {
    title: "Current family path",
    description:
      "Until the public inbox is finalized, families should continue using the chapter communication channels already shared in announcements and email threads.",
  },
  {
    title: "Staff access",
    description:
      "Internal sign-in remains separate from the public site so chapter CRM and CMS data stay private.",
  },
];

export const cmsReadyNotes = [
  "Page sections are driven by typed local content objects that can later be replaced by CMS records.",
  "Announcement, schedule, and resource scaffolds already model future publishable fields instead of one-off prose blocks.",
  "The public routes intentionally avoid any dependency on student, guardian, or registration tables.",
];
