# 📍 Poverty Hotspot Identification System — Telangana

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-2.0+-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![React Native](https://img.shields.io/badge/React_Native-Expo-0081CB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-ML-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

An intelligent full-stack ecosystem leveraging **Explainable AI (XAI)** to identify, predict, and visualize socio-economic poverty hotspots across the districts of Telangana, India.

---

## 🌍 Problem Statement & Context
While Telangana is one of India's fastest-growing states, industrialization and environmental challenges (such as **stubble burning** impacts on rural health and crop yields) create localized poverty pockets. Traditional survey data is often static and hard to act upon. 

This system bridges that gap by transforming raw **NFHS-5 (National Family Health Survey)** data into a dynamic, predictive dashboard that helps NGOs and policymakers prioritize interventions where they are needed most.

## 🧠 Machine Learning Methodology
The core of the system is a **two-stage hybrid ML pipeline**:

1.  **Stage 1: Clustering (K-Means)**
    *   **Goal**: Unsupervised labeling of districts.
    *   **Logic**: Using socio-economic indicators (Literacy, Sanitation, Drinking Water, Nutrition), the algorithm clusters districts into three tiers: *High*, *Moderate*, and *Low* Poverty.
2.  **Stage 2: Classification (Random Forest)**
    *   **Goal**: Predictive modeling and Explainability.
    *   **Logic**: A Random Forest classifier is trained on the K-Means labels. It allows the system to predict hotspot status for new data and provides **Feature Importance** scores.
    *   **Explainable AI (XAI)**: The system extracts the "Top Drivers" for every hotspot, telling the user exactly *why* a district was flagged (e.g., "75% contribution from Low Literacy").

---

## ✨ Key Features
*   🗺️ **Interactive Geospatial Dashboard**: A Leaflet-powered map of Telangana with color-coded poverty tiers.
*   📊 **Poverty Sandbox**: A simulation tool to test hypothetical socio-economic changes and predict their impact.
*   🔔 **NGO Alert System**: Automated email notifications via **Resend** when critical thresholds are crossed.
*   💡 **Actionable Insights**: Dynamic mapping of government schemes (like *POSHAN Abhiyaan* or *Mission Bhagiratha*) to specific district needs.
*   📱 **Mobile Field App**: A dedicated React Native app for NGO workers to access data in the field.

---

## 🛠️ Technical Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Python, Flask, Scikit-learn, Pandas, NumPy |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Framer Motion, Recharts |
| **Mobile** | React Native, Expo, Lucide Icons |
| **Services** | Supabase (Auth/DB), Resend (Emails) |

---

## 📂 Project Structure
```text
├── backend/            # Flask API & ML Logic
│   ├── ml/             # Preprocessing & Model scripts
│   ├── models/         # Trained model documentation (.pkl)
│   └── app.py          # API Endpoints
├── frontend/           # React Web Application
│   ├── src/components/ # Shared UI (Glassmorphism)
│   └── src/pages/      # Dashboard Views
├── mobile/             # React Native (Expo) App
├── data/               # NFHS-5 Datasets
└── .gitignore          # Universal exclusion rules
```

---

## 🚀 Local Setup Instructions

### 1. Backend (Flask)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### 2. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

### 3. Mobile (Expo)
```bash
cd mobile
npm install
npx expo start
```

---

## 🔑 Environment Variables
Copy the `.env.example` files in each directory to `.env` and fill in your credentials:

| Variable | Description | Location |
| :--- | :--- | :--- |
| `RESEND_API_KEY` | Resend API Key for emails | `backend/.env` |
| `VITE_SUPABASE_URL` | Supabase Project URL | `frontend/.env` |
| `VITE_SUPABASE_KEY` | Supabase Anon Key | `frontend/.env` |
| `SUPABASE_URL` | Supabase URL for Mobile | `mobile/.env` |

---

## 📸 Screenshots & Demo
*(Place screenshots of the Dashboard, Map, and Mobile App here)*
> **Tip**: Include the Glassmorphism UI and the Radar charts to show off the premium design!

---

## 📜 License
Distributed under the **MIT License**. See `LICENSE` for more information.

Developed by **Haasini Reddy**.
