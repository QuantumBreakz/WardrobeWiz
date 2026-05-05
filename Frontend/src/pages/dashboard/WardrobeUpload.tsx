import { WardrobeUploadPage } from "@/components/wardrobe/WardrobeUploadPage";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const WardrobeUpload = () => {
  const navigate = useNavigate();

  const handleUploadComplete = (items: any[]) => {
    toast.success(`Successfully uploaded ${items.length} items!`);
    // Navigate to wardrobe page after successful upload
    setTimeout(() => {
      navigate("/dashboard/wardrobe");
    }, 2000);
  };

  return <WardrobeUploadPage onUploadComplete={handleUploadComplete} />;
};

export default WardrobeUpload;

