import { useNavigate } from 'react-router-dom';
import ErrorScreen from '../components/ErrorScreen';
import { queryClient } from '../api/queryClient';
import { homeForUser } from '../data/routes';
import { useAuthStore } from '../store/useAuthStore';

export default function NotFoundView() {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);

    return (
        <ErrorScreen
            kind='not-found'
            onReturnToDashboard={() =>
                navigate(homeForUser(user))
            }
            onRetry={() => {
                queryClient.invalidateQueries();
                navigate(0);
            }}
        />
    );
}
