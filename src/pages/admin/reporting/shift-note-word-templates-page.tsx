import { useState } from 'react';
import {
  FileText,
  ArrowLeft,
  Download,
  Loader2,
  Search,
  Upload,
  Trash2,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/config/routes.config';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { cn } from '@/lib/utils';
import { useShiftNotes } from '@/hooks/use-shift-notes';
import { useDocxTemplates } from '@/hooks/use-docx-templates';
import { docxGenerator } from '@/lib/docx/generator';
import { mapShiftNoteToTags, SHIFT_NOTE_TEMPLATE_TAGS } from '@/lib/docx/shift-note-tags';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Container } from '@/components/common/container';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useRBAC, ACCESS_LEVEL } from '@/hooks/useRBAC';
import { useFileUpload, formatBytes } from '@/hooks/use-file-upload';
import { TagDictionarySheet } from '@/components/docx/tag-dictionary-sheet';

export function ShiftNoteWordTemplatesPage() {
  const navigate = useNavigate();
  const { hasAccess } = useRBAC();
  const canManage = hasAccess({
    resource: RBAC_MODULES.ACCESS_CONTROL,
    requiredLevel: ACCESS_LEVEL.FULL,
  });

  // --- Generation State ---
  const [selectedShiftNoteId, setSelectedShiftNoteId] = useState<string>('');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');

  // --- Data Hooks ---
  const { shiftNotes, loading: isLoadingShiftNotes } = useShiftNotes();

  const selectedShiftNote = shiftNotes.find(sn => sn.id === selectedShiftNoteId);

  const { 
    templates, 
    isLoading: isLoadingTemplates, 
    downloadTemplate,
    upload,
    deleteTemplate 
  } = useDocxTemplates('shift_notes');

  const [uploadState, uploadActions] = useFileUpload({
    accept: '.docx',
    multiple: false,
    onFilesAdded: async (addedFiles) => {
      const file = addedFiles[0].file;
      if (file instanceof File) {
        await upload(file);
      }
    },
  });

  // --- Handlers ---
  const handleGenerate = async () => {
    if (!selectedShiftNote || !selectedTemplateName) return;

    setIsGenerating(true);
    try {
      const templateBlob = await downloadTemplate(selectedTemplateName);
      const tagData = mapShiftNoteToTags(selectedShiftNote);

      const filename = `${selectedShiftNote.reference_id || 'ShiftNote'}_${selectedTemplateName.replace('.docx', '')}`;
      
      await docxGenerator.generate(templateBlob, tagData, filename);
      toast.success('Document generated successfully');
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error('Failed to generate document');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (val: any) => val ? new Date(val).toLocaleDateString('en-AU') : '';

  // --- Filters ---
  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(templateSearch.toLowerCase())
  );

  return (
    <Container className="py-6">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-5">
          <div className="flex flex-col gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(ROUTES.REPORTING)}
              className="w-fit mb-2"
            >
              <ArrowLeft className="size-4 me-1.5" />
              Back to Reports
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="size-7 text-violet-600" />
              Shift Note Word Reports
            </h1>
            <p className="text-gray-500 text-sm max-w-xl">
              Merge shift note data and clinical trackers into custom MS Word templates for participant files.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TagDictionarySheet tags={SHIFT_NOTE_TEMPLATE_TAGS} entityType="shift_note" />
          </div>
        </div>

        <Tabs defaultValue="generate" className="w-full">
          <div className="border-b border-gray-200/80 mb-6">
            <TabsList variant="line" size="md" className="-mb-px">
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <Download className="size-4" />
                Generate Document
              </TabsTrigger>
              {canManage && (
                <TabsTrigger value="manage" className="flex items-center gap-2">
                  <Upload className="size-4" />
                  Manage Templates
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="generate" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Selection */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                <Card className="border-violet-100 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="size-4 text-violet-600" />
                      1. Select Shift Note
                    </CardTitle>
                    <CardDescription>
                      Choose the shift note whose data will be merged.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Select
                        value={selectedShiftNoteId}
                        onValueChange={setSelectedShiftNoteId}
                        disabled={isLoadingShiftNotes}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Search / Select Shift Note..." />
                        </SelectTrigger>
                        <SelectContent>
                          {shiftNotes.map((sn) => (
                            <SelectItem key={sn.id} value={sn.id}>
                              <div className="flex flex-col items-start leading-tight">
                                <span className="font-medium text-sm">
                                  {sn.reference_id || 'No Ref'} - {sn.participant?.participant_name || 'Anonymous'}
                                </span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                  {sn.shift_time || 'General'} / {sn.shift_type || 'Active'} on {formatDate(sn.start_date)}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedShiftNote && (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{selectedShiftNote.reference_id || 'No Ref'}</span>
                          <Badge variant="outline" className="text-[9px] uppercase font-bold px-1.5 h-4">
                            {selectedShiftNote.shift_type || 'Active'}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Participant: <strong className="text-slate-700">{selectedShiftNote.participant?.participant_name || 'N/A'}</strong>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Staff: <strong className="text-slate-700">{selectedShiftNote.staff?.staff_name || 'N/A'}</strong>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Date: <strong className="text-slate-700">{formatDate(selectedShiftNote.start_date)}</strong>
                        </span>
                        <div className="mt-1 pt-2 border-t border-slate-200">
                          <p className="text-[11px] text-slate-500 italic line-clamp-2">
                            {selectedShiftNote.notes || selectedShiftNote.full_note || 'No description provided'}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button
                  className="w-full h-12 text-base font-bold shadow-md bg-violet-600 hover:bg-violet-700 text-white"
                  disabled={!selectedShiftNote || !selectedTemplateName || isGenerating}
                  onClick={handleGenerate}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="size-5 me-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="size-5 me-2" />
                      Generate Document
                    </>
                  )}
                </Button>
                
                <div className="p-6 bg-violet-50/50 rounded-2xl border border-violet-100/50">
                  <h4 className="text-violet-900 font-bold text-sm mb-2">Notice</h4>
                  <p className="text-violet-700/70 text-xs leading-relaxed">
                    Shift note templates help compile participant clinical logs and activity summaries for case manager reviews.
                  </p>
                </div>
              </div>

              {/* Right Column: Templates Grid */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <FileText className="size-5 text-gray-400" />
                    2. Select Template
                  </h2>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Filter shift note templates..."
                      className="pl-9 h-9 text-xs"
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                    />
                  </div>
                </div>

                {isLoadingTemplates ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
                    ))}
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                    <FileText className="size-12 text-slate-300 mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">No shift note templates available.</p>
                    <p className="text-xs text-muted-foreground mt-1">Administrators can upload templates in the Manage tab.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={cn(
                          "group relative p-5 border-2 rounded-2xl cursor-pointer transition-all duration-200",
                          selectedTemplateName === template.name
                            ? "border-violet-500 bg-violet-50 shadow-sm ring-1 ring-violet-500/20"
                            : "border-slate-100 bg-white hover:border-violet-300 hover:shadow-md"
                        )}
                        onClick={() => setSelectedTemplateName(template.name)}
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "size-12 rounded-xl flex items-center justify-center transition-colors",
                            selectedTemplateName === template.name ? "bg-violet-600 text-white" : "bg-violet-50 text-violet-600 group-hover:bg-violet-100"
                          )}>
                            <FileText className="size-6" />
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-bold text-gray-900 group-hover:text-violet-700 transition-colors truncate">
                              {template.name.replace('.docx', '')}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
                              Shift Note Template
                            </span>
                            <div className="flex items-center gap-3 mt-2">
                               <span className="text-[10px] text-slate-400">
                                 Size: {Math.round(template.size / 1024)} KB
                               </span>
                            </div>
                          </div>
                          {selectedTemplateName === template.name && (
                            <div className="absolute top-4 right-4 size-5 rounded-full bg-violet-600 flex items-center justify-center shadow-sm">
                              <Download className="size-3 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {canManage && (
            <TabsContent value="manage" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Template Library */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <div>
                        <CardTitle className="text-lg">Shift Note Template Library</CardTitle>
                        <CardDescription>
                          Manage templates for shift notes summaries and case manager files.
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-4">
                        {isLoadingTemplates ? (
                           <div className="space-y-3">
                             {[1, 2, 3].map((i) => (
                               <div key={i} className="h-16 rounded-lg bg-slate-100 animate-pulse" />
                             ))}
                           </div>
                        ) : templates.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg bg-slate-50/50">
                            <FileText className="size-12 text-slate-300 mb-3" />
                            <p className="text-sm text-muted-foreground font-medium">No templates found.</p>
                          </div>
                        ) : (
                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-slate-50 border-b">
                                <tr>
                                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Template Name</th>
                                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Updated</th>
                                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {templates.map((template) => (
                                  <tr key={template.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        <FileText className="size-4 text-violet-600" />
                                        <span className="font-medium text-gray-900">{template.name}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground text-xs">
                                      {new Date(template.updated_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="size-8 text-red-600 hover:bg-red-50"
                                        onClick={() => {
                                          if (confirm('Delete this template?')) deleteTemplate(template.name);
                                        }}
                                      >
                                        <Trash2 className="size-4" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right: Upload & Cheat Sheet */}
                <div className="flex flex-col gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Upload Shift Note Template</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div
                        {...uploadActions.handleDragOver}
                        onDragEnter={uploadActions.handleDragEnter}
                        onDragLeave={uploadActions.handleDragLeave}
                        onDrop={uploadActions.handleDrop}
                        className={cn(
                          "relative flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
                          uploadState.isDragging ? "border-violet-500 bg-violet-50" : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                        )}
                        onClick={uploadActions.openFileDialog}
                      >
                        <input {...uploadActions.getInputProps()} />
                        <Upload className={cn("size-8 mb-3", uploadState.isDragging ? "text-violet-500" : "text-slate-400")} />
                        <p className="text-sm font-medium">Click or drag document</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-violet-50 border-violet-100">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-violet-900">
                        <Download className="size-5" />
                        Cheat Sheet
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white animate-fade-in"
                        onClick={() => docxGenerator.downloadCheatSheet(SHIFT_NOTE_TEMPLATE_TAGS, 'InsideCare_Shift_Note_Tag_Cheat_Sheet', '7C3AED')}
                      >
                        Download Shift Note Tag Sheet
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Container>
  );
}
