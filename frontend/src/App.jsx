import { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
 import { ToastContainer } from 'react-toastify';
import supabase from '../core/supabaseClient';
import LoadingScreen from './LoadingScreen';
import InstallAppPrompt from './InstallAppPrompt';
import './css/App.css';

const Login = lazy(() => import('./Login'));
const Dashboard = lazy(() => import('./Dashboard'));
const ProfileOnboarding = lazy(() => import('./ProfileOnboarding'));


const ProtectedRoute = ({ user, loading, children }) => {
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/auth" replace />;
};


const PublicRoute = ({ user, loading, children }) => {
  if (loading) return <LoadingScreen />;
  return !user ? children : <Navigate to="/dashboard" replace />;
};

const ProfileGate = ({ user, session, children }) => {
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileCheckKey, setProfileCheckKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const checkProfile = async () => {
      if (!user?.id) return;

      setIsCheckingProfile(true);
      setProfileError('');

      const { data, error } = await supabase
        .from('userProfile')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error('Error checking user profile:', error);
        setProfileError('Could not check your profile. Please retry.');
        setHasProfile(false);
      } else {
        setHasProfile(Boolean(data));
      }

      setIsCheckingProfile(false);
    };

    checkProfile();

    return () => {
      isMounted = false;
    };
  }, [user?.id, profileCheckKey]);

  if (isCheckingProfile) return <LoadingScreen />;

  if (profileError) {
    return (
      <div className="app-container fade-in">
        <div className="daily-target-card">
          <div className="card-label">PROFILE</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>{profileError}</p>
          <button className="save-btn" onClick={() => setProfileCheckKey(key => key + 1)}>Retry</button>
        </div>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <>
        {children}
        <ProfileOnboarding user={user} session={session} onComplete={() => setHasProfile(true)} />
      </>
    );
  }

  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(prevUser => {
        const newUser = session?.user ?? null;
        if (prevUser?.id === newUser?.id) return prevUser;
        return newUser;
      });
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const navigate = useNavigate();

  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    });
    if (error) {
      console.error('Google sign-in error:', error);
      navigate('/auth', { replace: true });
    }
  };

  return (
    <>
    <Suspense fallback={<LoadingScreen />}>
    <Routes>

      <Route
        path="/auth"
        element={
          <PublicRoute user={user} loading={loading}>
            <Login onLogin={handleGoogleSignIn} />
          </PublicRoute>
        }
      />


      <Route
        path="/dashboard"
        element={
          <ProtectedRoute user={user} loading={loading}>
            <ProfileGate user={user} session={session}>
              <Dashboard user={user} session={session} />
            </ProfileGate>
          </ProtectedRoute>
        }
      />


      <Route
        path="*"
        element={
          loading ? <LoadingScreen /> : <Navigate to={user ? '/dashboard' : '/auth'} replace />
        }
      />
    </Routes>
    </Suspense>
     <InstallAppPrompt />
     <ToastContainer position="top-center" autoClose={2000} />
    </>
  );
}

export default App;
