# Mission Control

**Mission Control** is an open-source competition scoring and event management platform, initially developed for the **FIRST LEGO League (FLL) 2026–2027 Future Edition — BIOGLOW** challenge.

It provides a centralised interface for referees to score matches, submit results, review scoresheets, and track team rankings.

Mission Control is designed to be self-hosted, tablet-friendly, and adaptable to different competition formats.

> [!NOTE]
> Mission Control is currently an MVP under active development. Some administrative and competition management features are planned but not yet implemented. (lool pls i want to ship.. i need my carrots pls olive pls)

## AI Declaration
Artificial intelligence (AI) was used throughout the development of this project as a development aid, learning resource, and collaborative planning tool.
AI was not granted direct access to the repository, development environment, or project files for the purpose of independently modifying or implementing the project. All code was reviewed, integrated, tested, and maintained manually by a human developer.
The project's direction, implementation decisions, and overall development remained under human control. AI assistance was primarily used for the following purposes:
- Frontend development: Designing and generating significant portions of the user interface, including React components, page layouts, and styling.
- Architecture and planning: Collaboratively planning the application's structure, API endpoints, database design, and implementation approach.
- Code review and refactoring: Identifying errors, troubleshooting issues, suggesting improvements, and helping restructure existing code.
- Learning and guidance: Explaining programming concepts, development practices, and the reasoning behind implementation decisions.
- Implementation examples: Providing reference code, demonstrating how features could be implemented, and helping complete specific sections of code.
While AI-generated code and suggestions were incorporated into the project, AI did not autonomously develop, modify, or manage the codebase. All AI contributions were subject to human review and implementation.

## Features

### Match Scoring

- Score two teams simultaneously using a single referee device.
- Responsive scoring interface designed for tablets.
- Live score calculations as mission values change.
- Support for solo and remote matches.
- Configurable table number when scoring.
- Shared mission scoring for M05 (Central Haven).
- Support for team no-shows.
- Automatic score nullification after three interference violations.
- Gracious Professionalism ratings.
- Backend score validation and calculation.

### Match Management

- View scheduled matches and participating teams.
- Open upcoming matches for scoring.
- Submit both teams' results in a single database transaction.
- Automatically update match status after submission.
- Prevent duplicate submissions.
- Review results for completed matches.
- Open individual submitted scoresheets.

### Rankings and Results

- Automatically calculate team rankings from saved scoresheets.
- Display average scores and highest scores.
- Display completed match counts.
- View individual mission values.
- View final scores and submission timestamps.

The current ranking implementation uses a simple average of recorded scores. Advanced ranking eligibility rules and competition stages are planned for future versions.

### Referee Authentication

- Password-based referee access.
- Server-generated session tokens.
- Session expiration after 12 hours.
- Protected match submission endpoint.
- Referee unlock interface.

Authentication is currently intended for initial deployments and controlled environments. Additional security improvements are planned.

### Self-Hosting

- Docker-based deployment.
- Persistent SQLite database.
- Nginx reverse proxy.
- Support for TrueNAS SCALE custom applications.
- Compatible with Cloudflare Tunnel.
- No inbound router port forwarding required when using Cloudflare Tunnel.

---

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, TypeScript |
| UI framework | Material UI |
| Build tool | Vite |
| Routing | React Router |
| Backend | Node.js, Hono |
| Database | SQLite |
| ORM | Drizzle ORM |
| SQLite driver | better-sqlite3 |
| Containerisation | Docker |
| Reverse proxy | Nginx |
| Container registry | GitHub Container Registry |
| CI/CD | GitHub Actions |
| Remote access | Cloudflare Tunnel |

The frontend and backend share TypeScript scoring rules to maintain consistent calculations.

### Frontend

The frontend provides the referee scoring interface, match list, rankings, authentication screen, and submitted scoresheet viewer.

### Backend

The backend manages teams, matches, scoresheets, rankings, authentication, and database operations.

### Shared Rules

The `packages/rules` directory contains the competition scoring engine.

Using shared scoring rules helps prevent differences between frontend score previews and backend score calculations.

---

## Getting Started

### Prerequisites

For local development:

- Node.js
- npm
- SQLite
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/chrxmium/mission-control.git
cd mission-control
```

### 2. Install Dependencies

Install the frontend and backend dependencies:

```bash
cd apps/web
npm install

