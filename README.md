# React Redux Toolkit Sample App

This repository contains a small React application bootstrapped with Create React App and
augmented with Redux Toolkit for state management. It demonstrates a clean, feature-based
folder structure that is easy to expand and maintain.

> **Note:** this README replaces the default CRA content with project-specific guidance.

---

## Prerequisites

* Node.js 18+ (LTS) or later
* npm 8+ (comes with Node.js) or yarn if you prefer

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment variables**
   - Copy `.env.example` to `.env.local` (this file is ignored by git) and adjust values
     such as `REACT_APP_WEATHER_URL`.

3. **Run in development mode**
   ```bash
   npm start
   ```
   The app will be available at <http://localhost:3000> by default.

4. **Create a production build**
   ```bash
   npm run build
   ```
   Output appears in the `build/` directory.

5. **Run tests**
   ```bash
   npm test
   ```
   Press `a` to run all tests. Add new tests alongside new features.

6. **Linting & formatting**
   - For convenience you can add scripts to `package.json`:
     ```json
     "lint": "react-scripts lint",
     "format": "prettier --write \"src/**/*.{js,jsx}\"",
     ```
   - Install and configure ESLint/Prettier as needed or rely on CRA's built-in config.
   - A `pre-commit` hook via [husky](https://typicode.github.io/husky/) can run lint-staged.

---

## Project Layout

```text
src/
├── components/      # reusable presentational components
├── features/        # Redux "ducks" (slice + related logic)
├── services/        # API requests and helper utilities
├── store.js         # Redux store configuration
├── App.js           # top-level component
└── index.js         # application entry point
```

Each feature slice exports its reducers, actions, and async thunks; plug it into `store.js` to
include it in the global state.

---

## State Management Tips

* Keep Redux state serializable. Do not store functions or promises.
* Use `createAsyncThunk` for side effects like network requests.
* Track loading/error status alongside data (`status`, `error`).

Example slice file: `src/features/weather.js`.

---

## Production & Expansion

* Use environment variables for endpoints; the app already reads
  `REACT_APP_WEATHER_URL`.
* Write unit tests for reducers and async logic. The testing stack includes
  [@testing-library/react](https://testing-library.com/docs/react-testing-library/).
* Add new features under `src/features/` and extend `store.js`.
* Consider CI (GitHub Actions / Travis CI) to automate `npm test` and `npm lint`.
* Use Docker or other containerization for consistent deployment if needed.
* When ready, you can `eject` CRA or migrate to a custom build setup for advanced
  configuration, but the current setup works well for most small‑to‑mid projects.

---

Happy coding!  🚀

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
