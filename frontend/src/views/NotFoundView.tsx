import { useNavigate } from 'react-router-dom';
import ErrorScreen from '../components/ErrorScreen';
import { queryClient } from '../api/queryClient';
import { roleHome } from '../data/routes';
import { useAuthStore } from '../store/useAuthStore';

export default function NotFoundView() {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);

    return (
        <ErrorScreen
            kind='not-found'
            onReturnToDashboard={() =>
                navigate(user ? roleHome[user.role] : '/')
            }
            onRetry={() => {
                queryClient.invalidateQueries();
                navigate(0);
            }}
        />
    );
}
