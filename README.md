# Mission Control

**Mission Control** is an open-source scoring and event management platform built for the **FIRST LEGO® League 2026–2027 Future Edition (BIOGLOW)** challenge.

It lets referees score matches, submit results, review scoresheets, and track rankings, all from a centralised web interface.

Designed for FIRST scoring tablets, self-hosting, and eventually supporting other competitions and seasons.

Made for **Hack Club's YSWS Terra**. Hello reviewers!!

> [!NOTE]
> Mission Control is still an MVP under active development. Please report bugs and feature requests through [GitHub Issues](https://github.com/chrxmium/mission-control/issues).
>
> Some administrative and event management features aren't finished yet. (lool pls i want to ship.. i need my carrots pls olive pls)

## Features

- **Match scoring:** Score two teams simultaneously, with live calculations, shared missions, interference penalties, no-shows, and Gracious Professionalism ratings.
- **Match management:** View scheduled matches, submit results, prevent duplicate submissions, and review completed scoresheets.
- **Rankings:** Automatically calculate rankings, average scores, highest scores, and completed match counts.
- **Referee authentication:** Password-protected scoring with 12-hour sessions.
- **Self-hosting:** Docker deployment with SQLite persistence, TrueNAS SCALE support, and Cloudflare Tunnel compatibility.

The frontend and backend share the same TypeScript scoring rules to keep calculations consistent.

## Tech Stack

| Component     | Technology                           |
| ------------- | ------------------------------------ |
| Frontend      | React, TypeScript, Material UI, Vite |
| Backend       | Node.js, Hono                        |
| Database      | SQLite, Drizzle ORM                  |
| Deployment    | Docker, Nginx, GHCR                  |
| CI/CD         | GitHub Actions                       |
| Remote access | Cloudflare Tunnel                    |

## Getting Started

**Requirements:** Node.js, npm, and Git.

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

### 3. Configure the Backend

Create an `.env` file inside `apps/server/`:

```dotenv
PORT=3001
DATABASE_URL=mission-control.db
ADMIN_TOKEN=your-random-admin-token
REFEREE_PASSWORD=your-referee-password
```

Generate a secure administrator token using:

```bash
openssl rand -hex 32
```

Or use your own securely generated token. Just make sure it's strong and don't commit it to GitHub!

### 4. Initialise the Database

From `apps/server/`:

```bash
npm run db:migrate
```

### 5. Start the Backend

```bash
npm run dev
```

### 6. Start the Frontend

In another terminal, from the repository root:

```bash
cd apps/web
npm run dev
```

Open **http://localhost:5173**.

The frontend automatically proxies `/api` requests to the backend running on port `3001`.

## Scoring

The scoring engine is located in `packages/rules/src/score.ts` and currently supports the following BIOGLOW missions:

| Mission  | Name                 |
| -------- | -------------------- |
| M01      | Mighty Microbiomes   |
| M02      | Roots of Renewal     |
| M03      | Cave Waterfall       |
| M04      | Rainforest Awakening |
| M05      | Central Haven        |
| Level Up | Invasive Attack      |

### Interference Penalties

Penalties are applied automatically:

| Violations | Penalty                      |
| ---------- | ---------------------------- |
| 0          | No penalty                   |
| 1          | −10 points                   |
| 2          | −30 points total             |
| 3          | Entire match score becomes 0 |

### Shared Missions and No-Shows

M05 is shared between both teams, with points awarded to each eligible team.

No-shows and nullified teams receive zero points. No-shows can be recorded using the participation picker at the top of the scoring interface.

### Score Submission

Both teams' scoresheets are submitted in a single database transaction. If anything fails, the transaction is rolled back to prevent incomplete results.

Solo matches submit one scoresheet.

Rankings currently use average recorded scores, following the FLL Future Edition ranking system. Support for alternative ranking systems is planned for other competitions.

## API

The backend exposes REST endpoints under `/api/v1`.

| Method | Endpoint              |
| ------ | --------------------- |
| GET    | `/teams`              |
| GET    | `/teams/:id`          |
| GET    | `/matches`            |
| GET    | `/scoresheets`        |
| GET    | `/scoresheets/:id`    |
| GET    | `/rankings`           |
| POST   | `/auth/login`         |
| POST   | `/matches/:id/submit` |

Match submission requires a valid referee session.

## Docker / TrueNAS SCALE

Docker images are published to GitHub Container Registry:

- `ghcr.io/chrxmium/mission-control-api:latest`
- `ghcr.io/chrxmium/mission-control-web:latest`

### TrueNAS SCALE Installation

Go to **Apps → Discover Apps → Install via YAML**.

Set the application name to `mission-control` and use the following configuration:

```yaml
services:
    mission-control-api:
        image: ghcr.io/chrxmium/mission-control-api:latest
        restart: unless-stopped
        user: "568:568"

        environment:
            NODE_ENV: production
            PORT: "3001"
            DATABASE_URL: /data/mission-control.db
            ADMIN_TOKEN: "REPLACE_WITH_ADMIN_TOKEN"
            REFEREE_PASSWORD: "REPLACE_WITH_REFEREE_PASSWORD"

        volumes:
            - /mnt/tb/mission-control/data:/data

        expose:
            - "3001"

        networks:
            - mission-control-net

        security_opt:
            - no-new-privileges:true

    mission-control-web:
        image: ghcr.io/chrxmium/mission-control-web:latest
        restart: unless-stopped

        depends_on:
            - mission-control-api

        ports:
            - "8088:80"

        networks:
            - mission-control-net

        security_opt:
            - no-new-privileges:true

networks:
    mission-control-net:
        driver: bridge
```

Replace the placeholder credentials before deploying.

### Persistent Storage

Create the data directory on your TrueNAS host:

```bash
sudo mkdir -p /mnt/tb/mission-control/data
sudo chown 568:568 /mnt/tb/mission-control/data
sudo chmod 750 /mnt/tb/mission-control/data
```

The example uses UID/GID `568:568`. (as per the normal UID for TrueNAS apps.) If you change the container user or storage location, adjust the permissions accordingly.

**Important:** Make sure the database schema has been initialised using the project's migrations before starting the application. An empty directory alone is not enough.

Once deployed, access Mission Control at:

`http://TRUENAS_IP:8088`

### Cloudflare Tunnel

Mission Control can also be accessed through an existing Cloudflare Tunnel.

Create a published application route in Cloudflare Zero Trust:

| Setting         | Value                 |
| --------------- | --------------------- |
| Public hostname | `scoring.example.com` |
| Service type    | HTTP                  |
| Origin address  | `TRUENAS_IP:8088`     |

No port forwarding is required.

_(yes, there's a TrueNAS section because that's what I use. reminder: you don't need a separate `.env` when deploying through YAML.)_

## Security

> [!CAUTION]
> **DO NOT TRUST MISSION CONTROL WITH PERSONALLY IDENTIFIABLE INFORMATION (PII).**
>
> Mission Control is an MVP and has not undergone a comprehensive security audit. It is not currently suitable for storing or processing sensitive personal information.
>
> **Do not use Mission Control to store PII or other sensitive event data.** Follow FIRST's data privacy requirements and your responsibilities as an event volunteer.
>
> This software is provided as-is, without any guarantee of security or fitness for production use. Deployment and operation are the responsibility of the person or organisation running it, subject to applicable law.

**Current authentication limitations:**

Referee sessions are stored in server memory and expire after 12 hours. Restarting the backend clears all active sessions.

Logging out currently removes the locally stored token, but does not revoke the session server-side.

Authentication hardening, rate limiting, and improved session management are planned.

## Roadmap

### Working

- [x] Two-team and solo scoring
- [x] Live scoring and shared missions
- [x] Interference penalties and no-shows
- [x] Atomic match submissions
- [x] Rankings and scoresheet history
- [x] Referee authentication
- [x] Docker and TrueNAS deployment
- [x] Cloudflare Tunnel support

### Planned

- [ ] Administrator and referee roles
- [ ] Head Referee score overrides
- [ ] Referee assignments and match locking
- [ ] QR-based authentication
- [ ] Event creation and automated scheduling
- [ ] Multiple seasons and competitions
- [ ] Qualification and practice match separation
- [ ] Advanced rankings and brackets
- [ ] Audit logs and score editing
- [ ] Authentication and database migration improvements

## AI Usage

AI was used throughout development for frontend assistance, planning, debugging, code examples, and learning.

AI did not independently access, modify, or manage the repository. All code was reviewed, integrated, and tested manually, with project decisions and development remaining under human control.

## Contributing

Issues, suggestions, and pull requests are welcome!

To contribute, fork the repository, create a branch, make your changes, test them, and open a pull request.

Please include appropriate tests for changes affecting the scoring engine.

Bug reports and feature requests can be submitted through [GitHub Issues](https://github.com/chrxmium/mission-control/issues).

## Disclaimer

Mission Control is an independent, community-developed project and is not affiliated with, endorsed by, or maintained by FIRST.

FIRST, FIRST LEGO® League, and related competition names and trademarks belong to their respective owners.

Always verify scoring requirements against the official season documentation before using Mission Control at an event.
