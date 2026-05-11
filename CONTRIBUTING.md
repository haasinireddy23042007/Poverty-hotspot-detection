# Contributing to Poverty Hotspot Identification System

Thank you for your interest in contributing to this project! We welcome contributions from the community to help improve poverty mapping and predictive analytics for Telangana.

## Project Structure

This is a monorepo consisting of three main modules:

1.  **`/backend`**: Flask REST API and Machine Learning pipeline (Python).
2.  **`/frontend`**: React dashboard with geospatial visualizations (Vite).
3.  **`/mobile`**: React Native (Expo) application for field workers.

## How to Contribute

### 1. Reporting Bugs
- Use the GitHub Issues tracker to report bugs.
- Include a clear description of the issue and steps to reproduce it.

### 2. Feature Requests
- Open an issue with the "feature request" tag to suggest new indicators or UI improvements.

### 3. Pull Requests
- Fork the repository.
- Create a new branch (`git checkout -b feature/your-feature`).
- Make your changes in the relevant module directory.
- Ensure you follow the local setup instructions in the root README.
- Submit a pull request with a detailed description of your changes.

## Development Guidelines

- **Backend**: Ensure any new ML models are saved to `backend/ml/model.pkl` and documented in `backend/models/README.md`.
- **Frontend**: Maintain the Glassmorphism design system and use Tailwind CSS v4 for styling.
- **Mobile**: Test on both iOS and Android emulators if possible using Expo.
- **Secrets**: Never commit `.env` files. Always update the `.env.example` if you add new environment variables.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
