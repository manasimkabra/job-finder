# Job Finder

A local board that ranks formal job listings and mock hiring posts against a resume. Matching uses responsibilities and requirements, not a title search. Profiles, scores, and history stay in this browser (`localStorage`). There is no account and no external job feed.

Two starter profiles are included: a strategy and operations generalist, and a machine learning engineer. Add, edit, or delete profiles from the recommendation page.

## Run locally

```bash
npm install
npm run dev -- --hostname 0.0.0.0 --port 43123
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

Production build:

```bash
npm run build
npm start -- --hostname 0.0.0.0 --port 43123
```
