import type { HiringPost } from "@/lib/domain/types";
import { BOARD_NOW } from "@/lib/domain/time";

function posted(hoursAgo: number): string {
  return new Date(BOARD_NOW - hoursAgo * 3_600_000).toISOString();
}

export const hiringPosts: HiringPost[] = [
  {
    id: "hp-northline-dup",
    source: "HIRING_POST",
    author_name: "Priya Shah",
    author_title: "Chief of staff",
    company: "Northline Advisory",
    post_text:
      "We're looking for someone to join my team as a strategy & operations associate at Northline Advisory in New York. Hybrid, full-time. Same opening as our posted role. Mention the northline planning forum if you write in.",
    posted_at: posted(4),
    location: "New York, NY",
    inferred_role: "Strategy & Operations Associate",
    original_url: "https://posts.example/p/northline-strategy-ops",
    application_instructions:
      "Reply on the original post. This is the same opening as the formal listing.",
  },
  {
    id: "hp-kepler-founder",
    source: "HIRING_POST",
    author_name: "Elena Voss",
    author_title: "Founder",
    company: "Kepler Labs",
    post_text:
      "I'm hiring for the founder's office. You would run the operating cadence, draft board materials, and keep executive priorities in one place. The seat is remote within the United States and full-time.",
    posted_at: posted(10),
    location: "Remote - US",
    inferred_role: "Founder's Associate",
    original_url: "https://posts.example/p/kepler-founders-office",
    application_instructions:
      "Email elena@kepler.example with a short note on a planning rhythm you have run.",
  },
  {
    id: "hp-fieldnote-portfolio",
    source: "HIRING_POST",
    author_name: "Jonah Park",
    author_title: "Operating partner",
    company: "Fieldnote Partners",
    post_text:
      "We're looking for someone to join my team for portfolio operations across two companies. The work is operating cadence, a forecast, and decision support for the partners. Remote - US, full-time.",
    posted_at: posted(50),
    location: "Remote - US",
    inferred_role: "Portfolio Operations Associate",
    original_url: "https://posts.example/p/fieldnote-portfolio-ops",
    application_instructions: "Email jonah@fieldnote.example with a one-page brief.",
  },
  {
    id: "hp-signal-ml",
    source: "HIRING_POST",
    author_name: "Chris Adeyemi",
    author_title: "ML manager",
    company: "Glassline",
    post_text:
      "I'm hiring a machine learning engineer in the San Francisco Bay Area. PyTorch, model training, offline evaluation, and a feature pipeline. Hybrid, full-time. You should have shipped a ranking model.",
    posted_at: posted(9),
    location: "San Francisco Bay Area",
    inferred_role: "Machine Learning Engineer",
    original_url: "https://posts.example/p/signal-north-ml",
    application_instructions: "Reply on the original post with a model you are proud of.",
  },
  {
    id: "hp-field-backend",
    source: "HIRING_POST",
    author_name: "Mina Cho",
    author_title: "Engineering manager",
    company: "Field Current",
    post_text:
      "We're looking for a backend engineer. Go services, Postgres, and API latency work on a dispatch path. Remote - US, full-time. Not a management role.",
    posted_at: posted(120),
    location: "Remote - US",
    inferred_role: "Backend Engineer",
    original_url: "https://posts.example/p/field-current-backend",
    application_instructions: "Link a service you operated.",
  },
  {
    id: "hp-hearth-auditor",
    source: "HIRING_POST",
    author_name: "Luis Ortega",
    author_title: "Front office manager",
    company: "Hearth Hotel",
    post_text:
      "I'm hiring a night auditor for the front desk. The warehouse-adjacent shift is overnight in Chicago. On-site, full-time.",
    posted_at: posted(15),
    location: "Chicago, IL",
    inferred_role: "Night Auditor",
    original_url: "https://posts.example/p/hearth-night-auditor",
    application_instructions: "Send two shifts you have closed.",
  },
  {
    id: "hp-quota-sales",
    source: "HIRING_POST",
    author_name: "Blake Iverson",
    author_title: "Sales lead",
    company: "Quota Lane",
    post_text:
      "I'm hiring someone to make cold calls and carry a sales quota in New York. Full-time, on-site. Outbound calls are the whole job.",
    posted_at: posted(20),
    location: "New York, NY",
    inferred_role: "Account Executive",
    original_url: "https://posts.example/p/quota-lane-ae",
  },
  {
    id: "hp-boston-ops",
    source: "HIRING_POST",
    author_name: "Ruth Adelman",
    author_title: "COO",
    company: "Portico",
    post_text:
      "We're looking for a business operations generalist in Boston. Quarterly planning, OKRs, and a headcount plan with finance. Hybrid, full-time.",
    posted_at: posted(200),
    location: "Boston, MA",
    inferred_role: "Business Operations Manager",
    original_url: "https://posts.example/p/portico-bizops",
    application_instructions: "Write to ruth@portico.example.",
  },
];
