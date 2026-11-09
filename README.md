# Mission Control

**Mission Control** is an open-source scoring and event management platform originally built for the **FIRST LEGO® League 2026–2027 Future Edition (BIOGLOW)** challenge.

Mission Control lets tournament directors and referees plan events, create, score and submit results, review scoresheets, and track rankings, all from a single, central web interface.

Designed for FIRST Australia & FIRST UNSW scoring tablets.

Soon™: Supporting all devices, with different UI layouts, scoring systems, and more event management features.

Made for Hack Club's YSWS Terra. Hello reviewers!!

> [!NOTE]
> Mission Control is still an MVP under active development. Please report bugs and feature requests through [GitHub Issues](https://github.com/chrxmium/mission-control/issues).
>
> Some administrative and event management features aren't finished yet. This is by no means a finished project. (lool pls i want to ship.. i need my carrots pls olive pls)

## Features

- **Match scoring:** Score two teams simultaneously (Feature for FLL Future Edition!), with live calculations, shared missions, interference penalties and Gracious Professionalism ratings.
- **Match management:** View scheduled matches, submit match results, and review completed scoresheets.
- **Rankings:** Automatically calculate rankings, average scores, highest scores, and completed match counts through the built in scoresheet.
- **Role-based authentication:** Password-protected with QR code login.
- **Hosted/Self-hosted options:** Deploy with Vercel with Postgres or on a local machine through Docker deployment with SQLite

## Stack

- **Frontend:** React, TypeScript, Material UI, Vite
- **Backend:** Node, Hono
- **Database:** Drizzle, SQLite / Postgres
- **Deployment:** Vercel, Docker, GHCR

## Setup Guide

### Deploy via Vercel (Hosted)

1. Click here --->   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fchrxmium%2Fmission-control)
2. Sign in to Vercel and create a new project from the repository.
3. Create a PostgreSQL database using a provider such as [Neon](https://neon.tech/).
4. Add your database connection string to the project's environment variables:
   - `DATABASE_PROVIDER=postgres`
   - `POSTGRES_DATABASE_URL` (your PostgreSQL connection string.)
5. Deploy the project.

Once the deployment finishes, open the provided Vercel URL to access your instance.

### Deploy via Building (Self-hosted)

**Requirements:**

- Node.js
- npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/chrxmium/mission-control.git
cd mission-control
```

### 2. Install Dependencies

```bash
cd apps/web
npm install

cd ../server
npm install
```

### 3. Configure Backend

Create an `.env` file inside `apps/server/`:

```dotenv
PORT=3001
DATABASE_URL=mission-control.db
ADMIN_TOKEN=your-random-admin-token
REFEREE_PASSWORD=your-referee-password
```

### 4. Initialise Database

From `apps/server/`:

```bash
npm run db:migrate
```

### 5. Start Backend

```bash
npm run dev
```

Default port: 3001

### 6. Start Frontend

```bash
cd apps/web
npm run dev
```

Default port: 5173

## Scoring

Mission Control currently covers these FIRST FLL Future Edition BIOGLOW missions:

- M01: Mighty Microbiomes
- M02: Roots of Renewal
- M03: Cave Waterfall
- M04: Rainforest Awakening
- M05: Central Haven
- Level Up: Invasive Attack

### Interference penalties

Penalties are applied automatically. (For Futures Edition)

- 0 violations: no penalty
- 1 violation: −10 points
- 2 violations: −30 points total
- 3 violations: whole match score becomes 0

Other events and scoring systems are soon™ to be supported.

### Submitting scores

- Both scoresheets are saved in one database transaction.
- Solo/Remote matches submit a single scoresheet.
- Team matches submit two scoresheets.
- Rankings use average recorded scores, following FLL Future Edition rules. Other ranking systems are planned™.

## Security

> [!CAUTION]
> **Do not use Mission Control to store PII or other sensitive event data.**
> Ignoring this will be violation of your role as a volunteer, as stated in your FIRST Data Privacy for Event Volunteer training.
> This software is provided as-is, without any guarantee of security or fitness for production use. Deployment and operation are the responsibility of the person or organisation running it, subject to applicable law.

## AI Usage

AI was used throughout development for frontend help, planning, debugging, code examples, and learning.

AI did not access, change, or manage the repository on its own. Humans reviewed, integrated, and tested all the code before implementation.

## Contributing

Issues, suggestions, and pull requests are welcome. Please request either myself ([@chrxmium](https://github.com/chrxmium)) or another maintainer to your pull request as a reviewer.

- Fork the repo, make a branch, make your changes, test them, and open a PR.
- If you change the scoring engine, please add tests.
- Bug reports and feature requests go in [GitHub Issues](https://github.com/chrxmium/mission-control/issues).

## Disclaimer

Mission Control is a community-run, open-source project. It is not affiliated with or endorsed by FIRST nor any of its affiliates.

FIRST, FIRST LEGO®, and related names and trademarks belong to their owners.

Check scoring rules against the official season documents before using Mission Control at an event.
