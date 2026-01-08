# CrewAI Web Platform

A comprehensive web platform for building, managing, and deploying AI agent crews and flows - similar to app.crewai.com.

## Architecture Overview

```
web-platform/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Core configurations
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   ├── workers/        # Background workers
│   │   └── utils/          # Utilities
│   ├── alembic/            # Database migrations
│   └── requirements.txt
│
├── frontend/               # Next.js Frontend
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities
│   │   ├── stores/        # State management
│   │   └── types/         # TypeScript types
│   └── package.json
│
└── docker-compose.yml      # Docker orchestration
```

## Features

### Core Features
- **Crew Studio**: Visual builder for creating and managing AI agent crews
- **Agent Manager**: Configure agents with roles, goals, backstories, tools, and memory
- **Task Manager**: Create and organize tasks with dependencies and outputs
- **Flow Designer**: Visual workflow editor for event-driven flows
- **Tool Library**: Built-in and custom tool management

### Enterprise Features
- **Authentication & RBAC**: Secure user management with role-based access control
- **Team Management**: Collaborate with team members on crews
- **Execution Engine**: Run crews and flows with real-time streaming
- **Traces & Monitoring**: Track execution with detailed traces and metrics
- **Triggers & Webhooks**: Connect external services (Gmail, Slack, etc.)
- **Marketplace**: Share and discover crew templates
- **Environment Management**: Manage deployment environments

## Tech Stack

### Backend
- **FastAPI**: High-performance async Python web framework
- **PostgreSQL**: Primary database
- **Redis**: Caching and message queue
- **Celery**: Background task processing
- **SQLAlchemy**: ORM with async support
- **Alembic**: Database migrations
- **CrewAI**: Core AI agent library

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first CSS
- **Shadcn/UI**: Component library
- **React Flow**: Visual workflow editor
- **Zustand**: State management
- **TanStack Query**: Data fetching

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker (optional)

### Quick Start with Docker

```bash
docker-compose up -d
```

### Manual Setup

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/crewai_platform
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key
OPENAI_API_KEY=your-openai-key
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## License

MIT License
