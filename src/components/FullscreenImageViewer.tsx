import { Image } from "antd";

type Props = {
  open: boolean;
  images: string[];     // array of src urls
  index: number;        // which image to start from
  onClose: () => void;
  onIndexChange?: (i: number) => void;
};

/** Full-screen viewer using AntD's Image.PreviewGroup (controlled) */
export default function FullscreenImageViewer({
  open,
  images,
  index,
  onClose,
  onIndexChange,
}: Props) {
  return (
    // we render images invisibly; the preview UI is full-screen
    <div className="hidden">
      <Image.PreviewGroup
        preview={{
          visible: open,
          current: index,
          onVisibleChange: (v) => {
            if (!v) onClose();
          },
          onChange: (curr) => onIndexChange?.(curr),
        }}
      >
        {images.map((src, i) => (
          <Image key={i} src={src} />
        ))}
      </Image.PreviewGroup>
    </div>
  );
}
