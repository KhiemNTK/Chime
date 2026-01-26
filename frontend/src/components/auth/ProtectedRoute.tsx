import { useAuthStore } from '@/stores/useAuthStore'
import { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet } from 'react-router';

const ProtectedRoute = () => {
  const { accessToken, fetchMe, user, loading, refresh } = useAuthStore();
  const [starting, setStarting] = useState(true);
  const isInitialized = useRef(false); // Ref để theo dõi trạng thái init
  
  const init = async () => {
    // if already initialized, return
    if (isInitialized.current) return;
    isInitialized.current = true;
    try {
      //occurs on first load of protected route
      if (!accessToken) {
        await refresh();
      }
      
      const currentToken = useAuthStore.getState().accessToken; 
      if (currentToken && !user) {
        await fetchMe();
      }
    } catch (error) {
      console.error("Auth init failed", error);
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    init();
  }, []);
  
  if (starting || loading) {
    return (<div className="flex h-screen items-center justify-center">Loading ... </div>);
  }


  if (!accessToken) {
    return (
      <Navigate to="/signin" replace />
    )
  }

  return (
    <Outlet></Outlet> // render child routes
  )
};

export default ProtectedRoute