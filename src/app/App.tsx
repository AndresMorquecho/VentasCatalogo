import { AppQueryProvider } from './providers/QueryProvider'
import { AppRouter } from './routers/AppRouter'
import { AuthProvider } from '@/shared/auth'

export default function App() {
    return (
        <AppQueryProvider>
            <AuthProvider>
                <AppRouter />
            </AuthProvider>
        </AppQueryProvider>
    )
}
