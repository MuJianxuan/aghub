import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Router, Route, Switch } from "wouter";
import { SettingsLayout } from "./layouts/settings-layout";
import HomePage from "./pages/home";
import SkillsPage from "./pages/settings/skills";
import MCPServersPage from "./pages/settings/mcp-servers";
import CustomAgentsPage from "./pages/settings/custom-agents";

function App() {
  useEffect(() => {
    invoke<number>("start_server").catch(console.error);
  }, []);

  return (
    <Router>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/settings/skills">
          <SettingsLayout><SkillsPage /></SettingsLayout>
        </Route>
        <Route path="/settings/mcp-servers">
          <SettingsLayout><MCPServersPage /></SettingsLayout>
        </Route>
        <Route path="/settings/custom-agents">
          <SettingsLayout><CustomAgentsPage /></SettingsLayout>
        </Route>
        <Route>
          <SettingsLayout><SkillsPage /></SettingsLayout>
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
