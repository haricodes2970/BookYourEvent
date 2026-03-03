import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GoogleAuthSuccess = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const processed = useRef(false);

    useEffect(() => {
        if (processed.current) return;
        processed.current = true;

        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const user = params.get('user');

        if (token && user) {
            try {
                const parsedUser = JSON.parse(decodeURIComponent(user));
                login(parsedUser, token);

                if (parsedUser.role === 'venueOwner') navigate('/owner/dashboard');
                else if (parsedUser.role === 'admin') navigate('/admin/dashboard');
                else navigate('/booker/dashboard');

            } catch (err) {
                console.error('Parse error:', err);
                navigate('/login?error=google_failed');
            }
        } else {
            navigate('/login?error=google_failed');
        }
    }, []);

    return (
        <div className="h-screen flex items-center justify-center"
            style={{ background: 'linear-gradient(180deg, #c8e6f0 0%, #f0e8d5 100%)' }}>
            <div className="text-center">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-slate-600 font-medium">Signing you in with Google...</p>
            </div>
        </div>
    );
};

export default GoogleAuthSuccess;