cd ../server
npm install
```

### 3. Configure the Backend

Create an `.env` file inside `apps/server/`.

Example:

```dotenv
PORT=3001
DATABASE_URL=mission-control.db
ADMIN_TOKEN=replace-with-a-random-admin-token
REFEREE_PASSWORD=replace-with-a-secure-referee-password
```

Generate an administrator token:

```bash
openssl rand -hex 32
```

Never commit `.env` files or production credentials.

### 4. Initialise the Database

Mission Control uses SQLite and Drizzle ORM.

From `apps/server/`, run:

```bash
npm run db:migrate
```

The configured migrations must match the database schema expected by the running application.

For an existing deployment, back up the database before applying migrations.

### 5. Start the Backend

From `apps/server/`:

```bash
npm run dev
```

The backend is accessible at:

```text
http://localhost:3001
```

### 6. Start the Frontend

In another terminal, navigate to `apps/web/`:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

The Vite development proxy forwards `/api` requests to the backend running on port `3001`.

---

## Building for Production

Build the frontend:

```bash
cd apps/web
npm run build
```

Build the backend:

```bash
cd apps/server
npm run build
```

The frontend build generates static files in `apps/web/dist/`.

Production deployments serve these files using Nginx.

---

## Scoring System

Mission Control currently implements scoring for the **FLL Future Edition BIOGLOW** challenge.

The scoring engine is located at:

```text
packages/rules/src/score.ts
```

### Supported Missions

| Mission | Description |
|---|---|
| M01 | Mighty Microbiomes |
| M02 | Roots of Renewal |
| M03 | Cave Waterfall |
| M04 | Rainforest Awakening |
| M05 | Central Haven |
| Level Up | Invasive Attack |
| Interference | Rule violation penalties |
| GP | Gracious Professionalism |

### Shared Mission Scoring

M05 is shared between the teams competing in the same match.

The referee enters the shared mission result once.

Each eligible team receives the corresponding points.

A team that does not participate or is nullified receives zero points, including its M05 points.

### Interference

Mission Control implements the following interference rules:

| Violations | Result |
|---|---|
| 0 | No penalty |
| 1 | −10 points |
| 2 | −30 points total |
| 3 | Entire match score becomes 0 |

Nullification occurs automatically when the third violation is recorded.

The referee does not manually select a nullified participation status.

### No-Shows

A team marked as a no-show receives a final score of zero.

The other team can continue scoring normally.

### Atomic Submission

A match is submitted using:

```http
POST /api/v1/matches/:id/submit
```

Both teams' scoresheets are saved within one SQLite transaction.

If any part of the transaction fails, the submission is rolled back.

This prevents incomplete match results from being committed.

Solo matches submit one scoresheet.

---

## API

The Hono backend exposes REST endpoints under `/api/v1`.

### Public Read Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/teams` | List teams |
| GET | `/api/v1/teams/:id` | Get a team |
| GET | `/api/v1/matches` | List matches |
| GET | `/api/v1/scoresheets` | List submitted scoresheets |
| GET | `/api/v1/scoresheets/:id` | Get a scoresheet |
| GET | `/api/v1/rankings` | Get team rankings |

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/login` | Authenticate a referee |

### Scoring

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/matches/:id/submit` | Submit match scores |

Match submission requires a valid referee session token.

### Example

Retrieve all matches:

```bash
curl http://localhost:3001/api/v1/matches
```

Retrieve rankings:

```bash
curl http://localhost:3001/api/v1/rankings
```

Additional administrator endpoints exist but are not yet part of a complete production administration workflow.

---

## Docker Deployment

Mission Control provides separate Docker images for its frontend and backend.

### Images

| Component | Image |
|---|---|
| Backend | `ghcr.io/chrxmium/mission-control-api:latest` |
| Frontend | `ghcr.io/chrxmium/mission-control-web:latest` |

Docker images are published through GitHub Actions.

### Architecture

```text
                  HTTPS
                    │
                    ▼
             Cloudflare Tunnel
                    │
                    ▼
               Nginx :80
                /       \
               /         \
              ▼           ▼
         React App      /api/*
                           │
                           ▼
                      Hono :3001
                           │
                           ▼
                         SQLite
                           │
                           ▼
                  Persistent Storage
```

### Environment Variables

| Variable | Description |
|---|---|
| `NODE_ENV` | Runtime environment |
| `PORT` | Backend listening port |
| `DATABASE_URL` | SQLite database path |
| `ADMIN_TOKEN` | Administrator API credential |
| `REFEREE_PASSWORD` | Referee login password |

The production SQLite path is:

```text
/data/mission-control.db
```

---

## TrueNAS SCALE Deployment

Mission Control can run as a TrueNAS COM custom application.

(note: i use truenas so that's why this is here. \
reminder, you don't need a .env if you deploy with install via yaml)

### Installation

Open:

**TrueNAS → Apps → Discover Apps → Install via YAML**

Set the application name to:

```text
mission-control
```

Use the following example configuration:

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

Replace the placeholder credentials before deployment.

The backend container is restricted to the internal Docker network.

Only the Nginx frontend is exposed through the TrueNAS host.

### Persistent Storage

The example configuration stores SQLite data at:

```text
/mnt/tb/mission-control/data
```

Create the directory:

```bash
sudo mkdir -p /mnt/tb/mission-control/data
sudo chown 568:568 /mnt/tb/mission-control/data
sudo chmod 750 /mnt/tb/mission-control/data
```

The example container runs as UID/GID `568:568`.

