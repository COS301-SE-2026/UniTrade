<div align="center">

# UniTrade

### The trusted peer-to-peer marketplace for South African university students

<br/>

<!-- CI/CD Status Pipeline Badges -->
[![Backend CI](https://github.com/COS301-SE-2026/UniTrade/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/COS301-SE-2026/UniTrade/actions/workflows/backend-ci.yml)
[![Web Frontend CI](https://github.com/COS301-SE-2026/UniTrade/actions/workflows/web-ci.yml/badge.svg)](https://github.com/COS301-SE-2026/UniTrade/actions/workflows/web-ci.yml)

<!-- Quality, Licensing & Contribution Badges -->
[![Vitest Tests](https://img.shields.io/badge/tests-83%20passing-brightgreen)](https://github.com/COS301-SE-2026/UniTrade/actions/workflows/web-ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/COS301-SE-2026/UniTrade/blob/main/LICENSE)
[![GitHub Issues](https://img.shields.io/github/issues/COS301-SE-2026/UniTrade)](https://github.com/COS301-SE-2026/UniTrade/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/COS301-SE-2026/UniTrade/blob/main/CONTRIBUTING.md)

<br/>

[Live Demo](#) · [Report a Bug](https://github.com/COS301-SE-2026/UniTrade/issues) · [Request a Feature](https://github.com/COS301-SE-2026/UniTrade/issues)

<br/><br/>


<sub>
<em>The DevNexus Team — University of Pretoria · COS301 Capstone 2026
</em></sub>

</div>

---
# UniTrade

A web and mobile marketplace for South African university students to buy and sell second-hand academic materials safely and affordably.

## The problem

University students in South Africa face significant financial pressure, from high tuition fees, rising living costs, and expensive prescribed textbooks. The current alternatives are bleak: buy new materials at full price, or rely on informal peer networks that are unreliable, unverified, and often unsafe.
There is currently no structured and trusted platform where students can safely exchange academic materials with confidence.

## What UniTrade does


UniTrade provides a structured, verified marketplace where students can list, browse, and purchase used academic materials directly from peers at their institution. Every user is verified as an active, currently enrolled student before they can transact, ensuring the platform remains trusted and scalable.


## Key Features

| Feature | Description |
|---|---|
| **Student Verification** | Every account is verified against university enrollment records before transacting |
| **AI Listing Verification** | Azure Computer Vision checks listing images for accuracy and detects fraud at delivery |
| **Real-Time Chat** | Secure in-app messaging between buyers and sellers to coordinate meetups |
| **Location Pickup** | Google Maps integration for arranging safe, campus-based handovers |
| **Secure Payments** | OZOW integration — pay directly from your bank account, no card needed |
| **AI Material Suggestions** | OpenAI-powered degree-specific material recommendations and price optimization |
| **Multi-Channel Notifications** | Push notifications (FCM) and transactional emails (Resend) |

---

## Tech Stack

### Frontend
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)

### Mobile
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)

### Backend
![C#](https://img.shields.io/badge/C%23-239120?style=for-the-badge&logo=c-sharp&logoColor=white)
![.NET](https://img.shields.io/badge/.NET-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)


### Database
![Microsoft SQL Server](https://img.shields.io/badge/Microsoft_SQL_Server-CC2927?style=for-the-badge&logo=microsoft-sql-server&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)

### Cloud & DevOps
![Azure](https://img.shields.io/badge/Microsoft_Azure-0089D6?style=for-the-badge&logo=microsoft-azure&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)

### AI & Integrations
![Azure](https://img.shields.io/badge/Azure_Computer_Vision-0089D6?style=for-the-badge&logo=microsoft-azure&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![Google Maps](https://img.shields.io/badge/Google_Maps-4285F4?style=for-the-badge&logo=google-maps&logoColor=white)

---

## Documentation
| Document | Link |
| --- | --- |
| SRS Document| [https://github.com/COS301-SE-2026/UniTrade/blob/feature/documentation/docs/requirements/UniTrade_SRS.pdf](https://github.com/COS301-SE-2026/UniTrade/blob/feature/FrontEnd-Mahadio/docs/requirements/UniTrade_SRS_Demo_1.pdf)|
| WireFrames| https://github.com/COS301-SE-2026/UniTrade/blob/feature/documentation/docs/wireframes/Wireframes.pdf|
| Figma_Doc (WireFrames) | https://www.figma.com/design/jOuASbpQX3ANQwK6z65HXw/Plan2?node-id=0-1&t=d203OEm1RvksQhm1-1|
| Branding_Style_Doc | https://github.com/COS301-SE-2026/UniTrade/blob/feature/documentation/docs/wireframes/UniTrade%20%E2%80%93%20Brand%20Style%20Guide.pdf |
| Architecture_Diagram| https://github.com/COS301-SE-2026/UniTrade/blob/feature/documentation/docs/diagrams/Architecture_Diagram.png |
|BrandingStyleDoc (HTML) | https://github.com/COS301-SE-2026/UniTrade/blob/feature/documentation/docs/wireframes/UniTrade-Brand-Style-Guide.html|

## Project Structure

```
UniTrade/
│
├── .github/
│   ├── workflows/
│   │   ├── backend-ci.yml
│   │   ├── web-ci.yml
│   │   ├── mobile-ci.yml
│   │   ├── cd.yml
│  
│
├── docs/
│   ├── diagrams/
│   ├── requirements/
│   ├── design-docs/
│   └── security-research/
│
├── src/
│   │
│   ├── web/                               # React.js
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── assets/
│   │   │   ├── components/                # Shared UI components
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── listings/
│   │   │   │   ├── reservations/
│   │   │   │   ├── chat/
│   │   │   │   ├── payments/
│   │   │   │   └── profile/
│   │   │   ├── hooks/
│   │   │   ├── services/                  # API client calls
│   │   │   ├── store/                     # State management
│   │   │   ├── types/
│   │   │   └── utils/
│   │   ├── tests/
│   │   │   ├── unit/                      # Individual component tests (Jest)
│   │   │   ├── integration/               # Multi-component + service layer tests (RTL)
│   │   │   └── e2e/                       # Full browser flows (Playwright)
│   │   ├── .env.example
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── mobile/                            # React Native
│   │   ├── src/
│   │   │   ├── assets/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── listings/
│   │   │   │   ├── reservations/
│   │   │   │   ├── chat/
│   │   │   │   ├── payments/
│   │   │   │   └── profile/
│   │   │   ├── hooks/
│   │   │   ├── navigation/
│   │   │   ├── services/
│   │   │   ├── store/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   ├── tests/
│   │   │   ├── unit/                      # Individual component tests (Jest)
│   │   │   ├── integration/               # Multi-component + service layer tests (RTL)
│   │   │   └── e2e/                       # Device/simulator flows (Detox)
│   │   ├── .env.example
│   │   └── package.json
│   │
│   └── backend/                           # C# — Modular Monolith
│       ├── Api/                  # Entry point — controllers, middleware, startup
│       │   ├── Controllers/
│       │   │   ├── AuthController.cs
│       │   │   ├── ListingsController.cs
│       │   │   ├── ReservationsController.cs
│       │   │   ├── PaymentsController.cs
│       │   │   ├── ChatController.cs
│       │   │   └── WebhookController.cs   # Ozow inbound webhook
│       │   ├── Hubs/
│       │   │   └── ChatHub.cs             # SignalR/WebSocket hub
│       │   ├── Middleware/
│       │   │   ├── AuthMiddleware.cs
│       │   │   └── ExceptionMiddleware.cs
│       │   ├── appsettings.json
│       │   ├── appsettings.Development.json
│       │   ├── Program.cs
│       │   ├── Dockerfile
│       │   └── Api.csproj
│       │
│       ├── Modules/              # All business logic
│       │   ├── Identity/
│       │   │   ├── IIdentityService.cs
│       │   │   ├── IdentityService.cs
│       │   │   ├── Verification/
│       │   │   │   ├── IVerificationService.cs
│       │   │   │   └── VerificationService.cs
│       │   │   └── Models/
│       │   ├── Listings/
│       │   │   ├── IListingsService.cs
│       │   │   ├── ListingsService.cs
│       │   │   ├── Moderation/
│       │   │   │   ├── IModerationService.cs
│       │   │   │   └── ModerationService.cs
│       │   │   └── Models/
│       │   ├── Reservations/
│       │   │   ├── IReservationsService.cs
│       │   │   ├── ReservationsService.cs
│       │   │   ├── StateMachine/
│       │   │   │   ├── ReservationStateMachine.cs
│       │   │   │   └── ReservationStates.cs
│       │   │   └── Models/
│       │   ├── Payments/
│       │   │   ├── IPaymentsService.cs
│       │   │   ├── PaymentsService.cs
│       │   │   └── Models/
│       │   ├── Chat/
│       │   │   ├── IChatService.cs
│       │   │   ├── ChatService.cs
│       │   │   └── Models/
│       │   ├── Disputes/
│       │   │   ├── IDisputesService.cs
│       │   │   ├── DisputesService.cs
│       │   │   └── Models/
│       │   ├── Reputation/
│       │   │   ├── IReputationService.cs
│       │   │   ├── ReputationService.cs
│       │   │   └── Models/
│       │   ├── Notifications/
│       │   │   ├── INotificationsService.cs
│       │   │   ├── NotificationsService.cs
│       │   │   └── Models/
│       │   └── Audit/
│       │       ├── IAuditService.cs
│       │       ├── AuditService.cs
│       │       └── Models/
│       │
│       ├── Infrastructure/       # All external concerns
│       │   ├── Persistence/
│       │   │   ├── AppDbContext.cs
│       │   │   └── Repositories/
│       │   ├── Cache/
│       │   │   └── RedisCache.cs
│       │   ├── Storage/
│       │   │   └── BlobStorageService.cs
│       │   ├── Messaging/
│       │   │   └── ServiceBusPublisher.cs
│       │   ├── Search/
│       │   │   └── AzureSearchService.cs
│       │   ├── AI/
│       │   │   ├── ComputerVisionService.cs
│       │   │   └── OpenAIService.cs
│       │   ├── Payments/
│       │   │   └── OzowClient.cs
│       │   ├── Maps/
│       │   │   └── GoogleMapsService.cs
│       │   └── Notifications/
│       │       ├── ResendEmailService.cs
│       │       └── FcmPushService.cs
│       │
│       ├── Workers/
│       │   ├── ReservationExpiryWorker.cs
│       │   ├── ListingModerationWorker.cs
│       │   ├── VerificationWorker.cs
│       │   ├── NotificationWorker.cs
│       │   └── Workers.csproj
│       │
│       └── Tests/
│       |   ├── Unit/
│       |   │   ├── Modules/
│       |    │   └── Workers/
│       |   ├── Integration/               # DB + Redis + Service Bus via Docker
│       |   │   ├── Modules/
│       |   │   └── Infrastructure/
│       |   └── UniTrade.Tests.csproj
│       ├── swagger/
│       │   └── openapi.json
│
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── scripts/
│
├── infra/
│   ├── azure/
│   │   ├── container-apps.bicep
│   │   ├── sql.bicep
│   │   ├── redis.bicep
│   │   ├── servicebus.bicep
│   │   ├── storage.bicep
│   │   └── frontdoor.bicep
│   └── docker/
│       └── docker-compose.yml             # Local dev: spins up SQL, Redis, Service Bus
│
│
├── .env.example
├── .gitignore
├── README.md
└── UniTrade.sln
```
---
## Team — DevNexus

We are **DevNexus**, a team of five final-year Computer Science students from the University of Pretoria, building UniTrade as our COS301 Capstone Project.

| Name | Image | Role | Links |
|---|---|---|---|
| **Zelamene Shazi** | <img src="src/web/src/assets/Zee.jpeg" width="80" /> | Project Lead · Backend | [LinkedIn](https://www.linkedin.com/in/zelamene-shazi-66ab142b6/) |
| **Sabira Karie** | <img src="src/web/src/assets/Sabira.jpeg" width="80" /> | Backend | [LinkedIn](https://www.linkedin.com/in/saira-kaire-666365378/) |
| **Mahadio Tlaka** | <img src="src/web/src/assets/Didi.jpeg" width="80" /> | Frontend | [LinkedIn](https://www.linkedin.com/in/mahadio-tlaka-419a12393/) |
| **Langa Vakalisa** | <img src="src/web/src/assets/Langa.jpeg" width="80" /> | Frontend | [LinkedIn](https://www.linkedin.com/in/langazelelwa-vakalisa-676a773a7) |
| **Tafadzwa Musiiwa** | <img src="src/web/src/assets/Tafadzwa.jpeg" width="80" /> | Frontend | [LinkedIn](https://www.linkedin.com/in/tafadzwa-musiiwa-3465553b9) |
---
## Development Approach

UniTrade is built using a **hybrid Agile (Scrum-inspired)** methodology:

- **Weekly sprints** with defined deliverables and retrospectives
- **Kanban board** for visual task tracking and progress visibility
- **Test-Driven Development (TDD)** across frontend and backend
- **Technical spikes** to manage learning curves in new technologies
- **Peer code reviews** on all pull requests before merging
- **GitHub Actions CI/CD** for automated testing, linting, and deployment
- **Daily stand-ups** on Discord to surface blockers early
- **Weekly tech-shares** where team members demo newly learned patterns

---

## Contributing

1. Create a branch off `feature/FrontEnd` or `dev` depending on your task
2. Make your changes
3. Run `npm run lint` and `npm run test:run` — both must pass
4. Open a Pull Request with a clear description
5. Wait for at least one teammate to review and approve before merging

---

## Contact

📧 [devnexus28@gmail.com](mailto:devnexus28@gmail.com)

---

<div align="center">
  <sub>Built by DevNexus · University of Pretoria · COS301 Capstone 2026</sub>
</div>
