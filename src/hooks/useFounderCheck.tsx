import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useFounderCheck = () => {
  const { user } = useAuth();
  const [isFounder, setIsFounder] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFounderRole = async () => {
      if (!user) {
        setIsFounder(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "founder")
          .maybeSingle();

        if (error) {
          console.error("Error checking founder role:", error);
          setIsFounder(false);
        } else {
          setIsFounder(!!data);
        }
      } catch (err) {
        console.error("Error in founder check:", err);
        setIsFounder(false);
      } finally {
        setLoading(false);
      }
    };

    checkFounderRole();
  }, [user]);

  return { isFounder, loading };
};
