# CivicFix - Citizen Reporting Platform

CivicFix is a modern civic engagement platform designed to empower citizens to report, track, and resolve civic issues in their community. Built with Next.js, Supabase, and Leaflet, it provides a seamless experience for reporting problems like potholes, garbage, and water leaks, while offering authorities a dashboard to manage and resolve these issues.

## Features

### For Citizens
- **Report Issues:** Easily submit reports with titles, descriptions, categories, and photos.
- **Geolocation:** Automatically captures the location of the issue using GPS.
- **Real-time Tracking:** Track the status of reported issues (Submitted, In Progress, Resolved).
- **Community Map:** View all reported issues on an interactive map.
- **Gamification:** Earn points and badges for reporting and verifying issues.
- **Verification:** Participate in verifying issues reported by others.

### For Authorities (Admin)
- **Control Room:** A dedicated dashboard to view and manage all reported issues.
- **Status Updates:** Update the status of issues (e.g., from 'Submitted' to 'In Progress' or 'Resolved').
- **Emergency Filtering:** Quickly identify and prioritize emergency reports.
- **Analytics:** View real-time statistics on critical emergencies, pending actions, and resolved cases.

## Tech Stack

- **Frontend:** Next.js (React), Tailwind CSS, Framer Motion
- **Backend/Database:** Supabase (PostgreSQL, Auth, Storage)
- **Maps:** Leaflet, React-Leaflet, OpenStreetMap
- **Language:** JavaScript / TypeScript

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Supabase project

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd civic-fix
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file in the root directory and add your Supabase credentials:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/app/`: Main application code (Next.js App Router).
  - `page.js`: Landing page.
  - `dashboard/`: User dashboard.
  - `admin/`: Admin dashboard (Authority Control Room).
  - `community/`: Community feed and map.
  - `track/`: User's reported issues tracking.
  - `profile/`: User profile and settings.
  - `rewards/`: Gamification and achievements.
  - `login/` & `signup/`: Authentication pages.
  - `components/`: Reusable UI components (Report Modal, Map, Nav).

## Usage

1.  **Sign Up:** Create a 'Citizen' account to start reporting.
2.  **Report:** Use the "Report" button on the dashboard to submit a new issue.
3.  **Track:** Monitor the progress of your reports in the "Track" section.
4.  **Community:** Visit the "Community" tab to see issues reported by others and verify them.
5.  **Admin Access:** Users with the 'admin' role can access the `/admin` route to manage issues.

## License

This project is licensed under the MIT License.
