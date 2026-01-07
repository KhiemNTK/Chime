import Logout from "@/components/auth/logout";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";

export const ChatAppPage = () => {
  const handleOnClick = async () => {
    try {
      await api.get("/users/test", { withCredentials: true });
      toast.success("Test endpoint called successfully");
    } catch (error) {
      toast.error("Error calling test endpoint");
      console.error(error);
    }
  };
  const user = useAuthStore((s) => s.user);
  return (
    <div>
      {user?.username}
      <Logout />

      <Button onClick={handleOnClick}>
        Test
      </Button>
    </div>
  );
};

export default ChatAppPage;
