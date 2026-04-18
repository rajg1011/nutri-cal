import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
 import { ToastContainer } from 'react-toastify';
import supabase from '../core/supabaseClient';
import Login from './Login';
import Dashboard from './Dashboard';
import LoadingScreen from './LoadingScreen';


const ProtectedRoute = ({ user, loading, children }) => {
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/auth" replace />;
};


const PublicRoute = ({ user, loading, children }) => {
  if (loading) return <LoadingScreen />;
  return !user ? children : <Navigate to="/dashboard" replace />;
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
            <Dashboard user={user} session={session} />
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
     <ToastContainer position="top-center" autoClose={2000} />
    </>
  );
}

export default App;
