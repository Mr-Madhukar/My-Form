import { type FieldType } from "@repo/forms";

export interface TemplateField {
  id: string;
  order: number;
  type: FieldType;
  label: string;
  required: boolean;
  config: Record<string, any>;
}

export interface FormTemplate {
  slug: string;
  title: string;
  description: string;
  category: "Entertainment" | "Gaming" | "Product" | "Social" | "Hiring" | "Education";
  stat: string;
  badgeColor: string;
  fields: TemplateField[];
  theme: {
    preset: "sunset" | "ocean" | "forest" | "midnight" | "rose" | "custom";
    accentColor: string;
  };
}

export const STATIC_TEMPLATES: FormTemplate[] = [
  {
    slug: "anime-fan-survey",
    title: "Anime Fan Survey",
    description: "Collect fan opinions about current anime series, genres, and character tropes.",
    category: "Entertainment",
    stat: "5 fields",
    badgeColor: "bg-pink-500/10 text-pink-400 border border-pink-500/20",
    theme: {
      preset: "rose",
      accentColor: "#EC4899",
    },
    fields: [
      {
        id: "anime-q1",
        order: 0,
        type: "short_text",
        label: "What is your favorite anime series of all time?",
        required: true,
        config: { placeholder: "e.g., Fullmetal Alchemist, Attack on Titan..." },
      },
      {
        id: "anime-q2",
        order: 1,
        type: "single_choice",
        label: "Which anime genre do you watch the most?",
        required: true,
        config: {
          options: [
            { id: "opt1", label: "Shonen" },
            { id: "opt2", label: "Seinen" },
            { id: "opt3", label: "Slice of Life" },
            { id: "opt4", label: "Fantasy / Isekai" },
            { id: "opt5", label: "Romance" },
          ],
        },
      },
      {
        id: "anime-q3",
        order: 2,
        type: "number",
        label: "Roughly how many hours of anime do you watch per week?",
        required: false,
        config: { placeholder: "e.g., 5" },
      },
      {
        id: "anime-q4",
        order: 3,
        type: "multiple_choice",
        label: "Which streaming platforms do you use for watching anime?",
        required: false,
        config: {
          options: [
            { id: "p1", label: "Crunchyroll" },
            { id: "p2", label: "Netflix" },
            { id: "p3", label: "Prime Video" },
            { id: "p4", label: "Hulu" },
            { id: "p5", label: "Other" },
          ],
        },
      },
      {
        id: "anime-q5",
        order: 4,
        type: "rating",
        label: "How would you rate this season's anime releases overall?",
        required: true,
        config: { scale: 5, style: "star" },
      },
    ],
  },
  {
    slug: "gaming-community-signup",
    title: "Gaming Community Signup",
    description: "Onboard members into your Discord server, gaming guild, or upcoming tournament.",
    category: "Gaming",
    stat: "5 fields",
    badgeColor: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
    theme: {
      preset: "midnight",
      accentColor: "#8B5CF6",
    },
    fields: [
      {
        id: "game-q1",
        order: 0,
        type: "short_text",
        label: "What is your Discord username?",
        required: true,
        config: { placeholder: "e.g., gamer_tag#0000" },
      },
      {
        id: "game-q2",
        order: 1,
        type: "multiple_choice",
        label: "Which gaming platforms do you actively play on?",
        required: true,
        config: {
          options: [
            { id: "g1", label: "PC" },
            { id: "g2", label: "PlayStation" },
            { id: "g3", label: "Xbox" },
            { id: "g4", label: "Nintendo Switch" },
            { id: "g5", label: "Mobile" },
          ],
        },
      },
      {
        id: "game-q3",
        order: 2,
        type: "single_choice",
        label: "What is your main game genre?",
        required: true,
        config: {
          options: [
            { id: "genre1", label: "FPS / Tactical Shooters" },
            { id: "genre2", label: "RPG / MMORPG" },
            { id: "genre3", label: "MOBA" },
            { id: "genre4", label: "Sports / Racing" },
            { id: "genre5", label: "Strategy / RTS" },
          ],
        },
      },
      {
        id: "game-q4",
        order: 3,
        type: "number",
        label: "How many hours a week do you spend gaming?",
        required: false,
        config: { placeholder: "e.g., 10" },
      },
      {
        id: "game-q5",
        order: 4,
        type: "date",
        label: "When did you first start playing video games?",
        required: false,
        config: {},
      },
    ],
  },
  {
    slug: "product-feedback-sprint",
    title: "Product Feedback Sprint",
    description: "Gather client or beta tester opinions right after a new version launch.",
    category: "Product",
    stat: "5 fields",
    badgeColor: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    theme: {
      preset: "ocean",
      accentColor: "#3B82F6",
    },
    fields: [
      {
        id: "prod-q1",
        order: 0,
        type: "email",
        label: "Your professional email address",
        required: true,
        config: { placeholder: "name@company.com" },
      },
      {
        id: "prod-q2",
        order: 1,
        type: "single_choice",
        label: "How often do you use our platform?",
        required: true,
        config: {
          options: [
            { id: "u1", label: "Multiple times a day" },
            { id: "u2", label: "Daily" },
            { id: "u3", label: "Weekly" },
            { id: "u4", label: "Rarely" },
          ],
        },
      },
      {
        id: "prod-q3",
        order: 2,
        type: "multiple_choice",
        label: "Which features do you find most valuable?",
        required: false,
        config: {
          options: [
            { id: "f1", label: "Analytics Dashboard" },
            { id: "f2", label: "Visual Form Builder" },
            { id: "f3", label: "CSV / Data Export" },
            { id: "f4", label: "AI Survey Assistant" },
          ],
        },
      },
      {
        id: "prod-q4",
        order: 3,
        type: "long_text",
        label: "What is the single biggest pain point in your current workflow?",
        required: false,
        config: { placeholder: "Tell us about what we can improve..." },
      },
      {
        id: "prod-q5",
        order: 4,
        type: "rating",
        label: "How likely are you to recommend our product to a friend or colleague?",
        required: true,
        config: { scale: 10, style: "number" },
      },
    ],
  },
  {
    slug: "movie-night-rsvp",
    title: "Movie Night RSVP",
    description: "Coordinate guest attendance, snack preferences, and cinematic tastes for your social gather.",
    category: "Social",
    stat: "5 fields",
    badgeColor: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
    theme: {
      preset: "sunset",
      accentColor: "#E8854A",
    },
    fields: [
      {
        id: "rsvp-q1",
        order: 0,
        type: "short_text",
        label: "What is your name?",
        required: true,
        config: { placeholder: "Your name..." },
      },
      {
        id: "rsvp-q2",
        order: 1,
        type: "single_choice",
        label: "Will you be attending this week's screening?",
        required: true,
        config: {
          options: [
            { id: "rsvp_y", label: "Yes, count me in!" },
            { id: "rsvp_n", label: "No, sorry, can't make it" },
            { id: "rsvp_m", label: "Maybe, keep me posted" },
          ],
        },
      },
      {
        id: "rsvp-q3",
        order: 2,
        type: "single_choice",
        label: "Which genre do you prefer for tonight's feature?",
        required: true,
        config: {
          options: [
            { id: "g_scifi", label: "Sci-Fi / Adventure" },
            { id: "g_horror", label: "Horror / Thriller" },
            { id: "g_comedy", label: "Comedy" },
            { id: "g_documentary", label: "Documentary" },
            { id: "g_classic", label: "Drama / Classic" },
          ],
        },
      },
      {
        id: "rsvp-q4",
        order: 3,
        type: "long_text",
        label: "Any dietary restrictions, snack requests, or comments?",
        required: false,
        config: { placeholder: "Snack ideas or dietary needs..." },
      },
      {
        id: "rsvp-q5",
        order: 4,
        type: "number",
        label: "How many guests (excluding yourself) are you bringing?",
        required: false,
        config: { placeholder: "0 if coming alone" },
      },
    ],
  },
  {
    slug: "developer-hiring-form",
    title: "Developer Hiring Form",
    description: "Filter developer applicants, collect github portfolios, and understand technology experience.",
    category: "Hiring",
    stat: "5 fields",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    theme: {
      preset: "forest",
      accentColor: "#10B981",
    },
    fields: [
      {
        id: "hire-q1",
        order: 0,
        type: "short_text",
        label: "Full Name",
        required: true,
        config: { placeholder: "First name and last name" },
      },
      {
        id: "hire-q2",
        order: 1,
        type: "email",
        label: "Contact Email",
        required: true,
        config: { placeholder: "you@example.com" },
      },
      {
        id: "hire-q3",
        order: 2,
        type: "multiple_choice",
        label: "Which technologies do you have professional experience with?",
        required: true,
        config: {
          options: [
            { id: "t_react", label: "React / Next.js" },
            { id: "t_node", label: "Node.js / Express" },
            { id: "t_python", label: "Python / FastAPI" },
            { id: "t_rust", label: "Rust / Go" },
            { id: "t_db", label: "Postgres / SQL" },
            { id: "t_devops", label: "Docker / AWS" },
          ],
        },
      },
      {
        id: "hire-q4",
        order: 3,
        type: "number",
        label: "How many years of professional software development experience do you have?",
        required: true,
        config: { placeholder: "e.g., 3" },
      },
      {
        id: "hire-q5",
        order: 4,
        type: "long_text",
        label: "Tell us about a challenging technical project you worked on recently.",
        required: true,
        config: { placeholder: "What did you build and how did you solve difficulties?" },
      },
    ],
  },
  {
    slug: "course-evaluation-survey",
    title: "Course Evaluation Survey",
    description: "Obtain feedback from students about curriculum design, instructor engagement, and materials.",
    category: "Education",
    stat: "5 fields",
    badgeColor: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    theme: {
      preset: "rose",
      accentColor: "#EC4899",
    },
    fields: [
      {
        id: "edu-q1",
        order: 0,
        type: "short_text",
        label: "Student ID or Name (Optional)",
        required: false,
        config: { placeholder: "Leave blank to submit anonymously" },
      },
      {
        id: "edu-q2",
        order: 1,
        type: "single_choice",
        label: "Which course are you evaluating?",
        required: true,
        config: {
          options: [
            { id: "c_cs101", label: "CS101: Intro to Programming" },
            { id: "c_cs201", label: "CS201: Data Structures" },
            { id: "c_math301", label: "MATH301: Linear Algebra" },
            { id: "c_phys101", label: "PHYS101: Classical Mechanics" },
          ],
        },
      },
      {
        id: "edu-q3",
        order: 2,
        type: "rating",
        label: "The course materials and lectures were easy to follow.",
        required: true,
        config: { scale: 5, style: "number" },
      },
      {
        id: "edu-q4",
        order: 3,
        type: "long_text",
        label: "What did you like most about this course, or what can be improved?",
        required: false,
        config: { placeholder: "Your honest feedback..." },
      },
      {
        id: "edu-q5",
        order: 4,
        type: "date",
        label: "Date of evaluation submission",
        required: true,
        config: {},
      },
    ],
  },
  {
    slug: "saas-waitlist-signup",
    title: "SaaS Beta Waitlist",
    description: "Gather waitlist signups, check product interest level, and understand user job roles.",
    category: "Product",
    stat: "5 fields",
    badgeColor: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
    theme: {
      preset: "ocean",
      accentColor: "#0284C7",
    },
    fields: [
      {
        id: "saas-q1",
        order: 0,
        type: "short_text",
        label: "What is your name?",
        required: true,
        config: { placeholder: "Your name..." },
      },
      {
        id: "saas-q2",
        order: 1,
        type: "email",
        label: "What is your primary email address?",
        required: true,
        config: { placeholder: "you@example.com" },
      },
      {
        id: "saas-q3",
        order: 2,
        type: "single_choice",
        label: "What is your primary job role?",
        required: true,
        config: {
          options: [
            { id: "role_dev", label: "Developer / Engineer" },
            { id: "role_des", label: "Designer / UX" },
            { id: "role_pm", label: "Product Manager" },
            { id: "role_fnd", label: "Founder / Executive" },
            { id: "role_oth", label: "Other" },
          ],
        },
      },
      {
        id: "saas-q4",
        order: 3,
        type: "multiple_choice",
        label: "How did you hear about this product?",
        required: false,
        config: {
          options: [
            { id: "ref_tw", label: "Twitter / X" },
            { id: "ref_ph", label: "Product Hunt" },
            { id: "ref_li", label: "LinkedIn" },
            { id: "ref_fr", label: "Friend / Colleague" },
            { id: "ref_se", label: "Search Engine" },
          ],
        },
      },
      {
        id: "saas-q5",
        order: 4,
        type: "long_text",
        label: "What is your biggest expectation or use-case for this beta?",
        required: false,
        config: { placeholder: "Tell us what you hope to achieve..." },
      },
    ],
  },
  {
    slug: "influencer-niche-survey",
    title: "Influencer Outreach Survey",
    description: "Connect with content creators, understand their niche, audience reach, and collaboration types.",
    category: "Social",
    stat: "5 fields",
    badgeColor: "bg-pink-500/10 text-pink-400 border border-pink-500/20",
    theme: {
      preset: "rose",
      accentColor: "#F43F5E",
    },
    fields: [
      {
        id: "inf-q1",
        order: 0,
        type: "short_text",
        label: "Social Media Handle or Channel Name",
        required: true,
        config: { placeholder: "e.g., @creatorspark" },
      },
      {
        id: "inf-q2",
        order: 1,
        type: "single_choice",
        label: "What is your primary platform?",
        required: true,
        config: {
          options: [
            { id: "plat_yt", label: "YouTube" },
            { id: "plat_tk", label: "TikTok" },
            { id: "plat_ig", label: "Instagram" },
            { id: "plat_tw", label: "Twitter / X" },
            { id: "plat_tch", label: "Twitch" },
            { id: "plat_bl", label: "Personal Blog / Website" },
          ],
        },
      },
      {
        id: "inf-q3",
        order: 2,
        type: "single_choice",
        label: "What is your main channel's audience size?",
        required: true,
        config: {
          options: [
            { id: "aud_sm", label: "Under 10,000 followers" },
            { id: "aud_md", label: "10,000 - 50,000 followers" },
            { id: "aud_lg", label: "50,000 - 200,000 followers" },
            { id: "aud_xl", label: "200,000+ followers" },
          ],
        },
      },
      {
        id: "inf-q4",
        order: 3,
        type: "multiple_choice",
        label: "What niches do you cover? (Select all that apply)",
        required: true,
        config: {
          options: [
            { id: "n_tech", label: "Technology / Coding" },
            { id: "n_life", label: "Lifestyle / Vlogging" },
            { id: "n_game", label: "Gaming" },
            { id: "n_fin", label: "Finance / Business" },
            { id: "n_fit", label: "Fitness / Health" },
            { id: "n_fsh", label: "Fashion / Beauty" },
            { id: "n_trv", label: "Travel" },
          ],
        },
      },
      {
        id: "inf-q5",
        order: 4,
        type: "short_text",
        label: "Link to Media Kit or Portfolio (Optional)",
        required: false,
        config: { placeholder: "https://drive.google.com/... or website link" },
      },
    ],
  },
  {
    slug: "support-ticket-intake",
    title: "Support Ticket Intake",
    description: "Clean layout for users to submit bug reports, feature requests, or billing queries.",
    category: "Product",
    stat: "5 fields",
    badgeColor: "bg-teal-500/10 text-teal-400 border border-teal-500/20",
    theme: {
      preset: "forest",
      accentColor: "#0D9488",
    },
    fields: [
      {
        id: "supp-q1",
        order: 0,
        type: "short_text",
        label: "Ticket Summary / Title",
        required: true,
        config: { placeholder: "e.g., Cannot load dashboard chart" },
      },
      {
        id: "supp-q2",
        order: 1,
        type: "email",
        label: "Contact Email Address",
        required: true,
        config: { placeholder: "yourname@domain.com" },
      },
      {
        id: "supp-q3",
        order: 2,
        type: "single_choice",
        label: "Issue Type",
        required: true,
        config: {
          options: [
            { id: "type_bug", label: "Technical Bug / Defect" },
            { id: "type_feat", label: "Feature Request" },
            { id: "type_bill", label: "Billing & Subscriptions" },
            { id: "type_acc", label: "Account Access / Password Reset" },
            { id: "type_oth", label: "Other General Query" },
          ],
        },
      },
      {
        id: "supp-q4",
        order: 3,
        type: "single_choice",
        label: "Priority Tier",
        required: true,
        config: {
          options: [
            { id: "prio_low", label: "Low (General feedback)" },
            { id: "prio_med", label: "Medium (Workflow interrupted)" },
            { id: "prio_high", label: "High (Critical failure)" },
            { id: "prio_urg", label: "Urgent (System blocker)" },
          ],
        },
      },
      {
        id: "supp-q5",
        order: 4,
        type: "long_text",
        label: "Provide details of your request or steps to reproduce the issue",
        required: true,
        config: { placeholder: "Please specify browser details, error codes, or user settings..." },
      },
    ],
  },
  {
    slug: "trivia-quiz-challenge",
    title: "General Knowledge Trivia",
    description: "Host a mini trivia quiz to engage your audience with simple score tracking.",
    category: "Entertainment",
    stat: "5 fields",
    badgeColor: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    theme: {
      preset: "sunset",
      accentColor: "#D97706",
    },
    fields: [
      {
        id: "triv-q1",
        order: 0,
        type: "short_text",
        label: "What is your participant name?",
        required: true,
        config: { placeholder: "e.g., QuizMaster1" },
      },
      {
        id: "triv-q2",
        order: 1,
        type: "single_choice",
        label: "Which planet is closest to the Sun?",
        required: true,
        config: {
          options: [
            { id: "ans_venus", label: "Venus" },
            { id: "ans_mars", label: "Mars" },
            { id: "ans_merc", label: "Mercury" },
            { id: "ans_earth", label: "Earth" },
          ],
        },
      },
      {
        id: "triv-q3",
        order: 2,
        type: "single_choice",
        label: "What is the largest ocean on Earth?",
        required: true,
        config: {
          options: [
            { id: "ans_atl", label: "Atlantic Ocean" },
            { id: "ans_ind", label: "Indian Ocean" },
            { id: "ans_arc", label: "Arctic Ocean" },
            { id: "ans_pac", label: "Pacific Ocean" },
          ],
        },
      },
      {
        id: "triv-q4",
        order: 3,
        type: "number",
        label: "How many continents are there on Earth?",
        required: true,
        config: { placeholder: "e.g., 7" },
      },
      {
        id: "triv-q5",
        order: 4,
        type: "multiple_choice",
        label: "Select all primary colors:",
        required: true,
        config: {
          options: [
            { id: "c_red", label: "Red" },
            { id: "c_grn", label: "Green" },
            { id: "c_blu", label: "Blue" },
            { id: "c_ylw", label: "Yellow" },
            { id: "c_org", label: "Orange" },
          ],
        },
      },
    ],
  },
];
