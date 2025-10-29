"use client";
import React from "react";
import Link from "next/link";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden">
      
      <nav className="fixed top-0 left-0 z-20 w-full">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="font-heading text-2xl font-bold text-primary dark:text-neutral-100 tracking-wide">
            Pulse
          </h1>
        </div>
      </nav>

      <div className="relative flex flex-col items-center justify-center min-h-screen w-full text-center">
        <BackgroundRippleEffect />

        <div className="relative z-10 px-6 mt-24">
          <h2 className="font-heading text-4xl font-bold leading-tight text-neutral-900 md:text-6xl lg:text-7xl dark:text-neutral-100">
            Write Freely. Feel Deeply. <br />
            <span className="text-primary/90">Let AI Decode Your Emotions</span>
          </h2>

          <p className="font-body mt-6 max-w-2xl mx-auto text-base text-neutral-700 dark:text-neutral-400 md:text-lg">
            A mindful space where your thoughts meet intelligence.  
            Reflect on your emotions, track your mood trends, and  
            let AI craft personalized insights that help you grow.
          </p>

          <div className="mt-10">
            <Link href="/auth/sign-in">
              <Button
                size="lg"
                className="rounded-xl font-semibold text-base px-8 py-5 cursor-pointer"
              >
                Get Started
              </Button>
            </Link>
          </div>  
        </div>
      </div>
    </div>
  );
}
