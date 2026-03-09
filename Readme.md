🛡️ AstraCIT
One Source of Truth. Infinite Institutional Integrity.
AstraCIT is a high-security, unified Resource Planning (ERP) ecosystem designed for Chennai Institute of Technology (CIT) and Chennai Institute of Management (CIM). It replaces fragmented spreadsheets and paper logs with a cryptographically secured digital ledger that tracks assets from the moment of purchase to their final placement on campus.

🚀 Core Features
1. 🔐 The Digital Seal (SHA-256)
Unlike standard databases, AstraCIT utilizes Cryptographic Hashing. Every transaction is linked to the previous one. If a record is manually tampered with in the database, the "Digital Seal" breaks, alerting the Executive Hub immediately.

2. 📊 360° Executive Oversight
A birds-eye view for the Principal and Board. Monitor:
Institutional Value: Live valuation of all campus assets.
Labor Analytics: Real-time attendance and work logs from construction sites.
Procurement Pipeline: Track pending vs. fulfilled Purchase Orders.

3. 📱 Multi-Module Ecosystem
Admin Hub: User management and system-wide recovery alerts.
Stores Dept: QR-based inwarding and automated asset tagging.
HOD Portal: Streamlined requisitions and asset handover tracking.
Construction Suite: Material consumption logs (with auto-reorder triggers) and labor tracking.

4. 🔍 Universal Auditor Portal
A public-facing web interface (Netlify) where auditors can scan any asset's QR code to see its "Digital Birth Certificate"—including its original invoice, vendor, cost, and current owner.

🛠️ Technical Stack
Frontend: React Native (Expo) for Mobile | Vanilla JS for Web Portal
Backend: Google Firebase (Firestore & Storage)
Security: SHA-256 Hashing Algorithm
Charts: React Native Chart Kit (Responsive Analytics)
Deployment: EAS (Android APK) | Netlify (Web)

📂 Project Structure
Plaintext
AstraCIT/
├── src/
│   ├── api/            # Firebase configuration
│   ├── screens/        # Dashboard modules (Admin, HOD, Stores, etc.)
│   ├── components/     # Reusable UI elements
│   └── navigation/     # Stack & Tab Navigators
├── assets/             # Branded logos and icons
├── app.json            # Expo configuration (Version & Package)
└── package.json        # Project dependencies

⚡ Quick Start
Prerequisites
Node.js installed
Expo CLI (npm install -g expo-cli)
EAS CLI (npm install -g eas-cli)

Installation
Clone the repo:

Bash
git clone https://github.com/sujey2007/AstraCIT.git
Install dependencies:

Bash
npm install
Run locally:

Bash
npx expo start
Build updated APK:
Bash
eas build --platform android --profile preview

🏆 Developed By
Team CodeTitans