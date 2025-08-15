import AttendanceUpload from '@/components/uploadTimein';

export default function UploadPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Employee Attendance Upload</h1>
        <p className="text-muted-foreground">
          Upload biometric system data to automatically process employee attendance records
        </p>
      </div>
      <AttendanceUpload />
    </div>
  );
}
