import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import SetupStatusPage from "@/pages/SetupStatusPage";

/**
 * Phase 1 app shell.
 *
 * Wires up the technology stack (Router, theming) and proves the design
 * tokens render correctly in both themes. Deliberately contains no
 * dashboard pages, CRUD UI, or auth flows — those are Phase 2 scope.
 */
function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SetupStatusPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
