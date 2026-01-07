import { useAuthStore } from '@/stores/useAuthStore'
import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useState } from 'react';

const ProtectedRoute = () => {
  const { accessToken, fetchMe, user, loading, refresh } = useAuthStore();
  const [ starting, setStarting ] = useState(true);
  
  const init = async () => {
    //occurs on first load of protected route
    if (!accessToken) {
      await refresh();
    }

    if (accessToken && !user) {
      await fetchMe();
    }
    setStarting(false);
  }

    useEffect(() => {
      init();
    }, []);
  
  if (starting || loading) {
    return <div className="flex h-screen items-center justify-center">Loading ... </div>
  }


  if (!accessToken) {
      return (
        <Navigate to="/signin" replace />
      )
    }

  return (
    <Outlet></Outlet> // render child routes
  )
}

export default ProtectedRoute