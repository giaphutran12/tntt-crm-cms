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
    "A chapter website and family information hub for announcements, schedules, forms, and faith-formation updates.",
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
      "Recent updates, event reminders, and chapter-wide notices surface here first so families do not have to reconstruct the latest plan from email threads.",
    href: "/announcements",
  },
  {
    title: "Schedule",
    description:
      "Parents can confirm the weekly chapter rhythm and major formation dates without digging through old messages.",
    href: "/schedule",
  },
  {
    title: "Forms & Resources",
    description:
      "Registration packets, retreat checklists, and evergreen chapter resources stay in one predictable place.",
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
    slug: "registration-packet-live",
    audience: "Parents and guardians",
    publishDate: "July 14, 2026",
    status: "Representative demo content",
    title: {
      en: "2026-2027 registration packet is ready",
      vi: "Hồ sơ ghi danh 2026-2027 đã sẵn sàng",
    },
    summary: {
      en: "Families can review the representative packet, see what paperwork is expected, and use the forms page as the canonical download location.",
      vi: "Gia đình có thể xem bộ hồ sơ mẫu, biết rõ giấy tờ cần chuẩn bị và dùng trang biểu mẫu làm nơi tải xuống chính thức.",
    },
  },
  {
    slug: "lenten-retreat-checklist",
    audience: "Registered students and families",
    publishDate: "March 1, 2026",
    status: "Representative demo content",
    title: {
      en: "Lenten retreat checklist and deadline",
      vi: "Danh sách chuẩn bị và hạn nộp cho kỳ tĩnh tâm Mùa Chay",
    },
    summary: {
      en: "The public announcement flow supports a parent-facing post plus one attached checklist so event prep does not stay trapped in chat history.",
      vi: "Luồng thông báo công khai hỗ trợ một bài đăng hướng đến phụ huynh cùng tệp đính kèm để việc chuẩn bị sự kiện không bị thất lạc trong tin nhắn.",
    },
  },
  {
    slug: "opening-sunday-orientation",
    audience: "New families and returning households",
    publishDate: "September 4, 2026",
    status: "Representative demo content",
    title: {
      en: "Opening Sunday family orientation",
      vi: "Định hướng gia đình cho Chúa Nhật khai giảng",
    },
    summary: {
      en: "A shorter reminder sits beside larger notices and still gives parents the exact arrival window, room assignment, and what to bring.",
      vi: "Một thông báo ngắn vẫn có thể đứng cạnh các thông báo lớn hơn và cho phụ huynh biết rõ giờ đến, phòng sinh hoạt và vật dụng cần mang theo.",
    },
  },
];

export const weeklyRhythm: ScheduleItem[] = [
  {
    label: "Sunday check-in and opening assembly",
    dateLabel: "Most Sundays, 8:45 AM",
    note:
      "Families can verify the arrival window, opening prayer rhythm, and where schedule changes will be announced before a full calendar product exists.",
  },
  {
    label: "Division classes and formation blocks",
    dateLabel: "After assembly",
    note:
      "Use the schedule page for the stable weekly structure, then mirror any time-sensitive change in public announcements.",
  },
  {
    label: "Family follow-up and paperwork review",
    dateLabel: "Monday to Wednesday",
    note:
      "This keeps form and registration questions from depending on whichever leader a family happened to message first.",
  },
];

export const upcomingDates: ScheduleItem[] = [
  {
    label: "Registration help desk",
    dateLabel: "August 24 and August 31, 7:00 PM",
    note: "A representative public entry for packet pickup questions, missing signature follow-up, and school-year launch reminders.",
  },
  {
    label: "Lenten retreat paperwork deadline",
    dateLabel: "March 10, 2026",
    note: "This is the kind of date that should appear in both the schedule and a linked announcement with the downloadable checklist.",
  },
  {
    label: "Opening Sunday orientation",
    dateLabel: "September 13, 2026",
    note: "Useful for parent reminders, classroom arrival instructions, and family-facing handbooks without exposing private student data.",
  },
];

export const resourcePreviews: ResourcePreview[] = [
  {
    title: {
      en: "2026-2027 family registration packet",
      vi: "Hồ sơ ghi danh gia đình 2026-2027",
    },
    audience: "Families registering students",
    availability: "Representative demo file available",
    description: {
      en: "A seeded local-development file stands in for the real packet so editors can verify the public download flow before launch.",
      vi: "Một tệp mẫu cho môi trường phát triển được dùng thay cho hồ sơ thật để ban điều hành kiểm tra luồng tải xuống công khai trước khi ra mắt.",
    },
  },
  {
    title: {
      en: "Retreat family checklist",
      vi: "Danh sách chuẩn bị cho gia đình đi tĩnh tâm",
    },
    audience: "Families responding to special events",
    availability: "Representative demo file available",
    description: {
      en: "Seasonal files can appear, expire, and be replaced without changing the page layout or the parent-facing information architecture.",
      vi: "Các tệp theo mùa có thể xuất hiện, hết hạn và được thay thế mà không cần thay đổi bố cục trang hay kiến trúc thông tin dành cho phụ huynh.",
    },
  },
  {
    title: {
      en: "Family handbook summary",
      vi: "Tóm tắt sổ tay gia đình",
    },
    audience: "Parents, students, and staff",
    availability: "Representative external link",
    description: {
      en: "Evergreen guidance can live beside seasonal packets so the public site becomes the obvious place to re-check chapter expectations.",
      vi: "Hướng dẫn dài hạn có thể nằm cạnh các bộ hồ sơ theo mùa để trang công khai trở thành nơi dễ nhớ nhất khi gia đình cần xem lại thông tin.",
    },
  },
];

export const contactCards: ContactCard[] = [
  {
    title: "Chapter context",
    description: `${chapterProfile.shortName} serves the ${chapterProfile.parish} in ${chapterProfile.location}.`,
  },
  {
    title: "Public inbox pattern",
    description:
      "Use one chapter-managed public inbox for schedule, form, and announcement questions instead of publishing private leader addresses.",
  },
  {
    title: "What stays public",
    description:
      "Announcements, schedule clarifications, packet downloads, and general family guidance belong on the public site.",
  },
  {
    title: "What stays private",
    description:
      "Student rosters, guardian phone numbers, health notes, certificate follow-up, and paper-registration artifacts stay behind the staff admin.",
  },
];

export const cmsReadyNotes = [
  "Page sections are driven by typed local content objects that can later be replaced by CMS records.",
  "Representative fallback content keeps the public site reviewable even before a local database is configured.",
  "The public routes intentionally avoid any dependency on student, guardian, or registration tables.",
];
