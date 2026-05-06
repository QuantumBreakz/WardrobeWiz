import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StyleQuestionnaire } from "@/components/style/StyleQuestionnaire";
import { StylePreferencesForm } from "@/components/style/StylePreferencesForm";
import type { StylePreferences, StyleQuestionnaireResponse } from "@/types/style";
import { toast } from "sonner";

const Settings = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Settings & preferences</h1>
        <p className="text-foreground/50 mt-2">
          These forms are purely frontend for now—hook them to APIs later when auth and backend are ready.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-foreground/10 rounded-none bg-foreground/20 backdrop-blur-md transition-colors">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Update your basic profile details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Full name" defaultValue="Admin User" />
            <Input placeholder="Email" defaultValue="admin@wardrobewiz.dev" />
            <Button className="w-full sm:w-auto">Save profile</Button>
          </CardContent>
        </Card>

        <Card className="border-foreground/10 rounded-none bg-foreground/20 backdrop-blur-md transition-colors">
          <CardHeader>
            <CardTitle>Measurements</CardTitle>
            <CardDescription>wardrobewiz references these numbers for fit-aware suggestions.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Height" defaultValue={`5'9"`} />
            <Input placeholder="Weight" defaultValue="72 kg" />
            <Input placeholder="Collar" defaultValue={`15.5"`} />
            <Input placeholder="Waist" defaultValue={`32"`} />
            <Input placeholder="Inseam" defaultValue={`30"`} />
            <Input placeholder="Shoe size" defaultValue="42 EU" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-foreground/10 rounded-none bg-foreground/20 backdrop-blur-md transition-colors">
        <CardHeader>
          <CardTitle>Notification preferences</CardTitle>
          <CardDescription>Toggle the nudges you care about.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { id: "looks", label: "New outfit drops", description: "Daily email when fresh combos are ready." },
            { id: "sustainability", label: "Sustainability reminders", description: "Weekly note on rewear stats." },
            { id: "alerts", label: "Weather alerts", description: "SMS when weather conflicts with planned outfits." },
          ].map((pref) => (
            <div key={pref.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{pref.label}</p>
                <p className="text-sm text-foreground/50">{pref.description}</p>
              </div>
              <Switch id={pref.id} defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-foreground/10 rounded-none bg-foreground/20 backdrop-blur-md transition-colors">
        <CardHeader>
          <CardTitle>Style cues</CardTitle>
          <CardDescription>Add reminders so the AI keeps your vibe intact.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea placeholder="E.g. Avoid wool layers during daytime meetings." />
          <Button variant="secondary" className="w-full sm:w-auto">
            Save cue
          </Button>
        </CardContent>
      </Card>

      <Card className="border-foreground/10 rounded-none bg-foreground/20 backdrop-blur-md transition-colors">
        <CardHeader>
          <CardTitle>Style Profiling</CardTitle>
          <CardDescription>
            Complete the style questionnaire to help wardrobewiz understand your preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="questionnaire" className="w-full">
            <TabsList>
              <TabsTrigger value="questionnaire">Questionnaire</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>
            <TabsContent value="questionnaire">
              <StyleQuestionnaire
                steps={[
                  {
                    id: "color-preference",
                    title: "Color Preferences",
                    question: "What colors do you prefer in your wardrobe?",
                    type: "multiple-choice",
                    options: ["Neutral", "Bold", "Pastel", "Dark", "Light", "Mixed"],
                    required: true,
                  },
                  {
                    id: "style-aesthetic",
                    title: "Style Aesthetic",
                    question: "Which style aesthetics resonate with you?",
                    type: "multi-select",
                    options: ["Minimalist", "Classic", "Casual", "Formal", "Bohemian", "Streetwear"],
                    required: true,
                  },
                ]}
                onComplete={(responses, preferences) => {
                  toast.success("Style profile saved!");
                  console.log("Questionnaire responses:", responses);
                  console.log("Style preferences:", preferences);
                }}
              />
            </TabsContent>
            <TabsContent value="preferences">
              <StylePreferencesForm
                preferences={{
                  colors: {
                    primary: [],
                    secondary: [],
                    accent: [],
                  },
                  aesthetics: [],
                  fit: "Regular",
                }}
                onChange={(preferences) => {
                  toast.success("Preferences updated!");
                  console.log("Updated preferences:", preferences);
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;

