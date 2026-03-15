import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import News from "@/pages/news";
import Prices from "@/pages/prices";
import Builds from "@/pages/builds";
import { AlertTriangle } from "lucide-react";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/news" component={News} />
            <Route path="/prices" component={Prices} />
            <Route path="/builds" component={Builds} />
            
            {/* 404 Route */}
            <Route>
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20 px-4">
                <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-full mb-6">
                  <AlertTriangle className="w-16 h-16 text-destructive" />
                </div>
                <h2 className="text-4xl font-display font-bold text-white mb-4 tracking-widest uppercase">
                  Sector Not Found
                </h2>
                <p className="text-muted-foreground text-lg max-w-md">
                  The navigational coordinates you requested do not exist in the current database index.
                </p>
              </div>
            </Route>
          </Switch>
        </Layout>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
