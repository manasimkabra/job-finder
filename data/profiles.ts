import type { Profile } from "@/lib/domain/types";

export const seedProfiles: Profile[] = [
  {
    id: "avery-chen",
    name: "Avery Chen",
    version: 1,
    careerInterests:
      "Analytical generalist work close to an operator: strategy, business operations, finance and strategic finance, Chief of Staff or a founder's office, strategic initiatives, corporate development, and portfolio operations. I want planning, prioritization, and decision support rather than a narrow specialist track.",
    preferences: {
      locations: ["new-york", "sf-bay", "remote-us"],
      minSalary: 95000,
      workArrangements: ["remote", "hybrid"],
      employmentTypes: ["full-time"],
    },
    resumeText: `Avery Chen
Strategy and operations generalist

Experience
Strategy & Operations Associate, Harborline (2023–2026)
Owned the weekly operating cadence for a 90-person company. Built the quarterly planning pack, tracked OKRs, and wrote board materials with the CFO. Partnered with finance on the forecast, the headcount plan, and variance notes. Ran special projects for the CEO, including a pricing review and the agenda for executive priorities.

Business Analyst, North Elm Consulting (2021–2023)
Staffed on operations projects for mid-market companies. Built market maps and financial modeling in support of due diligence for a carve-out. Facilitated working sessions and kept cross-functional coordination honest.

Education
B.A. Economics, University of Michigan, 2021

I write for executives and do light financial modeling. I am not a software engineer and I do not close the books.`,
  },
  {
    id: "jordan-hale",
    name: "Jordan Hale",
    version: 1,
    careerInterests:
      "Applied machine learning, ML infrastructure, and backend engineering. I want to build and evaluate models and the services around them. I am not looking for management-only roles or generalist business jobs.",
    preferences: {
      locations: ["sf-bay", "remote-us", "boston"],
      minSalary: 160000,
      workArrangements: ["remote", "hybrid"],
      employmentTypes: ["full-time"],
    },
    resumeText: `Jordan Hale
Machine learning engineer

Experience
Machine Learning Engineer, Signal North (2022–2026)
Trained ranking models and classification models in PyTorch. Built feature pipelines, offline evaluation, and model monitoring that caught a silent label bug. Owned two backend services end to end, including on-call. Model training and evaluation were the core of the job.

Backend Engineer, Field Current (2020–2022)
Designed Go services and Postgres schemas for a logistics API. Cut API latency on the dispatch endpoint and added the audit log a customer required.

Education
M.S. Computer Science, Georgia Tech, 2020
B.S. Computer Science, 2018

I do applied machine learning and backend engineering. I do not do corporate strategy, accounting, or sales.`,
  },
];
