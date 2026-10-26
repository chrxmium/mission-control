# Mission Control

**Mission Control** is an open-source scoring and event management platform built for the **FIRST LEGO® League 2026–2027 Future Edition (BIOGLOW)** challenge.

Mission Control lets referees score matches, submit results, review scoresheets, and track rankings, all from a single web interface.

Designed for FIRST Australia scoring tablets.

Soon™: Supporting all devices.

Made for Hack Club's YSWS Terra. Hello reviewers!!

> [!NOTE]
> Mission Control is still an MVP under active development. Please report bugs and feature requests through [GitHub Issues](https://github.com/chrxmium/mission-control/issues).
>
> Some administrative and event management features aren't finished yet. This is by no means a finished project. (lool pls i want to ship.. i need my carrots pls olive pls)

## Features

- **Match scoring:** Score two teams simultaneously, with live calculations, shared missions, interference penalties and Gracious Professionalism ratings.
- **Match management:** View scheduled matches, submit results, prevent duplicate submissions, and review completed scoresheets.
- **Rankings:** Automatically calculate rankings, average scores, highest scores, and completed match counts.
- **Referee authentication:** Password-protected scoring.
- **Self-hosting:** Docker deployment with SQLite persistence.

## Stack

- **Frontend:** React, TypeScript, Material UI, Vite
- **Backend:** Node, Hono
- **Database:** Drizzle, SQLite
- **Deployment:** Docker, GHCR

## Setup Guide

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

The scoring engine lives in `packages/rules/src/score.ts`. It currently covers these BIOGLOW missions:

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
-

### Submitting scores

- Both scoresheets are saved in one database transaction.
- Solo matches submit a single scoresheet.
- Rankings use average recorded scores, following FLL Future Editio. Other ranking systems are planned.

## API

REST are served endpoints under `/api/v1`.

- `GET /teams`
- `GET /teams/:id`
- `GET /matches`
- `GET /scoresheets`
- `GET /scoresheets/:id`
- `GET /rankings`
- `POST /auth/login`
- `POST /matches/:id/submit`

## Security

> [!CAUTION]
> **Do not use Mission Control to store PII or other sensitive event data.**
> Ignoring this will be violation of your role as a volunteer, as stated in your FIRST Data Privacy for Event Volunteer training.
> This software is provided as-is, without any guarantee of security or fitness for production use. Deployment and operation are the responsibility of the person or organisation running it, subject to applicable law.

## AI Usage

AI was used throughout development for frontend help, planning, debugging, code examples, and learning.

AI did not access, change, or manage the repository on its own. I reviewed, integrated, and tested all the code myself.

## Contributing

Issues, suggestions, and pull requests are welcome.

- Fork the repo, make a branch, make your changes, test them, and open a PR.
- If you change the scoring engine, please add tests.
- Bug reports and feature requests go in [GitHub Issues](https://github.com/chrxmium/mission-control/issues).

## Disclaimer

Mission Control is a community project. It is not affiliated with or endorsed by FIRST.

FIRST, FIRST LEGO®, and related names and trademarks belong to their owners.

Check scoring rules against the official season documents before using Mission Control at an event.
