import { useFormContext } from 'react-hook-form';
import FileDropBox from 'components/base/FileDropBox';

interface FileDropHandlerProps {
  imagesField: string;
}

interface ImageFile {
  id: string;
  file: File;
}

const EventFileDropHandler = ({ imagesField }: FileDropHandlerProps) => {
  const { watch, setValue } = useFormContext();

  const sectionImages: ImageFile[] = watch(imagesField) || [];

  const handleDrop = (acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({ id: file.name, file }));
    setValue(imagesField, [...sectionImages, ...newFiles]);
  };

  const handleRemove = (index: number) => {
    const updatedImages = sectionImages.filter((_, i) => i !== index);
    setValue(imagesField, updatedImages);
  };

  return (
    <FileDropBox
      onDrop={handleDrop}
      accept={{
        'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
        'video/*': ['.mp4', '.mov'],
      }}
      onRemove={handleRemove}
      defaultFiles={sectionImages.map((image) => image.file)}
    />
  );
};

export default EventFileDropHandler;
