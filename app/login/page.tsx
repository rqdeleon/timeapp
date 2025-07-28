import { LoginForm } from "@/components/auth/login-form"
import { supabase } from "@/lib/supabase"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  // const { data:{ user }, error } = await supabase.auth.getUser()
  
  // if ( user ) redirect("/dashboard") 

  return <LoginForm />
}
