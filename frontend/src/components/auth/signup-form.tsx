import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Label } from "../ui/label"


const signUpSchema = z.object({
  firstname: z.string().min(1,"First name is required"),
  lastname: z.string().min(1,"Last name is required"),
  username: z.string().min(3," Username is at least 3 characters long"),
  email: z.email("Invalid email address"),
  password: z.string().min(6,"Password is at least 6 characters long"),

});

type SignUpFormValues = z.infer<typeof signUpSchema>


export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

 const {register, handleSubmit, formState:{errors, isSubmitting}} = useForm<SignUpFormValues>({
  resolver: zodResolver(signUpSchema),
});

const onSubmit = async (data: SignUpFormValues) => {
  // Handle form submit logic here
}
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-border">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit = {handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col items-center text-center gap-2">
              <a href="/" className="block mx-auto w-fit text-center">
              <img src="/logo.svg" alt="logo" />
              </a>
              <h1 className="text-auto font-bold">Create Chime account</h1>
              <p className="text-muted-foreground text-balance">Welcome! Sign up to get started</p>
            </div>
            {/*Full Name*/}
            <div className="grid grid-cols-2 gap-3 ">
              <div className="space-y-2 ">
                <Label htmlFor="lastname" className="block text-sm">Last Name</Label>
                <Input type="text" id="lastname" {...register("lastname")}/>
                {/*todo: add validation message*/}
                {errors.lastname && (<p className="text-destructive text-sm">{errors.lastname.message}</p>)}
              </div>
              <div className="space-y-2 ">
                <Label htmlFor="firstname" className="block text-sm">First Name</Label>
                <Input type="text" id="firstname" {...register("firstname")}/>
                {/*todo: add validation message*/}
                {errors.firstname && (<p className="text-destructive text-sm">{errors.firstname.message}</p>)}
              </div>
            </div>
            {/*Username*/}
            <div className="flex flex-col gap-3">
                <Label htmlFor="username" className="block text-sm">Username</Label>
                <Input type="text"id="username" placeholder="chime" {...register("username")}/>
                {/*todo: add validation message*/}
                {errors.username && (<p className="text-destructive text-sm">{errors.username.message}</p>)}
              </div>
            {/* Email */}
             <div className="flex flex-col gap-3">
                <Label htmlFor="email" className="block text-sm">Email</Label>
                <Input type="text" id="email" placeholder="example@gmail.com" {...register("email")}/>
                {/*todo: add validation message*/}
                {errors.email && (<p className="text-destructive text-sm">{errors.email.message}</p>)}
              </div>
            {/* Password */}
             <div className="flex flex-col gap-3">
                <Label htmlFor="password" className="block text-sm">Password</Label>
                <Input type="password" id="password" {...register("password")}/>
                {/*todo: add validation message*/}
                {errors.password && (<p className="text-destructive text-sm">{errors.password.message}</p>)}
              </div>
            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled= {isSubmitting}>Create an account</Button>
            <div className="text-center text-sm">
              Already have an account? {""}
              <a href="/signup" className="underline underline-offset-4 text-blue-900">Sign in</a>
            </div>
          </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="/placeholderSignUp.png"
              alt="Image"
              className="absolute top-1/2 -translate-y-1/2 object-cover"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-xs text-balance px-6 text-center *:[a]:hover:text-primary text-muted-foreground *:[a]:underline-offset-4 ">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
