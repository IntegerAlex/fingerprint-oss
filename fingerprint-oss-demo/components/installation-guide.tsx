"use client"

import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function InstallationGuide() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <section id="guide" className="my-16">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-primary mb-4">Installation Guide</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Get started with `fingerprint-oss` in just a few steps
        </p>
      </div>

      <Card className="p-6 bg-card border-border shadow-lg">
        <Tabs defaultValue="npm">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="npm">npm</TabsTrigger>
            <TabsTrigger value="pnpm">pnpm</TabsTrigger>
          </TabsList>

          <TabsContent value="npm">
            <div className="bg-secondary text-secondary-foreground p-4 rounded-md relative group">
              <pre className="font-mono text-sm overflow-x-auto">
                <code>npm install fingerprint-oss@latest</code>
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard("npm install fingerprint-oss@latest")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="pnpm">
            <div className="bg-secondary text-secondary-foreground p-4 rounded-md relative group">
              <pre className="font-mono text-sm overflow-x-auto">
                <code>pnpm install fingerprint-oss@latest</code>
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard("pnpm install fingerprint-oss@latest")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">Usage Example</h3>
          <div className="bg-secondary text-secondary-foreground p-4 rounded-md relative group">
            <pre className="font-mono text-sm overflow-x-auto">
              <code>{`import userInfo from 'fingerprint-oss';

const fetchFingerprint = async () => {
  const data = await userInfo();
  console.log(data); // Contains visitor ID, device info, etc.
};`}</code>
            </pre>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() =>
                copyToClipboard(`import userInfo from 'fingerprint-oss';

const fetchFingerprint = async () => {
  const data = await userInfo();
  console.log(data); // Contains visitor ID, device info, etc.
};`)
              }
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </section>
  )
}

