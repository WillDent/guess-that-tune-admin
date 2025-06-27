-- Function to promote a user to admin based on email
-- This should be called by the application when NEXT_PUBLIC_SUPER_ADMIN_EMAIL matches

CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    affected_rows INT;
BEGIN
    UPDATE public.users 
    SET role = 'admin'
    WHERE email = user_email AND role = 'user';
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    -- Log the promotion
    IF affected_rows > 0 THEN
        INSERT INTO public.activity_logs (user_id, action_type, details)
        SELECT id, 'ADMIN_PROMOTED', jsonb_build_object('promoted_by', 'system', 'reason', 'super_admin_env_var')
        FROM public.users
        WHERE email = user_email;
        
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;