If you change the container user, adjust the dataset permissions accordingly.

SQLite requires permission to create and modify its database, journal, and WAL files.

**Note:** An empty data directory does not automatically guarantee the database schema exists. Initialise the database using the project's migrations or restore an existing compatible database before starting the application.

### Accessing the Application

For the example configuration:

```text
http://TRUENAS_IP:8088
```

The backend is accessible to the frontend through the internal Docker network.

---

## Cloudflare Tunnel

Mission Control supports deployment behind Cloudflare Tunnel.

An existing `cloudflared` installation can be reused.

No additional tunnel container is required.

### Example Configuration

Create a published application route in Cloudflare Zero Trust.

| Setting | Value |
|---|---|
| Public hostname | `scoring.example.com` |
| Service type | HTTP |
| Origin address | `TRUENAS_IP:8088` |

Cloudflare handles the public HTTPS connection.

Nginx serves the frontend and forwards `/api` requests to the backend.

### Security

For initial deployments, using Cloudflare Access to restrict access to approved testers is recommended.

Publicly accessible competition dashboards and private referee functionality may use different access policies in future versions.

---

## Database Backups

SQLite stores teams, matches, scoresheets, and other application data in a single database file.

Regular backups are recommended, particularly during active competitions.

### Creating a Backup

Using the SQLite CLI:

```bash
sqlite3 mission-control.db \
  ".backup 'mission-control-backup.db'"
```

The SQLite backup command creates a consistent database snapshot.

### Exporting SQL

To export the database schema and contents:

```bash
sqlite3 mission-control.db ".dump" > mission-control.sql
```

SQL dumps can be imported into a new SQLite database.

Avoid replacing the database while the backend is running.

The persistent storage volume should be backed up independently of the Docker images.

---

## GitHub Actions

Mission Control uses GitHub Actions to build and publish Docker images.

The workflow is located at:

```text
.github/workflows/docker-publish.yml
```

When changes are pushed to `main`, the workflow builds:

- `mission-control-api`
- `mission-control-web`

Images are published to GitHub Container Registry.

The deployment can then be updated by pulling the latest images and restarting the containers.

Database contents remain in persistent storage.

---

## Security Considerations

Mission Control is currently intended for controlled competition environments.

(note: DO NOT TRUST MISSION CONTROL WITH ANY PII. MISSION CONTROL IS NOT SECURE ENOUGH TO CARRY PII. \
DOING SO WILL BE VIOLATION OF YOUR ROLE AS A VOLUNTEER, AS STATED IN YOUR FIRST DATA PRIVACY FOR EVENT VOLUNTEER TRAINING. i'm watching..)

Before exposing a production instance publicly, review the following:

- Use strong, unique administrator and referee credentials.
- Keep secrets out of Git and Docker images.
- Use HTTPS through Cloudflare Tunnel or another reverse proxy.
- Restrict access to administrative functionality.
- Apply rate limiting to authentication endpoints.
- Protect session tokens.
- Keep Docker images and dependencies updated.
- Back up SQLite regularly.
- Use a dedicated, least-privileged container user.

The current referee session implementation stores sessions in server memory.

Sessions expire after 12 hours and are lost when the backend restarts.

Logging out of the frontend currently clears the browser's stored token; server-side token revocation is not yet implemented.

---

## Roadmap

Mission Control is being developed incrementally.

### Current MVP

- [x] Two-team match scoring
- [x] Solo/remote match scoring
- [x] Shared M05 scoring
- [x] Live score calculation
- [x] Automatic interference nullification
- [x] Atomic match submission
- [x] SQLite persistence
- [x] Submitted scoresheet viewing
- [x] Basic rankings
- [x] Referee password authentication
- [x] Docker deployment configuration
- [x] TrueNAS SCALE deployment support
- [x] Cloudflare Tunnel compatibility

### Planned Improvements

- [ ] Full referee and administrator role management
- [ ] Head Referee score overrides
- [ ] Referee assignment and match locking
- [ ] QR-based referee authentication
- [ ] Improved authentication security and rate limiting
- [ ] Event creation and configuration
- [ ] Multiple competitions and seasons
- [ ] Automated match scheduling
- [ ] Practice and qualification match separation
- [ ] Advanced ranking rules
- [ ] Brackets and alliance challenges
- [ ] Audit logs
- [ ] Improved score editing
- [ ] Database migration and deployment improvements

---

## Contributing

Contributions, suggestions, bug reports, and feature requests are welcome.

To contribute:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test the affected components.
5. Submit a pull request.

Changes to scoring calculations should include appropriate tests.

Please avoid introducing breaking changes to the scoring engine without documenting the affected competition rules.

---

## Disclaimer

Mission Control is an independent project.

It is not officially affiliated with, endorsed by, or maintained by FIRST.

FIRST, FIRST LEGO League, and associated competition names and trademarks belong to their respective owners.

Official competition rules and scoring requirements should be verified against the relevant season's documentation before using the platform at an event.
