import { Refine } from "@refinedev/core";
import routerProvider, { RefineRoutes } from "@refinedev/react-router-v6";
import { dataProvider } from "./providers/dataProvider";
import { WizardPage } from "./pages/WizardPage";

function App() {
  return (
    <Refine
      dataProvider={dataProvider}
      routerProvider={routerProvider}
      resources={[{ name: "wizard", list: { path: "/", component: WizardPage } }]}
    >
      <RefineRoutes />
    </Refine>
  );
}

export default App;
