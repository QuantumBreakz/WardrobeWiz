import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type UploadStatus = "idle" | "uploading" | "success" | "error";

interface UploadProgressProps {
  progress: number;
  status: UploadStatus;
  message?: string;
  className?: string;
}

export const UploadProgress = ({
  progress,
  status,
  message,
  className,
}: UploadProgressProps) => {
  if (status === "idle") {
    return null;
  }

  const getStatusIcon = () => {
    switch (status) {
      case "uploading":
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "uploading":
        return "Uploading...";
      case "success":
        return "Upload complete!";
      case "error":
        return "Upload failed";
      default:
        return "";
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          {getStatusText()}
        </CardTitle>
        {message && <CardDescription>{message}</CardDescription>}
      </CardHeader>
      {status === "uploading" && (
        <CardContent>
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-foreground/50 mt-2">{progress}%</p>
        </CardContent>
      )}
    </Card>
  );
};

