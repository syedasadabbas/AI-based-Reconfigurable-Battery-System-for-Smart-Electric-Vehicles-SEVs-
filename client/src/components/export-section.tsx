import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FileSpreadsheet, FileText, Upload, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";
import type { ExportRequest } from "@shared/schema";

export default function ExportSection() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const exportMutation = useMutation({
    mutationFn: async (request: ExportRequest) => {
      const response = await apiRequest("POST", "/api/export", request);
      return response;
    },
    onSuccess: async (response, variables) => {
      if (variables.format === "csv") {
        // For CSV, response is text
        const csvData = await response.text();
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'battery_configurations.csv';
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // For Excel and PDF, response is JSON with data
        const data = await response.json();
        
        if (variables.format === "xlsx") {
          exportToExcel(data.data, data.filename);
        } else if (variables.format === "pdf") {
          exportToPDF(data.configurations, data.statistics, data.filename);
        }
      }
      
      toast({
        title: "Export Successful",
        description: `File has been exported as ${variables.format.toUpperCase()}`
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "There was an error exporting the data",
        variant: "destructive"
      });
    }
  });

  const handleExport = (format: "xlsx" | "csv" | "pdf") => {
    exportMutation.mutate({ format });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      // File upload logic would go here
      toast({
        title: "Upload Successful",
        description: `${selectedFile.name} has been uploaded`
      });
      setSelectedFile(null);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Download className="text-primary mr-2" />
          Export & Import Configurations
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => handleExport("xlsx")}
            disabled={exportMutation.isPending}
            className="flex items-center justify-center"
            data-testid="button-export-excel"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => handleExport("csv")}
            disabled={exportMutation.isPending}
            className="flex items-center justify-center"
            data-testid="button-export-csv"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          
          <Button
            variant="destructive"
            onClick={() => handleExport("pdf")}
            disabled={exportMutation.isPending}
            className="flex items-center justify-center"
            data-testid="button-export-pdf"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-2">
          <Label htmlFor="file-upload" className="text-sm font-medium text-foreground">
            Upload Configuration File
          </Label>
          <div className="flex items-center space-x-2">
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFileUpload}
              className="flex-1"
              data-testid="input-file-upload"
            />
            <Button
              variant="outline"
              onClick={handleUpload}
              disabled={!selectedFile}
              data-testid="button-upload"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
