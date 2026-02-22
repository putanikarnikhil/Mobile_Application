📱 Mobile Application

A scalable and modular React Native mobile application built with TypeScript, following clean architecture principles and organized folder structure for maintainability.

🚀 Overview

This project is a mobile application structured for scalability, maintainability, and performance. The codebase follows modular architecture with separate folders for navigation, services, state management, utilities, and configurations.

📂 Project Structure
src/
│
├── assets/                  # Images, fonts, icons, static files
├── components/              # Reusable UI components
├── config/                  # App configuration & constants
├── lib/                     # Third-party integrations & core setup
├── navigation/              # Navigation stacks, tabs, routes
├── services/                # API calls & external service logic
├── stores/                  # State management (Context/Zustand/Redux)
├── types/                   # TypeScript type definitions & interfaces
├── utils/
│   └── transformations/     # Helper functions & data transformers
│
├── App.tsx                  # Root component
├── AppStyles.ts             # Global styles
├── .env                     # Environment variables
└── .gitignore               # Git ignore rules
🧠 Architecture Highlights

✅ Modular folder structure
✅ Scalable state management
✅ Separation of business logic and UI
✅ Centralized configuration management
✅ Type-safe development using TypeScript
✅ Clean API service layer

🛠 Tech Stack

React Native

TypeScript

React Navigation

Axios / Fetch API

Environment-based configuration

State management (based on stores/ implementation)

⚙️ Installation & Setup
1️⃣ Clone the Repository
git clone https://github.com/putanikarnikhil/Mobile_Application.git
cd Mobile_Application
2️⃣ Install Dependencies
npm install

or

yarn install
3️⃣ Setup Environment Variables

Create a .env file in the root:

API_BASE_URL=your_api_url_here
4️⃣ Run the Application

For development:

npx react-native start

Run on Android:

npx react-native run-android

Run on iOS:

npx react-native run-ios
🧩 Folder Responsibilities
📦 assets/

Stores static files such as images, fonts, and icons.

🧱 components/

Reusable UI components used across screens.

⚙️ config/

App-level configurations, constants, and environment setups.

📚 lib/

Core libraries and third-party integrations setup.

🧭 navigation/

Handles app navigation structure (Stack, Tab, Drawer).

🌐 services/

API communication layer and business logic related to external services.

🗂 stores/

Application state management logic.

🏷 types/

Global TypeScript interfaces and type definitions.

🔄 utils/transformations/

Helper functions and data transformation utilities.

📌 Key Features

Modular architecture

Clean API integration

Organized state management

Type-safe codebase

Production-ready folder structure

🔐 Environment Variables

All sensitive configuration values should be stored in the .env file and not committed to version control.

Example:

API_BASE_URL=https://api.example.com
📦 Build for Production

Android:

cd android
./gradlew assembleRelease

iOS:

cd ios
pod install
🤝 Contributing

Fork the repository

Create your feature branch

Commit your changes

Push and create a Pull Request

👨‍💻 Author

Nikhil Putanikar
GitHub: https://github.com/putanikarnikhil
