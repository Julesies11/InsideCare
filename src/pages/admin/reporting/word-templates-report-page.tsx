import { useState } from 'react';
import {
  FileText,
  ArrowLeft,
  Users as UsersIcon,
  Download,
  Loader2,
  Search,
  Upload,
  Copy,
  Trash2,
  Info,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/config/routes.config';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { cn } from '@/lib/utils';
import { useActiveParticipants, useParticipant } from '@/hooks/use-participants';
import { useDocxTemplates } from '@/hooks/use-docx-templates';
import { docxGenerator } from '@/lib/docx/generator';
import { mapParticipantToTags, PARTICIPANT_TEMPLATE_TAGS } from '@/lib/docx/participant-tags';
import { participantDetailsApi } from '@/api/participant-details.api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SecureAvatar } from '@/components/ui/secure-avatar';
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
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { TagDictionarySheet } from '@/components/docx/tag-dictionary-sheet';

export function WordTemplatesReportPage() {
  const navigate = useNavigate();
  const { hasAccess } = useRBAC();
  const canManage = hasAccess({
    resource: RBAC_MODULES.ACCESS_CONTROL,
    requiredLevel: ACCESS_LEVEL.FULL,
  });

  // --- Generation State ---
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');

  // --- Data Hooks ---
  const { participants: allParticipants, loading: isLoadingParticipants } =
    useActiveParticipants();

  const { participant } = useParticipant(selectedParticipantId || undefined);

  const { 
    templates, 
    isLoading: isLoadingTemplates, 
    downloadTemplate,
    upload,
    deleteTemplate 
  } = useDocxTemplates('participants');

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
    if (!participant || !selectedTemplateName) return;

    setIsGenerating(true);
    try {
      // Fetch child relations in parallel
      const [medications, goalsData, contacts, providers] = await Promise.all([
        participantDetailsApi.medications.list(participant.id),
        participantDetailsApi.goals.list(participant.id),
        participantDetailsApi.contacts.list(participant.id),
        participantDetailsApi.providers.list(participant.id),
      ]);

      const templateBlob = await downloadTemplate(selectedTemplateName);
      const tagData = mapParticipantToTags(participant, {
        medications,
        goals: goalsData,
        contacts,
        providers,
      });

      const filename = `${(participant.participant_name || 'Participant').replace(/\s+/g, '_')}_${selectedTemplateName.replace('.docx', '')}`;
      
      await docxGenerator.generate(templateBlob, tagData, filename);
      toast.success('Document generated successfully');
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error('Failed to generate document');
    } finally {
      setIsGenerating(false);
    }
  };
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return '??';
    return name.split(' ').map((word) => word[0]).join('').toUpperCase().slice(0, 2);
  };

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
              <FileText className="size-7 text-blue-600" />
              Participant Word Reports
            </h1>
            <p className="text-gray-500 text-sm max-w-xl">
              Generate merged MS Word documents or manage your organizational templates.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TagDictionarySheet tags={PARTICIPANT_TEMPLATE_TAGS} entityType="participant" />
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
                <Card className="border-blue-100 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <UsersIcon className="size-4 text-primary" />
                      1. Select Participant
                    </CardTitle>
                    <CardDescription>
                      Choose the participant whose data will be merged.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Select
                        value={selectedParticipantId}
                        onValueChange={setSelectedParticipantId}
                        disabled={isLoadingParticipants}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Search / Select Participant..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allParticipants.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              <div className="flex items-center gap-2.5">
                                <SecureAvatar
                                  src={p.photo_url}
                                  initials={getInitials(p.participant_name)}
                                  className="size-6 shrink-0 rounded-full"
                                  bucket={STORAGE_BUCKETS.PARTICIPANT_PHOTOS}
                                />
                                <div className="flex flex-col items-start leading-tight">
                                  <span className="font-medium text-sm">{p.participant_name}</span>
                                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                    {p.houses?.house_name || 'No House'}
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {participant && (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
                        <SecureAvatar
                          src={participant.photo_url}
                          initials={getInitials(participant.participant_name)}
                          className="size-12 rounded-lg"
                          bucket={STORAGE_BUCKETS.PARTICIPANT_PHOTOS}
                        />
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{participant.participant_name}</span>
                          <span className="text-xs text-muted-foreground">NDIS: {participant.ndis_number || 'N/A'}</span>
                          <Badge variant="outline" className="w-fit mt-1 text-[9px] uppercase font-bold px-1.5 h-4">
                            {participant.status}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button
                  className="w-full h-12 text-base font-bold shadow-md"
                  disabled={!participant || !selectedTemplateName || isGenerating}
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
                
                <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                  <h4 className="text-blue-900 font-bold text-sm mb-2">Pro Tip</h4>
                  <p className="text-blue-700/70 text-xs leading-relaxed">
                    The generated document will download directly to your computer. 
                    You can then open it in Microsoft Word or upload it to Google Docs for final editing.
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
                      placeholder="Filter templates..."
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
                    <p className="text-sm text-muted-foreground font-medium">No templates available.</p>
                    <p className="text-xs text-muted-foreground mt-1">Please contact an administrator to upload templates.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={cn(
                          "group relative p-5 border-2 rounded-2xl cursor-pointer transition-all duration-200",
                          selectedTemplateName === template.name
                            ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                            : "border-slate-100 bg-white hover:border-slate-300 hover:shadow-md"
                        )}
                        onClick={() => setSelectedTemplateName(template.name)}
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "size-12 rounded-xl flex items-center justify-center transition-colors",
                            selectedTemplateName === template.name ? "bg-primary text-white" : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                          )}>
                            <FileText className="size-6" />
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-bold text-gray-900 group-hover:text-primary transition-colors truncate">
                              {template.name.replace('.docx', '')}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
                              DOCX Template
                            </span>
                            <div className="flex items-center gap-3 mt-2">
                               <span className="text-[10px] text-slate-400">
                                 Size: {Math.round(template.size / 1024)} KB
                               </span>
                               <span className="text-[10px] text-slate-400">
                                 Updated: {new Date(template.updated_at).toLocaleDateString()}
                               </span>
                            </div>
                          </div>
                          {selectedTemplateName === template.name && (
                            <div className="absolute top-4 right-4 size-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
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
                        <CardTitle className="text-lg">Template Library</CardTitle>
                        <CardDescription>
                          Manage the organizational templates available for document generation.
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
                            <p className="text-xs text-muted-foreground">Upload your first .docx template to get started.</p>
                          </div>
                        ) : (
                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-slate-50 border-b">
                                <tr>
                                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Template Name</th>
                                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Last Updated</th>
                                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Size</th>
                                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {templates.map((template) => (
                                  <tr key={template.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        <FileText className="size-4 text-blue-600" />
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                          {template.name}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                      {new Date(template.updated_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                      {formatBytes(template.size)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="size-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                          onClick={() => {
                                            if (confirm('Are you sure you want to delete this template?')) {
                                              deleteTemplate(template.name);
                                            }
                                          }}
                                        >
                                          <Trash2 className="size-4" />
                                        </Button>
                                      </div>
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
                      <CardTitle className="text-lg">Upload Template</CardTitle>
                      <CardDescription>
                        Upload or replace a .docx template file.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div
                        {...uploadActions.handleDragOver}
                        onDragEnter={uploadActions.handleDragEnter}
                        onDragLeave={uploadActions.handleDragLeave}
                        onDrop={uploadActions.handleDrop}
                        className={cn(
                          "relative flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
                          uploadState.isDragging ? "border-primary bg-primary/5" : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                        )}
                        onClick={uploadActions.openFileDialog}
                      >
                        <input {...uploadActions.getInputProps()} />
                        <Upload className={cn("size-8 mb-3", uploadState.isDragging ? "text-primary" : "text-slate-400")} />
                        <p className="text-sm font-medium text-slate-700">Click or drag document</p>
                        <p className="text-xs text-slate-500 mt-1">Supports .docx files only</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/20">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-blue-900 dark:text-blue-100">
                        <Download className="size-5" />
                        Cheat Sheet
                      </CardTitle>
                      <CardDescription className="text-blue-700/70 dark:text-blue-400/70">
                        Download a Word document containing all available tags for easy copy-pasting.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => docxGenerator.downloadCheatSheet(PARTICIPANT_TEMPLATE_TAGS, 'InsideCare_Participant_Tag_Cheat_Sheet', '2563EB')}
                      >
                        Download Tag Cheat Sheet
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
