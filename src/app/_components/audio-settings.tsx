import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Volume2 } from "lucide-react";

export interface AudioSettings {
  roundStart: string;
  roundEnd: string;
  restStart: string;
  restEnd: string;
  sessionComplete: string;
}

interface AudioSettingsProps {
  settings: AudioSettings;
  onSettingsChange: (settings: AudioSettings) => void;
}

export function AudioSettings({
  settings,
  onSettingsChange,
}: AudioSettingsProps) {
  const [audioFiles, setAudioFiles] = useState<Record<string, string>>({});

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    key: keyof AudioSettings,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const audioUrl = e.target?.result as string;
      setAudioFiles((prev) => ({ ...prev, [key]: audioUrl }));
      onSettingsChange({ ...settings, [key]: audioUrl });
    };
    reader.readAsDataURL(file);
  };

  const playAudio = (url: string) => {
    const audio = new Audio(url);
    audio.play();
  };

  const renderAudioControl = (key: keyof AudioSettings, label: string) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => handleFileUpload(e, key)}
          className="flex-1"
        />
        {audioFiles[key] && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => playAudio(audioFiles[key])}
          >
            Test
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Audio Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderAudioControl("roundStart", "Round Start Sound")}
        {renderAudioControl("roundEnd", "Round End Sound")}
        {renderAudioControl("restStart", "Rest Start Sound")}
        {renderAudioControl("restEnd", "Rest End Sound")}
        {renderAudioControl("sessionComplete", "Session Complete Sound")}
      </CardContent>
    </Card>
  );
}
