"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function SteakNetLanding() {
  const [isNavBlurred, setIsNavBlurred] = useState(false)
  const [stakeAmount, setStakeAmount] = useState("")
  const [receiveAmount, setReceiveAmount] = useState("0")

  const strokeWidth = 9
  const letterSpacing = "-0.02em"

  useEffect(() => {
    const handleScroll = () => {
      setIsNavBlurred(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const amount = Number.parseFloat(stakeAmount) || 0
    setReceiveAmount(amount.toString())
  }, [stakeAmount])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  const howItWorksSteps = [
    {
      step: "Step 1",
      title: "Stake your SOL",
      description:
        "Stake your SOL tokens to start earning rewards. Your SOL stays liquid, giving you the freedom to redeem whenever you want.",
    },
    {
      step: "Step 2",
      title: "Receive STEAKSOL",
      description:
        "When you stake, you receive STEAKSOL, a liquid staking token that grows in value as rewards accumulate every epoch.",
    },
    {
      step: "Step 3",
      title: "Gather Rewards",
      description:
        "Hold STEAKSOL and watch it grow in value every epoch as staking rewards compound automatically. On top of that, every epoch you also earn STEAK, a loyalty reward for SteakNet stakers.",
    },
  ]

  return (
    <div className="min-h-screen bg-background gradient-bg">
      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isNavBlurred ? "backdrop-blur-md bg-background/80" : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={() => scrollToSection("hero")} className="hover:opacity-80 transition-opacity">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Steak.net1x-Tuo4QCIT0JfQUVEOjPseEaUCBUnydb.png"
                  alt="STEAK.NET"
                  className="h-8 md:h-10"
                />
              </button>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection("hero")}
                className="text-foreground hover:text-primary transition-colors font-poppins"
              >
                STAKE
              </button>
              <button
                onClick={() => scrollToSection("steaksol")}
                className="text-foreground hover:text-primary transition-colors font-poppins"
              >
                STEAKSOL
              </button>
              <button
                onClick={() => scrollToSection("steak-token")}
                className="text-foreground hover:text-primary transition-colors font-poppins"
              >
                STEAK
              </button>
              <a href="/docs" className="text-foreground hover:text-primary transition-colors font-poppins">
                DOCS
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-12 items-start">
            <div className="text-left">
              <div className="text-6xl md:text-8xl mb-1">
                <svg
                  viewBox="0 0 800 280"
                  className="w-full h-auto"
                  style={{
                    fontSize: "clamp(3rem, 8vw, 6rem)",
                    fontFamily: "var(--font-steak)",
                    letterSpacing: "-0.02em",
                  }}
                  aria-label="stake your sol with steaksol"
                >
                  <text
                    x="0"
                    y="60"
                    fill="white"
                    stroke="#3a2020"
                    strokeWidth="9"
                    strokeLinejoin="miter"
                    strokeLinecap="butt"
                    strokeMiterlimit="2"
                    paintOrder="stroke"
                    fontFamily="var(--font-steak)"
                    fontSize="114"
                    letterSpacing="-0.02em"
                    dominantBaseline="hanging"
                  >
                    STAKE YOUR SOL
                  </text>
                  <text
                    x="0"
                    y="160"
                    fill="white"
                    stroke="#3a2020"
                    strokeWidth="9"
                    strokeLinejoin="miter"
                    strokeLinecap="butt"
                    strokeMiterlimit="2"
                    paintOrder="stroke"
                    fontFamily="var(--font-steak)"
                    fontSize="114"
                    letterSpacing="-0.02em"
                    dominantBaseline="hanging"
                  >
                    WITH <tspan fill="var(--primary)">STEAKSOL</tspan>
                  </text>
                </svg>
              </div>
              <p className="text-xl md:text-2xl text-muted-foreground mb-2 text-pretty font-poppins">
                Stake SOL → Earn SOL + STEAK
              </p>
              <p className="text-sm md:text-base text-muted-foreground mb-8 text-pretty font-poppins">
                Powered by STEAKSOL
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="text-lg px-8 py-6 font-poppins" onClick={() => scrollToSection("hero")}>
                  Stake SOL
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="text-lg px-8 py-6 font-poppins"
                  onClick={() => scrollToSection("steaksol")}
                >
                  Learn More
                </Button>
              </div>
            </div>
            <div className="w-full lg:flex lg:justify-start">
              <div className="w-full lg:max-w-sm">
                <Card className="glass-card rounded-2xl p-5 bg-card/50 backdrop-blur-sm py-5 px-5 my-11">
                  <CardContent className="p-0 space-y-3">
                    {/* Stake SOL Section */}
                    <div className="space-y-3">
                      <label className="text-sm text-muted-foreground font-medium font-poppins">Stake SOL</label>
                      <div className="bg-background/80 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <input
                            type="number"
                            placeholder="0.0"
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                            className="bg-transparent text-3xl font-bold text-foreground placeholder:text-muted-foreground border-none outline-none w-full font-poppins"
                          />
                          <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                              <span className="text-white text-xs font-bold font-poppins">S</span>
                            </div>
                            <span className="text-foreground font-medium font-poppins">SOL</span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground font-poppins">
                          ~${(Number.parseFloat(stakeAmount) * 200 || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Arrow/Divider */}
                    <div className="flex justify-center py-1">
                      <div className="w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-muted-foreground"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Receive Section */}
                    <div className="space-y-3">
                      <label className="text-sm text-muted-foreground font-medium font-poppins">Receive</label>
                      <div className="bg-background/80 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-3xl font-bold text-foreground font-poppins">{receiveAmount}</div>
                          <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                              <span className="text-white text-xs font-bold font-poppins">S</span>
                            </div>
                            <span className="text-foreground font-medium font-poppins">STEAKSOL</span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground font-poppins">
                          ~${(Number.parseFloat(receiveAmount) * 200 || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Connect Wallet Button */}
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-5 text-lg font-medium rounded-xl font-poppins">
                      Connect Wallet
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-card rounded-2xl">
              <CardContent className="p-8 text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-2 font-poppins">1,234,567</div>
                <div className="text-muted-foreground font-poppins">SOL Staked</div>
              </CardContent>
            </Card>
            <Card className="glass-card rounded-2xl">
              <CardContent className="p-8 text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-2 font-poppins">456</div>
                <div className="text-muted-foreground font-poppins">Epochs Served</div>
              </CardContent>
            </Card>
            <Card className="glass-card rounded-2xl">
              <CardContent className="p-8 text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-2 font-poppins">8,901</div>
                <div className="text-muted-foreground font-poppins">SteakNet Stakers</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What is STEAKSOL Section */}
      <section className="py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div id="steaksol" className="scroll-mt-24 mb-2">
              <svg
                viewBox="0 0 600 120"
                className="w-full h-auto max-w-2xl mx-auto"
                style={{
                  fontSize: "clamp(2rem, 6vw, 4rem)",
                  fontFamily: "var(--font-steak)",
                  letterSpacing: "-0.02em",
                }}
                aria-label="What is STEAKSOL?"
              >
                <text
                  x="300"
                  y="60"
                  fill="white"
                  stroke="#3a2020"
                  strokeWidth="6"
                  strokeLinejoin="miter"
                  strokeLinecap="butt"
                  strokeMiterlimit="2"
                  paintOrder="stroke"
                  fontFamily="var(--font-steak)"
                  fontSize="60"
                  letterSpacing="-0.02em"
                  dominantBaseline="middle"
                  textAnchor="middle"
                >
                  What is <tspan fill="var(--primary)">STEAKSOL</tspan>?
                </text>
              </svg>
            </div>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto text-pretty font-poppins">
              STEAKSOL is your liquid stake in the SteakNet validator. It began 1:1 with SOL, and its exchange rate only
              increases as validator rewards accrue every epoch.
            </p>
          </div>

          <div className="mb-8">
            <div className="text-center mb-8">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatisSteaksolforwebv2-2ibsl5hExOAMpEt1XIQJC8Rur8mlsF.png"
                alt="Stake SOL → STEAKSOL → Earn STEAK flow diagram"
                className="mx-auto max-w-[60%] h-auto"
              />
            </div>

            {/* Responsive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {howItWorksSteps.map((step, index) => (
                <Card key={index} className="glass-card rounded-2xl">
                  <CardContent className="p-8">
                    <div className="inline-block bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium mb-4 font-poppins">
                      {step.step}
                    </div>
                    <h4 className="text-2xl font-bold text-foreground mb-4 font-poppins">{step.title}</h4>
                    <p className="text-muted-foreground text-pretty font-poppins">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What is STEAK Section */}
      <section id="steak-token" className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-2">
            <svg
              viewBox="0 0 500 120"
              className="w-full h-auto max-w-xl mx-auto"
              style={{
                fontSize: "clamp(2rem, 6vw, 4rem)",
                fontFamily: "var(--font-steak)",
                letterSpacing: "-0.02em",
              }}
              aria-label="What is STEAK?"
            >
              <text
                x="250"
                y="60"
                fill="white"
                stroke="#3a2020"
                strokeWidth="6"
                strokeLinejoin="miter"
                strokeLinecap="butt"
                strokeMiterlimit="2"
                paintOrder="stroke"
                fontFamily="var(--font-steak)"
                fontSize="60"
                letterSpacing="-0.02em"
                dominantBaseline="middle"
                textAnchor="middle"
              >
                What is <tspan fill="var(--primary)">STEAK</tspan>?
              </text>
            </svg>
          </div>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto mb-4 text-pretty font-poppins">
            STEAK is the community reward token of SteakNet. Distributed every few epochs alongside staking rewards, it
            aligns incentives with our loyal stakers as we grow the SteakNet ecosystem together.
          </p>
          <div className="mb-4">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatIsSteakForWebv2-Adnx4EhQ0oj64tsc53JZRpmJNYts4x.png"
              alt="STEAK tokens and grilled steaks visual representation"
              className="mx-auto max-w-[60%] h-auto"
            />
          </div>
          <Button variant="secondary" size="lg" asChild>
            <a href="/docs#steak" className="text-lg px-8 py-6 font-poppins">
              Learn more
            </a>
          </Button>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="glass-card rounded-2xl p-12">
            <div className="mb-4">
              <svg
                viewBox="0 0 1200 120"
                className="w-full h-auto max-w-3xl mx-auto"
                style={{
                  fontSize: "clamp(2rem, 6vw, 4rem)",
                  fontFamily: "var(--font-steak)",
                  letterSpacing: "-0.02em",
                }}
                aria-label="Stake Sol. Earn Sol. Earn Steak."
              >
                <text
                  x="600"
                  y="60"
                  fill="white"
                  stroke="#3a2020"
                  strokeWidth="6"
                  strokeLinejoin="miter"
                  strokeLinecap="butt"
                  strokeMiterlimit="2"
                  paintOrder="stroke"
                  fontFamily="var(--font-steak)"
                  fontSize="63"
                  letterSpacing="-0.02em"
                  dominantBaseline="middle"
                  textAnchor="middle"
                >
                  Stake Sol. Earn Sol. Earn <tspan fill="var(--primary)">Steak.</tspan>
                </text>
              </svg>
            </div>
            <Button size="lg" className="text-lg px-8 py-6 font-poppins" onClick={() => scrollToSection("hero")}>
              Swap to STEAKSOL
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-muted-foreground font-poppins">SteakNet © 2025</div>
            <div className="flex flex-wrap justify-center md:justify-end gap-6 text-sm">
              <a
                href="https://discord.gg/steaknet"
                className="text-muted-foreground hover:text-foreground transition-colors font-poppins"
              >
                Discord
              </a>
              <a
                href="https://x.com/steaknet"
                className="text-muted-foreground hover:text-foreground transition-colors font-poppins"
              >
                X (Twitter)
              </a>
              <a
                href="https://t.me/steaknet"
                className="text-muted-foreground hover:text-foreground transition-colors font-poppins"
              >
                Telegram
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-poppins">
                Privacy Policy
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-poppins">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
