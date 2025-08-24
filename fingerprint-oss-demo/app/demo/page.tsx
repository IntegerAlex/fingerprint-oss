"use client";

import BackToTop from "@/components/back-to-top";

/**
 * Demo page that showcases the Back to Top button functionality.
 * Contains enough content to demonstrate scrolling and the button's behavior.
 *
 * @returns The demo page React element.
 */
export default function Demo() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-primary mb-8 text-center">
          Back to Top Button Demo
        </h1>
        
        <div className="max-w-4xl mx-auto space-y-8">
          <section className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-4">Scroll Down to See the Button</h2>
            <p className="text-muted-foreground">
              This page contains enough content to demonstrate the Back to Top button functionality. 
              Scroll down past 300px to see the button appear, then click it to smoothly scroll back to the top.
            </p>
          </section>

          {/* Generate content sections to enable scrolling */}
          {Array.from({ length: 20 }, (_, i) => (
            <section key={i} className="bg-card p-6 rounded-lg border">
              <h3 className="text-xl font-semibold mb-3">Section {i + 1}</h3>
              <p className="text-muted-foreground mb-4">
                This is section {i + 1} of the demo page. It contains sample content to demonstrate 
                scrolling behavior and the Back to Top button functionality.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted p-4 rounded">
                  <h4 className="font-medium mb-2">Feature {i + 1}</h4>
                  <p className="text-sm text-muted-foreground">
                    Description of feature {i + 1} and its benefits for users.
                  </p>
                </div>
                <div className="bg-muted p-4 rounded">
                  <h4 className="font-medium mb-2">Benefit {i + 1}</h4>
                  <p className="text-sm text-muted-foreground">
                    How this feature improves the user experience and workflow.
                  </p>
                </div>
              </div>
            </section>
          ))}

          <section className="bg-primary/10 p-6 rounded-lg border border-primary/20">
            <h2 className="text-2xl font-semibold mb-4 text-primary">You've Reached the Bottom!</h2>
            <p className="text-muted-foreground">
              Congratulations! You've scrolled through all the content. Now you should see the 
              Back to Top button in the bottom-right corner. Click it to smoothly return to the top of the page.
            </p>
          </section>
        </div>
      </div>
      
      {/* The Back to Top button will be visible after scrolling 300px */}
      <BackToTop />
    </div>
  );
}