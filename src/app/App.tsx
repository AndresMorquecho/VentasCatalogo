import { AppQueryProvider } from './providers/QueryProvider'
import { AppRouter } from './routers/AppRouter'

export default function App() {
    return (
        <AppQueryProvider>
            <AppRouter />
        </AppQueryProvider>
    )
}
