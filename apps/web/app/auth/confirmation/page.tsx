"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

export default function ConfirmationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-white px-4">
      <div className="w-full max-w-md">
        <Card className="border-amber-100 shadow-lg">
          <CardHeader className="space-y-1 bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Check Your Email</CardTitle>
            <CardDescription className="text-center">
              We've sent a confirmation link to your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 text-center">
            <p className="mb-4">
              Please check your inbox and click on the confirmation link to complete your registration.
            </p>
            <p className="text-sm text-gray-500">If you don't see the email, check your spam folder or try again.</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/auth/sign-in">
              <Button variant="outline" className="mr-2">
                Back to Sign In
              </Button>
            </Link>
            <Link href="/">
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                Go to Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
