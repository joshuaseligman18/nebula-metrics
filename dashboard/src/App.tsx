import AppRouter from './components/router/Router'
import NavBar from './components/nav/NavBar'
import { QueryClient, QueryClientProvider } from 'react-query';

function App() {
  const queryClient = new QueryClient();
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <NavBar/>
        <AppRouter/>
      </QueryClientProvider>
    </>
  )
}

export default App
