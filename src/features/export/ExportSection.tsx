import { Clipboard, Download, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

type ExportSectionProps = {
  canExport: boolean;
  onClear: () => void;
  onCopy: () => void;
  onDownload: () => void;
};

export function ExportSection({
  canExport,
  onClear,
  onCopy,
  onDownload,
}: ExportSectionProps) {
  return (
    <Card
      description="انقل النص إلى برنامج المونتاج أو الترجمة أو النشر."
      title="التصدير"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          disabled={!canExport}
          icon={<Clipboard aria-hidden="true" size={16} strokeWidth={1.9} />}
          onClick={onCopy}
          variant="primary"
        >
          نسخ النص
        </Button>
        <Button
          disabled={!canExport}
          icon={<Download aria-hidden="true" size={16} strokeWidth={1.9} />}
          onClick={onDownload}
        >
          تحميل الملف النصي
        </Button>
        <Button
          icon={<Trash2 aria-hidden="true" size={16} strokeWidth={1.9} />}
          onClick={onClear}
          variant="danger"
        >
          مسح النتيجة
        </Button>
      </div>
    </Card>
  );
}
