# Drug Management and Interaction Checker System

This project is a demo application designed to provide drug management and interaction checking features. It utilizes a modern tech stack with **React**, **TypeScript**, **Vite**, and **Tailwind CSS** for the frontend, and **Node.js**, **Express**, and **PostgreSQL** for the backend. The target users are primarily medical professionals (e.g., doctors, pharmacists) but can also be used by anyone interested in drug interaction research.

> **Note:** Missing or uncertain details are marked as "TBD" or "Unavailable" in this document.

---

## Table of Contents
1. [Project Introduction](#project-introduction)
2. [Features](#features)
3. [Directory Structure](#directory-structure)
4. [Installation & Usage](#installation--usage)
5. [API Usage](#api-usage)
6. [Testing & Deployment](#testing--deployment)
7. [Contribution](#contribution)
8. [License](#license)
9. [FAQ](#faq)

---

## Project Introduction

The system aims to facilitate drug-related management and interaction checks, including:
- Querying drug information (e.g., name, indications, contraindications).
- Checking potential interactions between multiple drugs.

Use cases include:
- Assisting medical institutions in checking interactions before prescribing medications.
- Acting as a research tool for drug interaction studies.

---

## Features

1. **Drug Information Query**  
   - Display drug details like name, usage, and more in the frontend.
   - Backend APIs to retrieve drug data from the PostgreSQL database.

2. **Drug Interaction Checker**  
   - Accept multiple drug inputs to evaluate potential interactions.
   - Highlight warnings or recommendations based on predefined rules.

3. **Modern Tech Stack**  
   - **Vite** for fast development and bundling.
   - **Tailwind CSS** for responsive UI design.
   - **TypeScript** for robust type safety.

4. **Backend Services**  
   - Built with **Node.js** and **Express** for RESTful APIs.
   - Integrated with **PostgreSQL** for data persistence.

---

## Directory Structure

```plaintext
.
├── README.md                // This documentation
├── package.json             // Dependencies and scripts
├── tsconfig.json            // TypeScript configuration
├── vite.config.ts           // Vite configuration
├── tailwind.config.js       // Tailwind CSS configuration
├── .env                     // Environment variables (if applicable)
├── schema.sql               // Database schema definition (PostgreSQL)
├── server/
│   ├── server.ts            // Backend entry point
│   ├── routes/              // API routes
│   │   ├── drugRoutes.ts    // Routes for drug data
│   │   └── interactionRoutes.ts // Routes for drug interactions
│   └── db/                  // Database configuration files
└── src/
    ├── main.tsx             // Frontend entry point
    ├── App.tsx              // Root component
    ├── components/          // React components
    ├── services/            // Frontend service layer (API calls)
    └── utils/               // Utility functions (e.g., interaction logic)
```

---

## Installation & Usage

### Prerequisites
- **Node.js** (LTS version recommended, e.g., 14+ or 16+)
- **PostgreSQL** (Latest stable version recommended)
- **npm** or **Yarn**

### Clone the Repository
```bash
git clone https://github.com/your-repo/your-project.git
cd your-project
```

### Install Dependencies
```bash
# Using npm
npm install

# Or using Yarn
yarn install
```

### Configure Environment Variables
Create a `.env` file in the root directory for sensitive configurations. Example:
```bash
DATABASE_URL=postgres://username:password@localhost:5432/your_database
PORT=3001
```

### Initialize the Database
Run the following command to apply the database schema:
```bash
psql -U <username> -d <database> -f schema.sql
```

### Start the Development Environment
Start Backend Service:
```bash
npm run start:server
```
The backend typically runs at `http://localhost:3001`.

Start Frontend Development Server:
```bash
npm run dev
```
The frontend is accessible at `http://localhost:5173`.

---

## API Usage

The backend provides RESTful APIs for managing drugs and interactions:

### Drug Data (`drugRoutes.ts`)
- **Endpoints**:
  - `GET /api/drugs`: Fetch all drugs.
  - `GET /api/drugs/:id`: Fetch details of a specific drug.
- **Example**:
  ```bash
  curl http://localhost:3001/api/drugs
  ```

### Drug Interaction (`interactionRoutes.ts`)
- **Endpoints**:
  - `POST /api/interactions`: Check interactions between drugs.
- **Example Request**:
  ```bash
  curl -X POST http://localhost:3001/api/interactions \
  -H "Content-Type: application/json" \
  -d '{"drugs":["drug1","drug2"]}'
  ```

---

## Testing & Deployment

### Testing
- **Tests**: No testing scripts or files (e.g., `__tests__/` or `.spec.ts`) were found. Testing configuration is TBD.
- **Test Coverage**: No tools or reports are configured.

### Deployment
- **Production Deployment**: No deployment scripts or CI/CD pipelines are configured.
- **Containerization**: No Dockerfile or Kubernetes configuration found.
- **Hosting Platform**: Deployment platform details are unavailable.

---

## Contribution

This project currently lacks a formal contribution guide. If you'd like to contribute:
1. Fork the repository.
2. Create a feature branch (e.g., `feature/add-something`).
3. Commit and push your changes.
4. Open a pull request for review.

For questions or issues, feel free to open an issue in the repository.

---

## License
- **License Type**: TBD (No license file found).
- **Third-party dependencies** are managed via `package.json`.

---

## FAQ

### What if the database connection fails?
- Verify `.env` configurations, especially `DATABASE_URL`.
- Ensure PostgreSQL service is running and credentials are correct.

### Why can’t the frontend access backend APIs?
- Check if the backend is running (`http://localhost:3001`).
- Ensure frontend `.env` points to the correct API URL.

### Can this project be used in production?
- This is a demo project and may lack production-grade features like authentication, performance optimization, etc.

### How can I extend the database schema?
- Modify `schema.sql` and add necessary logic in `drugRoutes.ts` or `interactionRoutes.ts`.

For additional questions, raise an issue in the repository.
