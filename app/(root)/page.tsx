"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { CheckIcon, MountainIcon, UsersIcon, ZapIcon, ShieldCheckIcon, StarIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Image from "next/image"

export default async function LandringPage() {

    const { data: { user} } = await supabase.auth.getUser()
  


  return (
    <div className="flex flex-col min-h-[100dvh]">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link href="#" className="flex items-center justify-center gap-2" prefetch={false}>
          <MountainIcon className="h-6 w-6" />
          <h1 className="uppercase text-sm font-semibold">Scheduling Online</h1>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="#features" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Features
          </Link>
          <Link
            href="#testimonials"
            className="text-sm font-medium hover:underline underline-offset-4"
            prefetch={false}
          >
            Testimonials
          </Link>
          <Link href="#pricing" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Pricing
          </Link>
          <Link href="#contact" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Contact
          </Link>
        </nav>
        { user ? 

          <>
            <Button asChild variant="default" className="ml-4">
              <Link href="/login" prefetch={false}>
                login
              </Link>
            </Button>
            <Button asChild variant="outline" className="ml-4">
              <Link href="#signup" prefetch={false}>
                Sign Up
              </Link>
            </Button>
          </>
          :
            <Button asChild variant="default" className="ml-4">
              <Link href="/dashboard" prefetch={false}>
                Dashboard
              </Link>
            </Button>
        }
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_550px] lg:gap-12 xl:grid-cols-[1fr_650px] items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Streamline Your Workflow, Amplify Your Success
                  </h1>
                  <p className="max-w-[600px] text-gray-300 md:text-xl">
                    Unlock peak productivity with StreamLine, the all-in-one solution designed to simplify complex tasks
                    and boost team collaboration.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button
                    asChild
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Link href="#signup" prefetch={false}>
                      Get Started Free
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 text-white hover:text-gray-900"
                  >
                    <Link href="#features" prefetch={false}>
                      Learn More
                    </Link>
                  </Button>
                </div>
              </div>
              <Image
                src="/placeholder.svg?height=550&width=650"
                width="650"
                height="550"
                alt="Hero Image"
                className="mx-auto aspect-[16/9] overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Powerful Features for Modern Teams</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  StreamLine provides everything you need to manage projects, collaborate seamlessly, and achieve your
                  goals faster.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 py-12">
              <Card className="flex flex-col items-center text-center p-6">
                <ZapIcon className="h-10 w-10 text-primary mb-4" />
                <CardTitle className="text-xl font-bold mb-2">Automated Workflows</CardTitle>
                <CardDescription>
                  Automate repetitive tasks and streamline your processes for maximum efficiency.
                </CardDescription>
              </Card>
              <Card className="flex flex-col items-center text-center p-6">
                <UsersIcon className="h-10 w-10 text-primary mb-4" />
                <CardTitle className="text-xl font-bold mb-2">Seamless Collaboration</CardTitle>
                <CardDescription>
                  Work together effortlessly with real-time communication and shared workspaces.
                </CardDescription>
              </Card>
              <Card className="flex flex-col items-center text-center p-6">
                <ShieldCheckIcon className="h-10 w-10 text-primary mb-4" />
                <CardTitle className="text-xl font-bold mb-2">Robust Security</CardTitle>
                <CardDescription>
                  Keep your data safe with enterprise-grade security features and compliance.
                </CardDescription>
              </Card>
              <Card className="flex flex-col items-center text-center p-6">
                <StarIcon className="h-10 w-10 text-primary mb-4" />
                <CardTitle className="text-xl font-bold mb-2">Intuitive Analytics</CardTitle>
                <CardDescription>
                  Gain valuable insights with easy-to-understand dashboards and reports.
                </CardDescription>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">What Our Customers Say</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Hear from businesses that have transformed their operations with StreamLine.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 lg:grid-cols-3 py-12">
              <Card className="p-6">
                <CardContent className="text-lg italic text-center">
                  &quot;StreamLine has revolutionized how our team collaborates. We&apos;ve seen a significant boost in
                  productivity.&quot;
                </CardContent>
                <CardFooter className="text-sm font-semibold text-center mt-4">
                  - Jane Doe, CEO of InnovateCo
                </CardFooter>
              </Card>
              <Card className="p-6">
                <CardContent className="text-lg italic text-center">
                  &quot;The automation features are a game-changer. StreamLine saves us hours every week.&quot;
                </CardContent>
                <CardFooter className="text-sm font-semibold text-center mt-4">
                  - John Smith, Project Manager at GlobalTech
                </CardFooter>
              </Card>
              <Card className="p-6">
                <CardContent className="text-lg italic text-center">
                  &quot;Intuitive, powerful, and incredibly reliable. StreamLine is an essential tool for our growing
                  business.&quot;
                </CardContent>
                <CardFooter className="text-sm font-semibold text-center mt-4">
                  - Emily White, Founder of CreativeHub
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Flexible Plans for Every Team</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Choose the plan that best fits your needs and scale as your team grows.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 lg:grid-cols-3 py-12">
              <Card className="flex flex-col justify-between p-6">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold">Basic</CardTitle>
                  <CardDescription>Ideal for individuals and small teams getting started.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-4xl font-bold mb-4">
                    $19<span className="text-lg text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />5 Users
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Basic Workflow Automation
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Email Support
                    </li>
                  </ul>
                </CardContent>
                <CardFooter className="pt-6">
                  <Button className="w-full">Choose Basic</Button>
                </CardFooter>
              </Card>
              <Card className="flex flex-col justify-between p-6 border-2 border-primary shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold">Pro</CardTitle>
                  <CardDescription>Perfect for growing teams needing advanced features.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-4xl font-bold mb-4">
                    $49<span className="text-lg text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      20 Users
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Advanced Workflow Automation
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Priority Support
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Custom Integrations
                    </li>
                  </ul>
                </CardContent>
                <CardFooter className="pt-6">
                  <Button className="w-full">Choose Pro</Button>
                </CardFooter>
              </Card>
              <Card className="flex flex-col justify-between p-6">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold">Enterprise</CardTitle>
                  <CardDescription>Tailored for large organizations with specific needs.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-4xl font-bold mb-4">Custom</div>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Unlimited Users
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Dedicated Account Manager
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      On-premise Deployment
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      24/7 Premium Support
                    </li>
                  </ul>
                </CardContent>
                <CardFooter className="pt-6">
                  <Button className="w-full">Contact Sales</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* Final Call-to-Action Section */}
        <section id="signup" className="w-full py-12 md:py-24 lg:py-32 border-t">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Ready to Streamline Your Success?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join thousands of teams who are already boosting their productivity with StreamLine. Sign up today!
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <form className="flex gap-2">
                <Input type="email" placeholder="Enter your email" className="max-w-lg flex-1" />
                <Button type="submit">Sign Up</Button>
              </form>
              <p className="text-xs text-muted-foreground">
                By signing up, you agree to our{" "}
                <Link href="#" className="underline underline-offset-2" prefetch={false}>
                  Terms &amp; Conditions
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} StreamLine Inc. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Contact
          </Link>
        </nav>
        <div className="flex gap-4 mt-2 sm:mt-0">
          <Link href="#" className="text-muted-foreground hover:text-primary" prefetch={false}>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33V22C18.343 21.128 22 16.991 22 12z"
                clipRule="evenodd"
              />
            </svg>
            <span className="sr-only">Facebook</span>
          </Link>
          <Link href="#" className="text-muted-foreground hover:text-primary" prefetch={false}>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8.29 20.251c-1.094.372-2.238.62-3.426.624C3.74 20.875 2 19.135 2 17.06c0-1.61.994-2.98 2.37-3.54.994-.37 2.03-.56 3.104-.56.994 0 1.988.19 2.982.56.994.37 1.888.93 2.678 1.68.79.75 1.384 1.68 1.77 2.76.386 1.08.578 2.23.578 3.42 0 2.075-1.74 3.815-3.814 3.815-1.188 0-2.332-.248-3.426-.62zM12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10S17.523 2 12 2zm5.415 6.858c-.83-.08-1.66-.12-2.49-.12-1.094 0-2.188.19-3.282.56-.994.37-1.888.93-2.678 1.68-.79.75-1.384 1.68-1.77 2.76-.386 1.08-.578 2.23-.578 3.42 0 2.075-1.74 3.815-3.814 3.815-1.188 0-2.332-.248-3.426-.62z" />
            </svg>
            <span className="sr-only">Twitter</span>
          </Link>
          <Link href="#" className="text-muted-foreground hover:text-primary" prefetch={false}>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.477 2 12c0 4.419 2.865 8.169 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.116-4.555-4.949 0-1.092.39-1.983 1.029-2.675-.103-.253-.446-1.266.098-2.64 0 0 .84-.268 2.75 1.022A9.607 9.607 0 0112 6.844c.85.004 1.70.115 2.5.324 1.909-1.29 2.747-1.022 2.747-1.022.546 1.373.202 2.387.099 2.64.64.692 1.028 1.583 1.028 2.675 0 3.845-2.334 4.691-4.566 4.939.359.307.678.915.678 1.846 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10 10 0 0022 12c0-5.523-4.477-10-10-10z"
                clipRule="evenodd"
              />
            </svg>
            <span className="sr-only">GitHub</span>
          </Link>
        </div>
      </footer>
    </div>
  )
}
