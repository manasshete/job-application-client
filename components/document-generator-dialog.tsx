'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, FileText, Download, Upload, Sparkles, Lock, Star, Trash2, AlertCircle } from 'lucide-react'
import { DocumentDisclaimer } from './disclaimers'

interface SavedDocument {
  id: string
  document_type: 'cv' | 'cover_letter'
  name: string
  content: string
  is_default: boolean
  created_at: string
}

interface DocumentGeneratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobTitle: string
  company: string
  jobDescription: string
  isPremium: boolean
  subscriptionTier?: string
  documentsUsedThisMonth: number
}

const DOC_LIMITS: Record<string, number> = {
  free: 0,
  pro: 200,
  premium: 500,
}

type Step = 'prompt' | 'resume' | 'cover-letter' | 'results'

export function DocumentGeneratorDialog({
  open,
  onOpenChange,
  jobTitle,
  company,
  jobDescription,
  isPremium,
  subscriptionTier = 'free',
  documentsUsedThisMonth,
}: DocumentGeneratorDialogProps) {
  const [step, setStep] = useState<Step>('prompt')
  const [wantsResume, setWantsResume] = useState(true)
  const [wantsCoverLetter, setWantsCoverLetter] = useState(true)

  // Saved documents
  const [savedCVs, setSavedCVs] = useState<SavedDocument[]>([])
  const [savedCoverLetters, setSavedCoverLetters] = useState<SavedDocument[]>([])
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)
  const [selectedCVId, setSelectedCVId] = useState<string | null>(null)
  const [selectedCoverLetterId, setSelectedCoverLetterId] = useState<string | null>(null)

  // Resume state
  const [resumeText, setResumeText] = useState('')
  const [resumeFileName, setResumeFileName] = useState('')
  const [isParsingResume, setIsParsingResume] = useState(false)
  const [saveAsDefaultCV, setSaveAsDefaultCV] = useState(false)
  const [cvName, setCvName] = useState('')

  // Cover letter state
  const [coverLetterMode, setCoverLetterMode] = useState<'refine' | 'generate'>('generate')
  const [coverLetterInput, setCoverLetterInput] = useState('')
  const [applicantName, setApplicantName] = useState('')
  const [saveAsDefaultCL, setSaveAsDefaultCL] = useState(false)
  const [clName, setClName] = useState('')

  // Results state
  const [tailoredResume, setTailoredResume] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  const docLimit = DOC_LIMITS[subscriptionTier] ?? 0
  const remainingDocs = Math.max(0, docLimit - documentsUsedThisMonth)
  const isOverLimit = documentsUsedThisMonth >= docLimit && docLimit > 0
  const hasDocGeneration = isPremium || subscriptionTier === 'pro'

  // Load saved documents when dialog opens
  useEffect(() => {
    if (open && hasDocGeneration) {
      loadSavedDocuments()
    }
  }, [open, hasDocGeneration])

  const loadSavedDocuments = async () => {
    setIsLoadingDocs(true)
    try {
      const res = await fetch('/api/user-documents')
      const data = await res.json()
      if (Array.isArray(data)) {
        setSavedCVs(data.filter((d: SavedDocument) => d.document_type === 'cv'))
        setSavedCoverLetters(data.filter((d: SavedDocument) => d.document_type === 'cover_letter'))
        
        // Auto-select default if available
        const defaultCV = data.find((d: SavedDocument) => d.document_type === 'cv' && d.is_default)
        const defaultCL = data.find((d: SavedDocument) => d.document_type === 'cover_letter' && d.is_default)
        if (defaultCV) {
          setSelectedCVId(defaultCV.id)
          setResumeText(defaultCV.content)
        }
        if (defaultCL) {
          setSelectedCoverLetterId(defaultCL.id)
          setCoverLetterInput(defaultCL.content)
          setCoverLetterMode('refine')
        }
      }
    } catch (err) {
      console.error('Failed to load documents:', err)
    } finally {
      setIsLoadingDocs(false)
    }
  }

  const saveDocument = async (type: 'cv' | 'cover_letter', name: string, content: string, isDefault: boolean) => {
    try {
      await fetch('/api/user-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: type,
          name,
          content,
          isDefault,
        }),
      })
      await loadSavedDocuments()
    } catch (err) {
      console.error('Failed to save document:', err)
    }
  }

  const deleteDocument = async (id: string) => {
    try {
      await fetch(`/api/user-documents?id=${id}`, { method: 'DELETE' })
      await loadSavedDocuments()
      if (selectedCVId === id) {
        setSelectedCVId(null)
        setResumeText('')
      }
      if (selectedCoverLetterId === id) {
        setSelectedCoverLetterId(null)
        setCoverLetterInput('')
      }
    } catch (err) {
      console.error('Failed to delete document:', err)
    }
  }

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsParsingResume(true)
    setResumeFileName(file.name)
    setSelectedCVId(null)

    try {
      if (file.type === 'text/plain') {
        const text = await file.text()
        setResumeText(text)
      } else if (file.name.endsWith('.docx') || file.type.includes('wordprocessingml')) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/parse-resume', { method: 'POST', body: formData })
        const data = await res.json()
        if (data.text) setResumeText(data.text)
        else setError('Could not parse document. Please paste your resume as plain text.')
      } else {
        setError('Please upload a .txt or .docx file, or paste your resume as plain text below.')
      }
    } catch {
      setError('Failed to read file. Please paste your resume as plain text.')
    } finally {
      setIsParsingResume(false)
    }
  }, [])

  const selectSavedCV = (doc: SavedDocument) => {
    setSelectedCVId(doc.id)
    setResumeText(doc.content)
    setResumeFileName('')
  }

  const selectSavedCoverLetter = (doc: SavedDocument) => {
    setSelectedCoverLetterId(doc.id)
    setCoverLetterInput(doc.content)
    setCoverLetterMode('refine')
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError('')

    try {
      // Save documents if requested
      if (saveAsDefaultCV && resumeText.trim() && cvName.trim()) {
        await saveDocument('cv', cvName, resumeText, true)
      }
      if (saveAsDefaultCL && coverLetterInput.trim() && clName.trim() && coverLetterMode === 'refine') {
        await saveDocument('cover_letter', clName, coverLetterInput, true)
      }

      const promises: Promise<void>[] = []

      if (wantsResume && resumeText.trim()) {
        promises.push(
          fetch('/api/tailor-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resumeText, jobTitle, jobDescription, company }),
          })
            .then((r) => r.json())
            .then((data) => {
              if (data.error) throw new Error(data.error)
              setTailoredResume(data.tailoredResume)
            })
        )
      }

      if (wantsCoverLetter && coverLetterInput.trim()) {
        promises.push(
          fetch('/api/generate-cover-letter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: coverLetterMode,
              userInput: coverLetterInput,
              jobTitle,
              jobDescription,
              company,
              applicantName,
            }),
          })
            .then((r) => r.json())
            .then((data) => {
              if (data.error) throw new Error(data.error)
              setCoverLetter(data.coverLetter)
            })
        )
      }

      await Promise.all(promises)
      setStep('results')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Generation failed. Please try again.'
      setError(message)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadAsTxt = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadAsPDF = async (content: string, filename: string) => {
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, filename }),
      })
      
      if (!res.ok) {
        throw new Error(`PDF generation failed: ${res.status}`)
      }
      
      const arrayBuffer = await res.arrayBuffer()
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error('PDF is empty')
      }
      
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      downloadAsTxt(content, filename.replace('.pdf', '.txt'))
    }
  }

  const resetDialog = () => {
    setStep('prompt')
    setResumeText('')
    setResumeFileName('')
    setCoverLetterInput('')
    setApplicantName('')
    setTailoredResume('')
    setCoverLetter('')
    setError('')
    setWantsResume(true)
    setWantsCoverLetter(true)
    setSaveAsDefaultCV(false)
    setSaveAsDefaultCL(false)
    setCvName('')
    setClName('')
    setSelectedCVId(null)
    setSelectedCoverLetterId(null)
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) resetDialog()
    onOpenChange(val)
  }

  if (!hasDocGeneration) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              Premium Feature
            </DialogTitle>
            <DialogDescription>
              AI-tailored resumes and cover letters are available on Pro and Premium plans.
            </DialogDescription>
          </DialogHeader>
          <DocumentDisclaimer />
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-sm font-medium">Pro — £10/month includes:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• AI-tailored resumes for each job</li>
                <li>• AI-generated cover letters</li>
                <li>• Download as PDF</li>
                <li>• Up to 200 documents/month</li>
                <li>• 50 AI extractions/month</li>
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-sm font-medium">Premium — £20/month includes:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Everything in Pro</li>
                <li>• Up to 500 documents/month</li>
                <li>• Unlimited AI extractions</li>
              </ul>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => handleOpenChange(false)}>
              Maybe Later
            </Button>
            <Button className="flex-1" onClick={() => handleOpenChange(false)}>
              Upgrade to Pro
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Document Generator
            </DialogTitle>
            <Badge 
              variant={isOverLimit ? "destructive" : "outline"} 
              className="text-xs"
            >
              {isOverLimit 
                ? `Limit reached (${documentsUsedThisMonth}/${docLimit})`
                : `${remainingDocs}/${docLimit} remaining`
              }
            </Badge>
          </div>
          <DialogDescription>
            Tailoring documents for{' '}
            <span className="font-medium text-foreground">
              {jobTitle} at {company}
            </span>
          </DialogDescription>
        </DialogHeader>

        {isOverLimit && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/30">
            <p className="font-medium mb-1">Document limit reached</p>
            <p>You've used all {docLimit} documents for this month. Upgrade to {subscriptionTier === 'pro' ? 'Premium' : 'a higher plan'} for more documents.</p>
          </div>
        )}

        <DocumentDisclaimer />

        {error && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Step: Prompt */}
        {step === 'prompt' && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              What would you like to generate for this job?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWantsResume(!wantsResume)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  wantsResume
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <FileText className="mb-2 h-5 w-5" />
                <p className="text-sm font-medium">Tailored Resume</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Rephrase and reorder your existing CV to match this role
                </p>
              </button>
              <button
                type="button"
                onClick={() => setWantsCoverLetter(!wantsCoverLetter)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  wantsCoverLetter
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <FileText className="mb-2 h-5 w-5" />
                <p className="text-sm font-medium">Cover Letter</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Generate from key points or refine your own draft
                </p>
              </button>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                disabled={!wantsResume && !wantsCoverLetter}
                onClick={() => setStep(wantsResume ? 'resume' : 'cover-letter')}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step: Resume */}
        {step === 'resume' && (
          <div className="space-y-4 py-2">
            {/* Saved CVs Section */}
            {savedCVs.length > 0 && (
              <div className="space-y-2">
                <Label>Use a saved CV</Label>
                <div className="grid gap-2 max-h-32 overflow-y-auto">
                  {savedCVs.map((doc) => (
                    <div
                      key={doc.id}
                      className={`flex items-center justify-between rounded-md border p-2 cursor-pointer transition-colors ${
                        selectedCVId === doc.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                      onClick={() => selectSavedCV(doc)}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{doc.name}</span>
                        {doc.is_default && (
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteDocument(doc.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or upload new</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Upload your resume (.txt or .docx)</Label>
              <div className="flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  <Upload className="h-4 w-4" />
                  {resumeFileName || 'Choose file'}
                  <input
                    type="file"
                    accept=".txt,.docx"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
                {isParsingResume && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Or paste your resume as plain text</Label>
              <Textarea
                value={resumeText}
                onChange={(e) => {
                  setResumeText(e.target.value)
                  setSelectedCVId(null)
                }}
                placeholder="Paste your full resume here..."
                rows={8}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground text-right">
                {resumeText.length.toLocaleString()} / 15,000 characters
              </p>
            </div>

            {/* Save option */}
            {!selectedCVId && resumeText.trim() && (
              <div className="space-y-2 rounded-md border border-border p-3 bg-muted/30">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="save-cv"
                    checked={saveAsDefaultCV}
                    onCheckedChange={(c) => setSaveAsDefaultCV(!!c)}
                  />
                  <label htmlFor="save-cv" className="text-sm cursor-pointer">
                    Save this CV for future use
                  </label>
                </div>
                {saveAsDefaultCV && (
                  <Input
                    value={cvName}
                    onChange={(e) => setCvName(e.target.value)}
                    placeholder="Name this CV (e.g. 'Software Engineer CV')"
                    className="mt-2"
                  />
                )}
              </div>
            )}

            <div className="flex justify-between gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep('prompt')}>
                Back
              </Button>
              <Button
                disabled={!resumeText.trim()}
                onClick={() => setStep(wantsCoverLetter ? 'cover-letter' : 'results')}
              >
                {wantsCoverLetter ? 'Continue to Cover Letter' : 'Generate'}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Cover Letter */}
        {step === 'cover-letter' && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Your name (for the letter)</Label>
              <Input
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder="e.g. Alex Johnson"
              />
            </div>

            {/* Saved Cover Letters Section */}
            {savedCoverLetters.length > 0 && (
              <div className="space-y-2">
                <Label>Use a saved cover letter as base</Label>
                <div className="grid gap-2 max-h-24 overflow-y-auto">
                  {savedCoverLetters.map((doc) => (
                    <div
                      key={doc.id}
                      className={`flex items-center justify-between rounded-md border p-2 cursor-pointer transition-colors ${
                        selectedCoverLetterId === doc.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                      onClick={() => selectSavedCoverLetter(doc)}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{doc.name}</span>
                        {doc.is_default && (
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteDocument(doc.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>How would you like to create your cover letter?</Label>
              <Tabs value={coverLetterMode} onValueChange={(v) => setCoverLetterMode(v as 'refine' | 'generate')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="generate">Write from Key Points</TabsTrigger>
                  <TabsTrigger value="refine">Refine My Draft</TabsTrigger>
                </TabsList>
                <TabsContent value="generate" className="mt-3">
                  <Textarea
                    value={coverLetterInput}
                    onChange={(e) => {
                      setCoverLetterInput(e.target.value)
                      setSelectedCoverLetterId(null)
                    }}
                    placeholder={`Enter the key points or details you want included, e.g.:\n- 3 years experience in React development\n- Led a team of 4 engineers\n- Passionate about user experience\n- Why I want to work at ${company}`}
                    rows={8}
                  />
                </TabsContent>
                <TabsContent value="refine" className="mt-3">
                  <Textarea
                    value={coverLetterInput}
                    onChange={(e) => {
                      setCoverLetterInput(e.target.value)
                      setSelectedCoverLetterId(null)
                    }}
                    placeholder="Paste your draft cover letter here and the AI will refine it to better match this role..."
                    rows={8}
                  />
                  {/* Save option for cover letter drafts */}
                  {!selectedCoverLetterId && coverLetterInput.trim() && (
                    <div className="space-y-2 rounded-md border border-border p-3 bg-muted/30 mt-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="save-cl"
                          checked={saveAsDefaultCL}
                          onCheckedChange={(c) => setSaveAsDefaultCL(!!c)}
                        />
                        <label htmlFor="save-cl" className="text-sm cursor-pointer">
                          Save this cover letter template for future use
                        </label>
                      </div>
                      {saveAsDefaultCL && (
                        <Input
                          value={clName}
                          onChange={(e) => setClName(e.target.value)}
                          placeholder="Name this template (e.g. 'General Cover Letter')"
                          className="mt-2"
                        />
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
            <div className="flex justify-between gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep(wantsResume ? 'resume' : 'prompt')}
              >
                Back
              </Button>
              <Button
                disabled={!coverLetterInput.trim() || isGenerating || isOverLimit}
                onClick={handleGenerate}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : isOverLimit ? (
                  <>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Limit Reached
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Documents
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Results */}
        {step === 'results' && (
          <div className="space-y-4 py-2">
            <Tabs defaultValue={tailoredResume ? 'resume' : 'cover-letter'}>
              <TabsList className="grid w-full grid-cols-2">
                {tailoredResume && <TabsTrigger value="resume">Tailored Resume</TabsTrigger>}
                {coverLetter && <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>}
              </TabsList>

              {tailoredResume && (
                <TabsContent value="resume" className="space-y-3 mt-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Review your tailored resume below. No new experiences have been added.
                    </p>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadAsTxt(tailoredResume, `resume-${company}.txt`)}
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        .txt
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => downloadAsPDF(tailoredResume, `resume-${company}.pdf`)}
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        PDF
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={tailoredResume}
                    onChange={(e) => setTailoredResume(e.target.value)}
                    rows={16}
                    className="font-mono text-xs"
                  />
                </TabsContent>
              )}

              {coverLetter && (
                <TabsContent value="cover-letter" className="space-y-3 mt-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Review and edit your cover letter below.
                    </p>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadAsTxt(coverLetter, `cover-letter-${company}.txt`)}
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        .txt
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => downloadAsPDF(coverLetter, `cover-letter-${company}.pdf`)}
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        PDF
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={16}
                    className="text-sm"
                  />
                </TabsContent>
              )}
            </Tabs>

            <div className="flex justify-between gap-2 pt-2">
              <Button variant="outline" onClick={resetDialog}>
                Generate Another
              </Button>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
