import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/react-router-v6";
import { Routes, Route } from "react-router-dom";
import { dataProvider } from "./providers/dataProvider";
import { WizardPage } from "./pages/WizardPage";

function App() {
  return (
    <Refine
      dataProvider={dataProvider}
      routerProvider={routerProvider}
      resources={[{ name: "wizard", list: { path: "/", component: WizardPage } }]}
    >
      <Routes>
        <Route path="/" element={<WizardPage />} />
      </Routes>
    </Refine>
  );
}

export default App;
